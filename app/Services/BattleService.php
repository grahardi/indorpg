<?php

namespace App\Services;

use App\Models\Battle;
use App\Models\BattleParticipant;
use App\Models\Character;
use App\Models\Encounter;
use App\Models\GameSetting;
use App\Models\Monster;
use App\Models\Skill;
use Illuminate\Support\Collection;

class BattleService
{
    private const MAX_ROUNDS = 20; // safety cap biar gak infinite loop

    /**
     * Mulai battle baru dari sebuah Encounter + karakter yang dipilih (2-3 orang),
     * langsung auto-resolve sampai selesai (semi-auto: player cuma pilih party,
     * pertarungan jalan otomatis).
     */
    public function startBattle(Encounter $encounter, array $characterIds): Battle
    {
        $monster = $encounter->monster;
        $characters = Character::with(['subclass.skills', 'skills'])->whereIn('id', $characterIds)->get();

        // Level monster di-roll dinamis: max = level tertinggi party + bonus (setting
        // admin, default +3). Stat monster di-scale sesuai level hasil roll ini pakai
        // rasio kenaikan (setting admin, default x1.5 tiap level, kompon berlapis).
        $encounterLevel = $this->rollMonsterLevel($monster, $characters);
        $scaledStats = $this->scaledMonsterStats($monster, $encounterLevel);

        $battle = Battle::create([
            'encounter_id' => $encounter->id,
            'monster_id' => $monster->id,
            'monster_level' => $encounterLevel,
            'monster_stats' => $scaledStats,
            'monster_current_hp' => $scaledStats['hp'],
            'status' => 'ongoing',
            'round_number' => 1,
            'battle_log' => [],
        ]);

        foreach ($characters as $character) {
            $loadout = $this->resolveLoadout($character);
            $loadoutIds = $loadout->pluck('id')->toArray();

            // Ultimate (tier 3) sengaja di-set udah "dipakai" di ronde 0, jadi dari
            // awal battle langsung cooldown - gak bisa langsung ultimate di ronde 1.
            $initialCooldowns = $loadout
                ->where('tier', 3)
                ->mapWithKeys(fn ($skill) => [$skill->id => 0])
                ->toArray();

            BattleParticipant::create([
                'battle_id' => $battle->id,
                'character_id' => $character->id,
                'current_hp' => $character->current_hp,
                'current_stamina' => $character->current_stamina,
                'current_mana' => $character->current_mana,
                'skill_cooldowns' => $initialCooldowns,
                'loadout_skill_ids' => $loadoutIds,
                'is_alive' => true,
            ]);
        }

        return $this->autoResolve($battle);
    }

    /**
     * Level monster buat encounter ini: acak antara level dasar monster (di
     * tabel monsters) sampai (level tertinggi party + bonus admin). Kalau
     * level dasar monster udah lebih tinggi dari batas atas itu, ya pakai
     * level dasarnya aja (gak pernah di-downgrade).
     */
    private function rollMonsterLevel(Monster $monster, Collection $characters): int
    {
        $partyMaxLevel = (int) $characters->max('level');
        $bonus = GameSetting::getInt('monster_max_level_bonus', 3);
        $maxLevel = max($monster->level, $partyMaxLevel + $bonus);

        return random_int($monster->level, $maxLevel);
    }

    /**
     * Scale stat monster (hp, damage, defense, exp_reward) dari level dasarnya
     * ke level encounter, pakai rasio kompon berlapis: stat = base * ratio^(level-base).
     * Agility/accuracy/strong-weak GAK di-scale (persentase/pola combat, bukan power).
     */
    public function scaledMonsterStats(Monster $monster, int $targetLevel): array
    {
        $ratio = GameSetting::getFloat('monster_level_growth_ratio', 1.5);
        $factor = $ratio ** ($targetLevel - $monster->level);

        return [
            'level' => $targetLevel,
            'hp' => max(1, (int) round($monster->hp * $factor)),
            'physical_damage' => max(1, (int) round($monster->physical_damage * $factor)),
            'physical_defense' => max(0, (int) round($monster->physical_defense * $factor)),
            'magic_damage' => max(1, (int) round($monster->magic_damage * $factor)),
            'magic_defense' => max(0, (int) round($monster->magic_defense * $factor)),
            'exp_reward' => max(1, (int) round($monster->exp_reward * $factor)),
        ];
    }

    /**
     * Loadout tempur = 4 skill tier 1 + 1 skill tier 3 (ultimate). Kalau karakter
     * udah punya loadout manual (via character_skills pivot, diatur di halaman
     * profil), pakai itu. Kalau belum (NPC atau karakter yang belum di-setting),
     * random 4+1 dari skill pool subclass-nya - biar tetap kepake buat level rendah.
     */
    private function resolveLoadout(Character $character): \Illuminate\Support\Collection
    {
        if ($character->skills->count() === 5) {
            return $character->skills;
        }

        $pool = $character->subclass->skills;
        $tier1 = $pool->where('tier', 1)->shuffle()->take(4);
        $tier3 = $pool->where('tier', 3)->shuffle()->take(1);

        return $tier1->concat($tier3);
    }

