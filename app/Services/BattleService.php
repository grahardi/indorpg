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

        // Level tertinggi PLAYER (bukan NPC) di party - jadi patokan level
        // monster MAUPUN level NPC (NPC gak punya level sendiri yang berarti,
        // ngikutin kekuatan party).
        $playerCharacters = $characters->where('is_npc', false);
        $partyMaxLevel = (int) ($playerCharacters->max('level') ?: 1);

        $encounterLevel = $this->rollMonsterLevel($monster, $partyMaxLevel);
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

            // NPC "diset kayak monster": gak punya level/progress permanen, level
            // asli di-roll dinamis tiap battle (level tertinggi PLAYER di party ±
            // variance random, setting admin), stat-nya di-scale pakai rasio
            // admin dari base level 1. Selalu mulai battle full HP/SP/MP (gak
            // numpuk capek/tumbang antar battle kayak karakter pemain).
            $npcLevel = null;
            $npcSnapshot = null;
            if ($character->is_npc) {
                $npcLevel = $character->resolveNpcLevel($partyMaxLevel);
                $npcSnapshot = $this->npcScaledStats($character, $npcLevel);
            }

            BattleParticipant::create([
                'battle_id' => $battle->id,
                'character_id' => $character->id,
                'current_hp' => $character->is_npc ? $npcSnapshot['base_hp'] : $character->current_hp,
                'current_stamina' => $character->is_npc ? $npcSnapshot['base_sp'] : $character->current_stamina,
                'current_mana' => $character->is_npc ? $npcSnapshot['base_mp'] : $character->current_mana,
                'skill_cooldowns' => $initialCooldowns,
                'loadout_skill_ids' => $loadoutIds,
                'npc_encounter_level' => $npcLevel,
                'npc_stat_snapshot' => $npcSnapshot,
                // BUG FIX: sebelumnya selalu true, jadi karakter pemain yang tumbang
                // (current_hp 0 dari battle sebelumnya) tetap dianggap "hidup" dan
                // ikut nyerang lagi di battle baru. Sekarang dicek dari HP asli.
                // NPC selalu mulai fresh (full HP), jadi selalu true.
                'is_alive' => $character->is_npc ? true : $character->current_hp > 0,
            ]);
        }

        return $this->autoResolve($battle);
    }

    /**
     * Level monster buat encounter ini: acak antara level dasar monster (di
     * tabel monsters, sekarang selalu 1) sampai (level tertinggi PLAYER + bonus
     * admin). Kalau level dasar monster udah lebih tinggi dari batas atas itu,
     * ya pakai level dasarnya aja (gak pernah di-downgrade).
     */
    private function rollMonsterLevel(Monster $monster, int $partyMaxLevel): int
    {
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
     * Level NPC buat battle ini: level tertinggi PLAYER di party, +/- variance
     * random (setting admin, default 2). Minimal 1.
     */
    /**
     * Scale stat NPC dari base level 1 ke level encounter yang di-roll, pakai
     * rasio admin (beda dari rasio monster - NPC biasanya lebih "temenan",
     * gak sekeras monster). Base HP/SP/MP dihitung ulang dari physical/magic
     * defense+damage yang udah di-scale, regen juga ikut pakai rasio regen
     * yang sama kayak karakter pemain.
     */
    private function npcScaledStats(Character $character, int $encounterLevel): array
    {
        $ratio = GameSetting::getFloat('npc_level_growth_ratio', 1.3);
        $factor = $ratio ** ($encounterLevel - 1); // NPC base level selalu 1

        $physicalDamage = max(1, (int) round($character->leveled_physical_damage * $factor)) + $character->bonus_physical_damage;
        $physicalDefense = max(0, (int) round($character->leveled_physical_defense * $factor)) + $character->bonus_physical_defense;
        $magicDamage = max(1, (int) round($character->leveled_magic_damage * $factor)) + $character->bonus_magic_damage;
        $magicDefense = max(0, (int) round($character->leveled_magic_defense * $factor)) + $character->bonus_magic_defense;

        $baseHp = $physicalDefense + $magicDefense;
        $baseMp = $magicDamage + $magicDefense;
        $baseSp = $physicalDamage + $physicalDefense;
        $regenRatio = GameSetting::getFloat('regen_ratio', 0.1);

        return [
            'level' => $encounterLevel,
            'physical_damage' => $physicalDamage,
            'physical_defense' => $physicalDefense,
            'magic_damage' => $magicDamage,
            'magic_defense' => $magicDefense,
            'base_hp' => $baseHp,
            'base_mp' => $baseMp,
            'base_sp' => $baseSp,
            'hp_regen' => max(1, (int) round($baseHp * $regenRatio)),
            'mana_regen' => max(1, (int) round($baseMp * $regenRatio)),
            'stamina_regen' => max(1, (int) round($baseSp * $regenRatio)),
        ];
    }

    /**
     * Ambil stat combat participant - dari snapshot NPC (kalau ini NPC) atau
     * dari effective_* karakter biasa (kalau player). Nyatuin logic biar gak
     * cabang if/else NPC-vs-player berulang-ulang di autoResolve().
     */
    private function combatStat(BattleParticipant $participant, string $stat): float
    {
        if ($participant->npc_stat_snapshot && array_key_exists($stat, $participant->npc_stat_snapshot)) {
            return (float) $participant->npc_stat_snapshot[$stat];
        }

        $accessor = 'effective_'.$stat;

        return (float) $participant->character->{$accessor};
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
     * Poin skill point allocation yang udah diinvest character ini ke skill
     * tertentu (cuma ada kalau skill itu ada di loadout MANUAL-nya, character_skills
     * pivot - skill random per-battle gak punya allocation, dianggap 0).
     */
    private function skillBonusLevel(Character $character, Skill $skill): int
    {
        $pivotSkill = $character->skills->firstWhere('id', $skill->id);

        return $pivotSkill?->pivot?->bonus_level ?? 0;
    }

    /**
     * Stat combat skill yang BENERAN dipakai di battle - base_multiplier/mana_cost/
     * stamina_cost skill di-scale OTOMATIS sesuai level karakter (rasio admin,
     * default 1.3, kompon berlapis dari level 1) - gak butuh aksi player.
     * Cooldown TIDAK ikut naik dari level.
     *
     * DI ATAS itu, ada "skill point allocation" (manual, per-skill, lihat
     * skillBonusLevel()): tiap poin nambah +1% damage & -1% cooldown skill itu
     * (floor cooldown di 20% dari aslinya biar gak jadi instan 0 detik).
     */
    private function skillCombatStats(Character $character, Skill $skill): array
    {
        $levelRatio = GameSetting::getFloat('skill_level_growth_ratio', 1.3);
        $levelFactor = $levelRatio ** ($character->level - 1);

        $bonusLevel = $this->skillBonusLevel($character, $skill);
        $allocFactor = 1 + ($bonusLevel * 0.01);
        $cooldownFactor = max(0.2, 1 - ($bonusLevel * 0.01));

        return [
            'multiplier' => (float) $skill->base_multiplier * $levelFactor * $allocFactor,
            'mana_cost' => max(0, (int) round($skill->mana_cost * $levelFactor)),
            'stamina_cost' => max(0, (int) round($skill->stamina_cost * $levelFactor)),
            'cooldown_seconds' => max(1, (int) round($skill->cooldown_seconds * $cooldownFactor)),
        ];
    }

    /**
     * Jalankan seluruh battle otomatis dari awal sampai menang/kalah.
     * Tiap step dicatat sebagai snapshot (HP monster + semua participant saat itu)
     * biar frontend bisa "putar ulang" secara animasi.
     */
    public function autoResolve(Battle $battle): Battle
    {
        $battle->load(['participants.character.subclass.gameClass', 'participants.character.subclass.skills', 'participants.character.skills', 'monster']);
        $monster = $battle->monster;
        $stats = $battle->monster_stats; // snapshot stat yang udah di-scale sesuai level encounter

        $log = [];
        $log[] = $this->snapshot($battle, "{$monster->name} (Lv.{$battle->monster_level}) muncul menghadang!");

        $round = 1;

        while ($battle->monster_current_hp > 0 && $this->anyAlive($battle) && $round <= self::MAX_ROUNDS) {
            // Regen HP/stamina/mana tiap awal ronde, dibatasi pool max (snapshot
            // NPC kalau NPC, effective_* karakter kalau player).
            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive) {
                    continue;
                }

                $participant->current_hp = min($this->combatStat($participant, 'base_hp'), $participant->current_hp + $this->combatStat($participant, 'hp_regen'));
                $participant->current_stamina = min($this->combatStat($participant, 'base_sp'), $participant->current_stamina + $this->combatStat($participant, 'stamina_regen'));
                $participant->current_mana = min($this->combatStat($participant, 'base_mp'), $participant->current_mana + $this->combatStat($participant, 'mana_regen'));
            }

            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                    continue;
                }

                // Kena stun dari skill monster ronde sebelumnya -> skip giliran, efek abis dipakai sekali.
                if ($participant->is_stunned) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} kena stun, skip ronde!", $participant->character_id);
                    $participant->is_stunned = false;
                    $participant->save();
                    continue;
                }

                $skill = $this->autoPickSkill($battle, $participant, $round);
                if (! $skill) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} belum ada skill siap pakai, cuma bertahan.");
                    continue;
                }

                $character = $participant->character;
                $skillStats = $this->skillCombatStats($character, $skill);

                $participant->current_stamina = max(0, $participant->current_stamina - $skillStats['stamina_cost']);
                $participant->current_mana = max(0, $participant->current_mana - $skillStats['mana_cost']);

                // === HEAL: gak nyerang monster sama sekali, nambah HP/MP/SP teman ===
                if ($skill->buff_type === 'heal') {
                    $target = $this->pickHealTarget($battle, $skill);
                    if (! $target) {
                        $participant->save();
                        $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name}, tapi gak ada yang perlu disembuhin.", $character->id, $skill->id);
                        continue;
                    }

                    // Pakai magic_damage sebagai "kekuatan nyembuhin" (konvensi umum
                    // RPG - stat sihir jadi basis heal juga), dikali multiplier skill.
                    $healPower = $this->combatStat($participant, 'magic_damage') * $skillStats['multiplier'];
                    $healAmount = max(1, (int) round($healPower));
                    $resource = $skill->heal_resource ?? 'hp';

                    [$before, $max] = $this->resourceLevel($target, $resource);
                    $after = min($max, $before + $healAmount);
                    $actualHeal = $after - $before;

                    match ($resource) {
                        'mp' => $target->current_mana = $after,
                        'sp' => $target->current_stamina = $after,
                        default => $target->current_hp = $after,
                    };
                    $target->save();
                    if ($target->id !== $participant->id) {
                        $participant->save();
                    }

                    $resourceLabel = strtoupper($resource);
                    $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name} ke {$target->character->name}: +{$actualHeal} {$resourceLabel}", $character->id, $skill->id);

                    continue;
                }

                // === NERF: gak nyerang langsung, cuma nge-debuff monster (hit
                // BERIKUTNYA ke monster, siapapun yang mukul, kena dikali multiplier
                // skill ini - one-shot, abis dipakai sekali langsung reset) ===
                if ($skill->buff_type === 'nerf') {
                    $participant->save();
                    $battle->monster_debuff_multiplier = $skillStats['multiplier'];
                    $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name}: serangan berikutnya ke {$monster->name} jadi {$skillStats['multiplier']}x damage!", $character->id, $skill->id);

                    continue;
                }

                // === SERANGAN BIASA (buff_type = 'none', default) ===
                // Cek Accuracy (ofensif) vs evasion bawaan monster - bisa meleset total.
                // Accuracy/critical GAK di-scale NPC (sama kayak monster: cuma power
                // stat yang naik, bukan akurasi/crit).
                $hitChance = max(50, min(99, 100 + $character->effective_accuracy - 90 - $monster->agility));
                if (random_int(1, 100) > $hitChance) {
                    $participant->save();
                    $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: MELESET!", $character->id, $skill->id);
                    continue;
                }

                $offenseStat = $skill->scaling_stat === 'magic' ? $this->combatStat($participant, 'magic_damage') : $this->combatStat($participant, 'physical_damage');
                $defenseStat = $skill->scaling_stat === 'magic' ? $stats['magic_defense'] : $stats['physical_defense'];

                $raw = $offenseStat * $skillStats['multiplier'];
                $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);

                $note = '';
                $matchupMultiplier = $monster->matchupMultiplier($skill->combat_range, $skill->element_id);
                if ($matchupMultiplier > 1) {
                    $mitigated *= $matchupMultiplier;
                    $note = ' (Efektif!)';
                } elseif ($matchupMultiplier < 1) {
                    $mitigated *= $matchupMultiplier;
                    $note = ' (Kurang efektif...)';
                }

                // Roll critical hit.
                $isCrit = random_int(1, 100) <= $character->effective_critical_luck;
                if ($isCrit) {
                    $mitigated *= (1 + $character->effective_critical_hit / 100);
                    $note .= ' CRITICAL!';
                }

                // Debuff dari skill nerf sebelumnya (kalau ada) - one-shot, konsumsi
                // langsung abis dipakai di sini, siapapun yang mukul duluan.
                if ($battle->monster_debuff_multiplier) {
                    $mitigated *= (float) $battle->monster_debuff_multiplier;
                    $note .= ' (Lemah!)';
                    $battle->monster_debuff_multiplier = null;
                }

                $damage = max(1, (int) round($mitigated));
                $battle->monster_current_hp = max(0, $battle->monster_current_hp - $damage);

                // Stun - EVENT TERPISAH dari critical hit (roll sendiri, dice beda),
                // cuma persentase peluangnya kebetulan sama (Critical Luck). Jadi bisa
                // crit doang, stun doang, keduanya, atau gak dua-duanya - independen.
                if ($skill->can_stun && $battle->monster_current_hp > 0) {
                    $isStun = random_int(1, 100) <= $character->effective_critical_luck;
                    if ($isStun) {
                        $battle->monster_stunned = true;
                        $note .= ' STUN!';
                    }
                }

                $participant->save();

                $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: {$damage} damage ke {$monster->name}{$note}", $character->id, $skill->id);

                if ($battle->monster_current_hp <= 0) {
                    $log[] = $this->snapshot($battle, "{$monster->name} kalah!");
                    break;
                }
            }

            if ($battle->monster_current_hp > 0) {
                if ($battle->monster_stunned) {
                    // Kena stun dari skill player ronde ini -> skip nyerang balik.
                    $log[] = $this->snapshot($battle, "{$monster->name} kena stun, skip ronde!", null, null, true);
                    $battle->monster_stunned = false;
                } else {
                    // BUG FIX PENTING: sebelumnya pakai participants()->where(...)->get()
                    // yang query FRESH ke database, hasilnya instance PHP BEDA dari yang
                    // udah di-cache di $battle->participants. Jadi pas monster nyerang &
                    // nge-set is_alive=false di instance "asing" itu, collection utama
                    // yang dipakai loop ronde berikutnya (dan snapshot, dan anyAlive())
                    // masih "basi" - tetap nganggep karakter itu hidup, jadi masih ikut
                    // nyerang lagi DAN HP-nya ikut ke-regen balik. Fix: filter collection
                    // yang UDAH di-load (instance sama), bukan query baru.
                    $alive = $battle->participants->where('is_alive', true);

                    if ($alive->isNotEmpty()) {
                        // Monster kadang pakai skill konfigurasi admin (nama, damage_ratio,
                        // effect single/area, can_stun, usage_ratio - chance dipilih tiap
                        // ronde), atau fallback ke serangan dasar kalau gak ada yang ke-roll.
                        $monsterSkill = $this->pickMonsterSkill($monster);
                        $isArea = ($monsterSkill['effect'] ?? null) === 'area';
                        $targets = $isArea ? $alive : collect([$alive->random()]);
                        $skillName = $monsterSkill['name'] ?? null;
                        $damageRatio = $monsterSkill ? (float) ($monsterSkill['damage_ratio'] ?? 100) : 100;
                        $skillCanStun = (bool) ($monsterSkill['can_stun'] ?? false);
                        $verb = $skillName ? "pakai {$skillName} ke" : 'menyerang';

                        foreach ($targets as $target) {
                            $character = $target->character;

                            // Cek akurasi monster vs Evasion (defensif) karakter.
                            $hitChance = max(50, min(99, 100 + $monster->accuracy - 90 - $character->effective_evasion));
                            if (random_int(1, 100) > $hitChance) {
                                $log[] = $this->snapshot($battle, "{$monster->name} {$verb} {$target->character->name}: MELESET!", null, null, true);

                                continue;
                            }

                            $useMagic = $stats['magic_damage'] > $stats['physical_damage'];
                            $offenseStat = $useMagic ? $stats['magic_damage'] : $stats['physical_damage'];
                            $defenseStat = $useMagic ? $this->combatStat($target, 'magic_defense') : $this->combatStat($target, 'physical_defense');

                            $raw = $offenseStat * ($damageRatio / 100);
                            $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);
                            $damage = max(1, (int) round($mitigated));

                            $target->current_hp = max(0, $target->current_hp - $damage);
                            $justFainted = false;
                            if ($target->current_hp <= 0) {
                                $target->is_alive = false;
                                $justFainted = true;
                            } elseif ($skillCanStun) {
                                $target->is_stunned = true;
                            }
                            $target->save();

                            $msg = "{$monster->name} {$verb} {$target->character->name}: {$damage} damage.";
                            if ($skillCanStun && ! $justFainted) {
                                $msg .= " {$target->character->name} kena stun!";
                            }
                            if ($justFainted) {
                                $msg .= " {$target->character->name} tumbang!";
                            }
                            $log[] = $this->snapshot($battle, $msg, null, null, true);

                            if (! $this->anyAlive($battle)) {
                                break;
                            }
                        }
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

        // Abis battle selesai, party PULIH FULL (HP/SP/MP kembali penuh) - baik
        // yang tumbang maupun yang cuma kepotong sebagian, gak perlu recovery
        // manual di luar battle. NPC gak disentuh (mereka emang selalu fresh
        // tiap battle sendiri, gak nyimpen state apapun - "diset kayak monster").
        foreach ($battle->participants as $participant) {
            $character = $participant->character;
            if ($character->is_npc) {
                continue;
            }
            $character->update([
                'current_hp' => $character->effective_base_hp,
                'current_stamina' => $character->effective_base_sp,
                'current_mana' => $character->effective_base_mp,
            ]);
        }

        return $battle->fresh(['participants.character.subclass', 'monster']);
    }

    /**
     * AI: pilih skill ber-multiplier tertinggi yang affordable DAN gak lagi cooldown.
     * cooldown_seconds ditranslate ke "berapa ronde terkunci" (asumsi ~2.5 detik/ronde,
     * sesuai pacing animasi playback di frontend).
     */
    private function autoPickSkill(Battle $battle, BattleParticipant $participant, int $currentRound): ?Skill
    {
        $loadoutIds = $participant->loadout_skill_ids ?? [];
        $skills = $participant->character->subclass->skills->whereIn('id', $loadoutIds);
        $cooldowns = $participant->skill_cooldowns ?? [];
        $character = $participant->character;

        $usable = $skills->filter(function (Skill $skill) use ($battle, $participant, $cooldowns, $currentRound, $character) {
            $scaled = $this->skillCombatStats($character, $skill);

            $affordable = $scaled['stamina_cost'] <= $participant->current_stamina
                && $scaled['mana_cost'] <= $participant->current_mana;

            if (! $affordable) {
                return false;
            }

            // Skill heal cuma dianggap "usable" kalau emang ada yang butuh
            // disembuhin (di bawah 90% resource) - biar AI gak spam heal
            // padahal party full HP/MP/SP.
            if ($skill->buff_type === 'heal' && ! $this->healTargetNeeded($battle, $skill)) {
                return false;
            }

            $lastUsedRound = $cooldowns[$skill->id] ?? null;
            if ($lastUsedRound === null) {
                return true;
            }

            $roundsLocked = max(1, (int) ceil($scaled['cooldown_seconds'] / 2.5));

            return ($currentRound - $lastUsedRound) >= $roundsLocked;
        });

        if ($usable->isEmpty()) {
            return null;
        }

        $chosen = $usable->sortByDesc(fn (Skill $s) => $this->skillCombatStats($character, $s)['multiplier'])->first();

        $cooldowns[$chosen->id] = $currentRound;
        $participant->skill_cooldowns = $cooldowns;

        return $chosen;
    }

    /**
     * Roll skill monster (dari skills_config yang diatur admin) yang dipakai
     * ronde ini, berdasarkan usage_ratio tiap skill (persentase peluang per
     * ronde, dicek berurutan). Null kalau gak ada yang ke-roll -> fallback
     * ke serangan dasar (single target, damage_ratio 100%).
     */
    private function pickMonsterSkill(Monster $monster): ?array
    {
        foreach ($monster->skills_config ?? [] as $skillConfig) {
            $usageRatio = (float) ($skillConfig['usage_ratio'] ?? 0);
            if ($usageRatio > 0 && random_int(1, 100) <= $usageRatio) {
                return $skillConfig;
            }
        }

        return null;
    }

    /**
     * Resource (current, max) yang relevan buat heal_resource skill ('hp' default).
     */
    private function resourceLevel(BattleParticipant $p, string $resource): array
    {
        return match ($resource) {
            'mp' => [$p->current_mana, $this->combatStat($p, 'base_mp')],
            'sp' => [$p->current_stamina, $this->combatStat($p, 'base_sp')],
            default => [$p->current_hp, $this->combatStat($p, 'base_hp')],
        };
    }

    /**
     * Ada gak participant hidup yang resource-nya di bawah 90% (butuh disembuhin)?
     * Kalau gak ada, skill heal ini gak usable ronde ini (biar AI gak spam heal
     * pas semua orang udah full).
     */
    private function healTargetNeeded(Battle $battle, Skill $skill): bool
    {
        $resource = $skill->heal_resource ?? 'hp';

        foreach ($battle->participants->where('is_alive', true) as $p) {
            [$current, $max] = $this->resourceLevel($p, $resource);
            if ($max > 0 && ($current / $max) < 0.9) {
                return true;
            }
        }

        return false;
    }

    /**
     * Pilih target heal: participant hidup dengan persentase resource TERENDAH
     * (paling butuh), termasuk diri sendiri.
     */
    private function pickHealTarget(Battle $battle, Skill $skill): ?BattleParticipant
    {
        $resource = $skill->heal_resource ?? 'hp';

        return $battle->participants->where('is_alive', true)
            ->sortBy(function (BattleParticipant $p) use ($resource) {
                [$current, $max] = $this->resourceLevel($p, $resource);

                return $max > 0 ? $current / $max : 1;
            })
            ->first();
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

            // NPC gak numpuk EXP/level permanen - "diset kayak monster", cuma
            // player yang beneran progress dari battle ke battle.
            if ($character->is_npc) {
                continue;
            }

            $character->increment('exp', $expReward);
            $character->increment('total_exp', $expReward);
            $character->refresh();

            if ($character->syncLevel()) {
                $character->save();
                $log[] = $this->snapshot($battle, "{$character->name} naik ke Level {$character->level}!");
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
