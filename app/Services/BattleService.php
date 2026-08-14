<?php

namespace App\Services;

use App\Models\Battle;
use App\Models\BattleParticipant;
use App\Models\Character;
use App\Models\Encounter;
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

        $battle = Battle::create([
            'encounter_id' => $encounter->id,
            'monster_id' => $monster->id,
            'monster_current_hp' => $monster->hp,
            'status' => 'ongoing',
            'round_number' => 1,
            'battle_log' => [],
        ]);

        $characters = Character::with('subclass.skills')->whereIn('id', $characterIds)->get();

        foreach ($characters as $character) {
            BattleParticipant::create([
                'battle_id' => $battle->id,
                'character_id' => $character->id,
                'current_hp' => $character->current_hp,
                'current_stamina' => $character->current_stamina,
                'current_mana' => $character->current_mana,
                'is_alive' => true,
            ]);
        }

        return $this->autoResolve($battle);
    }

    /**
     * Jalankan seluruh battle otomatis dari awal sampai menang/kalah.
     * Tiap step dicatat sebagai snapshot (HP monster + semua participant saat itu)
     * biar frontend bisa "putar ulang" secara animasi.
     */
    public function autoResolve(Battle $battle): Battle
    {
        $battle->load(['participants.character.subclass.skills', 'monster']);
        $monster = $battle->monster;

        $log = [];
        $log[] = $this->snapshot($battle, "{$monster->name} muncul menghadang!");

        $round = 1;

        while ($battle->monster_current_hp > 0 && $this->anyAlive($battle) && $round <= self::MAX_ROUNDS) {
            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                    continue;
                }

                $skill = $this->autoPickSkill($participant);
                if (! $skill) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} kehabisan resource, cuma bertahan.");
                    continue;
                }

                $subclass = $participant->character->subclass;

                $participant->current_stamina = max(0, $participant->current_stamina - $skill->stamina_cost);
                $participant->current_mana = max(0, $participant->current_mana - $skill->mana_cost);

                $offenseStat = $skill->scaling_stat === 'magic' ? $subclass->base_magic_damage : $subclass->base_physical_damage;
                $defenseStat = $skill->scaling_stat === 'magic' ? $monster->magic_defense : $monster->physical_defense;

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

                $damage = max(1, (int) round($mitigated));
                $battle->monster_current_hp = max(0, $battle->monster_current_hp - $damage);
                $participant->save();

                $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: {$damage} damage ke {$monster->name}{$note}");

                if ($battle->monster_current_hp <= 0) {
                    $log[] = $this->snapshot($battle, "{$monster->name} kalah!");
                    break;
                }
            }

            if ($battle->monster_current_hp > 0) {
                $alive = $battle->participants()->where('is_alive', true)->get();

                if ($alive->isNotEmpty()) {
                    $target = $alive->random();
                    $subclass = $target->character->subclass;

                    $useMagic = $monster->magic_damage > $monster->physical_damage;
                    $offenseStat = $useMagic ? $monster->magic_damage : $monster->physical_damage;
                    $defenseStat = $useMagic ? $subclass->base_magic_defense : $subclass->base_physical_defense;

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
                    $log[] = $this->snapshot($battle, $msg);
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
     * AI sederhana: pilih skill dengan multiplier tertinggi yang masih affordable
     * (resource cukup). Kalau gak ada yang affordable, return null (skip turn).
     */
    private function autoPickSkill(BattleParticipant $participant): ?Skill
    {
        $skills = $participant->character->subclass->skills;

        $affordable = $skills->filter(function (Skill $skill) use ($participant) {
            return $skill->stamina_cost <= $participant->current_stamina
                && $skill->mana_cost <= $participant->current_mana;
        });

        if ($affordable->isEmpty()) {
            return null;
        }

        return $affordable->sortByDesc(fn (Skill $s) => (float) $s->base_multiplier)->first();
    }

    private function anyAlive(Battle $battle): bool
    {
        return $battle->participants->contains('is_alive', true);
    }

    private function snapshot(Battle $battle, string $text): array
    {
        return [
            'text' => $text,
            'monster_hp' => $battle->monster_current_hp,
            'participants' => $battle->participants->mapWithKeys(fn ($p) => [
                $p->character_id => ['hp' => $p->current_hp, 'stamina' => $p->current_stamina, 'mana' => $p->current_mana, 'is_alive' => $p->is_alive],
            ])->toArray(),
        ];
    }

    private function onVictory(Battle $battle, array &$log): void
    {
        $battle->encounter->update(['status' => 'won']);
        $battle->encounter->spawnPoint->update(['last_defeated_at' => now()]);

        $expReward = $battle->monster->exp_reward;

        foreach ($battle->participants as $participant) {
            $participant->character->increment('exp', $expReward);
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
     * Cari monster yang cocok buat "Misi Cepat" - level mendekati rata-rata
     * level party, diambil dari spawn point manapun secara acak.
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