    /**
     * Jalankan seluruh battle otomatis dari awal sampai menang/kalah.
     * Tiap step dicatat sebagai snapshot (HP monster + semua participant saat itu)
     * biar frontend bisa "putar ulang" secara animasi.
     */
    public function autoResolve(Battle $battle): Battle
    {
        $battle->load(['participants.character.subclass.gameClass', 'participants.character.subclass.skills', 'monster']);
        $monster = $battle->monster;
        $stats = $battle->monster_stats; // snapshot stat yang udah di-scale sesuai level encounter

        $log = [];
        $log[] = $this->snapshot($battle, "{$monster->name} (Lv.{$battle->monster_level}) muncul menghadang!");

        $round = 1;

        while ($battle->monster_current_hp > 0 && $this->anyAlive($battle) && $round <= self::MAX_ROUNDS) {
            // Regen stamina/mana tiap awal ronde, dibatasi pool max efektif karakter
            // (base subclass + bonus upgrade dari EXP).
            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive) {
                    continue;
                }
                $character = $participant->character;

                $participant->current_stamina = min($character->effective_base_sp, $participant->current_stamina + $character->effective_stamina_regen);
                $participant->current_mana = min($character->effective_base_mp, $participant->current_mana + $character->effective_mana_regen);
            }

            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                    continue;
                }

                $skill = $this->autoPickSkill($participant, $round);
                if (! $skill) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} belum ada skill siap pakai, cuma bertahan.");
                    continue;
                }

                $character = $participant->character;

                $participant->current_stamina = max(0, $participant->current_stamina - $skill->stamina_cost);
                $participant->current_mana = max(0, $participant->current_mana - $skill->mana_cost);

                // Cek Agility (ofensif) karakter vs evasion bawaan monster - bisa meleset total.
                $hitChance = max(50, min(99, 100 + $character->effective_accuracy - 90 - $monster->agility));
                if (random_int(1, 100) > $hitChance) {
                    $participant->save();
                    $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: MELESET!", $character->id, $skill->id);
                    continue;
                }

                $offenseStat = $skill->scaling_stat === 'magic' ? $character->effective_magic_damage : $character->effective_physical_damage;
                $defenseStat = $skill->scaling_stat === 'magic' ? $stats['magic_defense'] : $stats['physical_defense'];

                $raw = $offenseStat * (float) $skill->base_multiplier;
                $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);

                $pattern = "{$skill->combat_range}_{$skill->scaling_stat}";
                $note = '';
                if ($pattern === $monster->weak_against) {
                    $mitigated *= 1.5;
                    $note = ' (Efektif!)';
                } elseif ($pattern === $monster->strong_against) {
                    $mitigated *= 0.5;
                    $note = ' (Kurang efektif...)';
                }

                // Roll critical hit.
                $isCrit = random_int(1, 100) <= $character->effective_critical_luck;
                if ($isCrit) {
                    $mitigated *= (1 + $character->effective_critical_hit / 100);
                    $note .= ' CRITICAL!';
                }

                $damage = max(1, (int) round($mitigated));
                $battle->monster_current_hp = max(0, $battle->monster_current_hp - $damage);
                $participant->save();

                $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: {$damage} damage ke {$monster->name}{$note}", $character->id, $skill->id);

                if ($battle->monster_current_hp <= 0) {
                    $log[] = $this->snapshot($battle, "{$monster->name} kalah!");
                    break;
                }
            }

            if ($battle->monster_current_hp > 0) {
                $alive = $battle->participants()->where('is_alive', true)->get();

                if ($alive->isNotEmpty()) {
                    $target = $alive->random();
                    $character = $target->character;

                    // Cek akurasi monster vs Evasion (defensif) karakter.
                    $hitChance = max(50, min(99, 100 + $monster->accuracy - 90 - $character->effective_evasion));
                    if (random_int(1, 100) > $hitChance) {
                        $log[] = $this->snapshot($battle, "{$monster->name} menyerang {$target->character->name}: MELESET!", null, null, true);
                    } else {
                        $useMagic = $stats['magic_damage'] > $stats['physical_damage'];
                        $offenseStat = $useMagic ? $stats['magic_damage'] : $stats['physical_damage'];
                        $defenseStat = $useMagic ? $character->effective_magic_defense : $character->effective_physical_defense;

                        $raw = $offenseStat;
                        $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);
                        $damage = max(1, (int) round($mitigated));

                        $target->current_hp = max(0, $target->current_hp - $damage);
                        $justFainted = false;
                        if ($target->current_hp <= 0) {
                            $target->is_alive = false;
                            $justFainted = true;
                        }
                        $target->save();

                        $msg = "{$monster->name} menyerang {$target->character->name}: {$damage} damage.";
                        if ($justFainted) {
                            $msg .= " {$target->character->name} tumbang!";
                        }
                        $log[] = $this->snapshot($battle, $msg, null, null, true);
                    }
                }
            }

            $round++;
            $battle->round_number = $round;
        }

        if ($battle->monster_current_hp <= 0) {
            $battle->status = 'won';
            $this->onVictory($battle, $log);
        } elseif (! $this->anyAlive($battle)) {
            $battle->status = 'lost';
            $log[] = $this->snapshot($battle, 'Seluruh party tumbang. Kalah...');
        } else {
            // Kena cap max round tanpa hasil -> anggap seri/kabur biar gak nge-hang.
            $battle->status = 'fled';
            $log[] = $this->snapshot($battle, 'Pertarungan terlalu lama, party mundur.');
        }

        $battle->battle_log = $log;
        $battle->save();

        return $battle->fresh(['participants.character.subclass', 'monster']);
    }

    /**
     * AI: pilih skill ber-multiplier tertinggi yang affordable DAN gak lagi cooldown.
     * cooldown_seconds ditranslate ke "berapa ronde terkunci" (asumsi ~2.5 detik/ronde,
     * sesuai pacing animasi playback di frontend).
     */
    private function autoPickSkill(BattleParticipant $participant, int $currentRound): ?Skill
    {
        $loadoutIds = $participant->loadout_skill_ids ?? [];
        $skills = $participant->character->subclass->skills->whereIn('id', $loadoutIds);
        $cooldowns = $participant->skill_cooldowns ?? [];

        $usable = $skills->filter(function (Skill $skill) use ($participant, $cooldowns, $currentRound) {
            $affordable = $skill->stamina_cost <= $participant->current_stamina
                && $skill->mana_cost <= $participant->current_mana;

            if (! $affordable) {
                return false;
            }

            $lastUsedRound = $cooldowns[$skill->id] ?? null;
            if ($lastUsedRound === null) {
                return true;
            }

            $roundsLocked = max(1, (int) ceil($skill->cooldown_seconds / 2.5));

            return ($currentRound - $lastUsedRound) >= $roundsLocked;
        });

        if ($usable->isEmpty()) {
            return null;
        }

        $chosen = $usable->sortByDesc(fn (Skill $s) => (float) $s->base_multiplier)->first();

        $cooldowns[$chosen->id] = $currentRound;
        $participant->skill_cooldowns = $cooldowns;

        return $chosen;
    }

    private function anyAlive(Battle $battle): bool
    {
        return $battle->participants->contains('is_alive', true);
    }

    private function snapshot(Battle $battle, string $text, ?int $actorCharacterId = null, ?int $skillId = null, bool $isMonsterActor = false): array
    {
        return [
            'text' => $text,
            'monster_hp' => $battle->monster_current_hp,
            'actor_character_id' => $actorCharacterId,
            'skill_id' => $skillId,
            'is_monster_actor' => $isMonsterActor,
            'participants' => $battle->participants->mapWithKeys(fn ($p) => [
                $p->character_id => ['hp' => $p->current_hp, 'stamina' => $p->current_stamina, 'mana' => $p->current_mana, 'is_alive' => $p->is_alive],
            ])->toArray(),
        ];
    }

    private function onVictory(Battle $battle, array &$log): void
    {
        $battle->encounter->update(['status' => 'won']);
        $battle->encounter->spawnPoint->update(['last_defeated_at' => now()]);

        $expReward = $battle->monster_stats['exp_reward'];

        foreach ($battle->participants as $participant) {
            $character = $participant->character;
            $character->increment('exp', $expReward);
            $character->increment('total_exp', $expReward);
            $character->refresh();

            $oldLevel = $character->level;
            if ($character->syncLevel()) {
                $points = $character->statPointsEarnedBetween($oldLevel, $character->level);
                $character->stat_points += $points;
                $character->save();
                $log[] = $this->snapshot($battle, "{$character->name} naik ke Level {$character->level}! (+{$points} stat point)");
            }
        }

        $log[] = $this->snapshot($battle, "Party dapat {$expReward} EXP masing-masing karakter!");
    }

    public function flee(Battle $battle): Battle
    {
        $battle->status = 'fled';
        $log = $battle->battle_log ?? [];
        $log[] = $this->snapshot($battle, 'Party kabur dari pertarungan.');
        $battle->battle_log = $log;
        $battle->save();

        return $battle;
    }

    /**
     * Cari SPESIES monster yang cocok buat "Misi Cepat" - level dasarnya
     * mendekati rata-rata level party. Level ENCOUNTER-nya sendiri baru
     * di-roll pas startBattle() (bisa lebih tinggi dari level dasar ini).
     */
    public function findQuickMissionMonster(Collection $characters): ?Monster
    {
        $avgLevel = (int) round($characters->avg('level'));

        $candidates = Monster::where('min_party_level', '<=', max(1, $avgLevel + 1))
            ->orderByRaw('ABS(level - ?)', [$avgLevel])
            ->limit(5)
            ->get();

        return $candidates->isNotEmpty() ? $candidates->random() : Monster::inRandomOrder()->first();
    }
}
