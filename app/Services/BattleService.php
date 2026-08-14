<?php

namespace App\Services;

use App\Models\Battle;
use App\Models\BattleParticipant;
use App\Models\Character;
use App\Models\Encounter;
use App\Models\Skill;

class BattleService
{
    /**
     * Mulai battle baru dari sebuah Encounter + karakter yang dipilih (2-3 orang).
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
            'battle_log' => ["{$monster->name} muncul menghadang!"],
        ]);

        $characters = Character::with('subclass')->whereIn('id', $characterIds)->get();

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

        return $battle;
    }

    /**
     * Jalankan satu ronde: tiap karakter hidup pakai 1 skill ke monster,
     * lalu monster balas menyerang 1 karakter hidup secara acak.
     *
     * $actions: [character_id => skill_id, ...]
     */
    public function resolveRound(Battle $battle, array $actions): Battle
    {
        $battle->load(['participants.character.subclass', 'monster']);
        $monster = $battle->monster;

        foreach ($battle->participants as $participant) {
            if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                continue;
            }

            $skillId = $actions[$participant->character_id] ?? null;
            if (! $skillId) {
                continue;
            }

            $skill = Skill::find($skillId);
            if (! $skill) {
                continue;
            }

            $subclass = $participant->character->subclass;

            // Cek & potong resource (stamina/mana). Kalau kurang, skill tetap jalan
            // tapi resource cuma dipotong sampai 0 (simplifikasi buat v1).
            $participant->current_stamina = max(0, $participant->current_stamina - $skill->stamina_cost);
            $participant->current_mana = max(0, $participant->current_mana - $skill->mana_cost);

            $offenseStat = $skill->scaling_stat === 'magic'
                ? $subclass->base_magic_damage
                : $subclass->base_physical_damage;

            $defenseStat = $skill->scaling_stat === 'magic'
                ? $monster->magic_defense
                : $monster->physical_defense;

            $raw = $offenseStat * (float) $skill->base_multiplier;
            $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);

            $pattern = "{$skill->combat_range}_{$skill->scaling_stat}";
            $multiplierNote = '';
            if ($pattern === $monster->weak_against) {
                $mitigated *= 1.5;
                $multiplierNote = ' (Efektif!)';
            } elseif ($pattern === $monster->strong_against) {
                $mitigated *= 0.5;
                $multiplierNote = ' (Kurang efektif...)';
            }

            $damage = max(1, (int) round($mitigated));
            $battle->monster_current_hp = max(0, $battle->monster_current_hp - $damage);

            $battle->addLog("{$participant->character->name} pakai {$skill->name} ke {$monster->name}: {$damage} damage{$multiplierNote}");

            $participant->save();

            if ($battle->monster_current_hp <= 0) {
                $battle->addLog("{$monster->name} kalah!");
                break;
            }
        }

        // Giliran monster: kalau masih hidup, balas 1 karakter hidup secara acak.
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
                if ($target->current_hp <= 0) {
                    $target->is_alive = false;
                    $battle->addLog("{$monster->name} menyerang {$target->character->name}: {$damage} damage. {$target->character->name} tumbang!");
                } else {
                    $battle->addLog("{$monster->name} menyerang {$target->character->name}: {$damage} damage.");
                }
                $target->save();
            }
        }

        // Cek kondisi menang/kalah.
        $stillAlive = $battle->participants()->where('is_alive', true)->exists();

        if ($battle->monster_current_hp <= 0) {
            $battle->status = 'won';
            $this->onVictory($battle);
        } elseif (! $stillAlive) {
            $battle->status = 'lost';
            $battle->addLog('Seluruh party tumbang. Kalah...');
        } else {
            $battle->round_number++;
        }

        $battle->save();

        return $battle->fresh(['participants.character', 'monster']);
    }

    private function onVictory(Battle $battle): void
    {
        $battle->encounter->update(['status' => 'won']);
        $battle->encounter->spawnPoint->update(['last_defeated_at' => now()]);

        $expReward = $battle->monster->exp_reward;

        foreach ($battle->participants as $participant) {
            $participant->character->increment('exp', $expReward);
        }

        $battle->addLog("Party dapat {$expReward} EXP masing-masing karakter!");
    }

    public function flee(Battle $battle): Battle
    {
        $battle->status = 'fled';
        $battle->addLog('Party kabur dari pertarungan.');
        $battle->save();

        return $battle;
    }
}
