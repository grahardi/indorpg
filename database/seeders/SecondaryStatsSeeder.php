<?php

namespace Database\Seeders;

use App\Models\Monster;
use App\Models\Subclass;
use Illuminate\Database\Seeder;

class SecondaryStatsSeeder extends Seeder
{
    /**
     * Isi mana_regen/stamina_regen/agility/accuracy/critical_hit_bonus/critical_luck
     * buat subclass, dan agility/accuracy buat monster. Dipisah dari SubclassSeeder/
     * MonsterSeeder biar gak perlu ubah file yang udah besar.
     */
    public function run(): void
    {
        // Baseline per class (mana_regen, stamina_regen, agility, accuracy, crit_bonus%, crit_luck%)
        $classBaseline = [
            'warrior' => [3, 10, 8, 88, 50, 12],
            'tanker' => [4, 7, 4, 85, 30, 5],
            'mage' => [9, 3, 7, 92, 60, 10],
            'saint' => [8, 4, 6, 90, 40, 7],
        ];

        // Override per subclass tertentu (flavor): [field => value]
        $subclassOverrides = [
            'Berserker' => ['critical_luck' => 18, 'agility' => 6],
            'Aeromancer' => ['agility' => 14],
            'Cleric' => ['mana_regen' => 11],
            'Bulwark' => ['agility' => 3],
            'Harpy' => [], // placeholder, monster bukan subclass - diabaikan
        ];

        foreach (Subclass::with('gameClass')->get() as $subclass) {
            $classSlug = $subclass->gameClass->slug;
            [$manaRegen, $staminaRegen, $agility, $accuracy, $critBonus, $critLuck] = $classBaseline[$classSlug] ?? [5, 5, 5, 90, 30, 8];

            $values = [
                'mana_regen' => $manaRegen,
                'stamina_regen' => $staminaRegen,
                'agility' => $agility,
                'accuracy' => $accuracy,
                'critical_hit_bonus' => $critBonus,
                'critical_luck' => $critLuck,
            ];

            if (isset($subclassOverrides[$subclass->name])) {
                $values = array_merge($values, $subclassOverrides[$subclass->name]);
            }

            $subclass->update($values);
        }

        // Monster: agility & accuracy per monster (flavor based - makhluk gesit vs lambat)
        $monsterStats = [
            'Slime Api' => [5, 80],
            'Slime Air' => [5, 80],
            'Tikus Raksasa' => [15, 85],
            'Kelelawar Gua' => [25, 75],
            'Bandit Pemula' => [10, 88],
            'Laba-laba Beracun' => [12, 90],
            'Serigala Hutan' => [18, 88],
            'Zombie Reyot' => [2, 75],
            'Peri Air' => [20, 85],
            'Elemental Api Kecil' => [8, 90],
            'Golem Batu Kecil' => [3, 85],
            'Harpy Muda' => [22, 82],
        ];

        foreach ($monsterStats as $name => [$agility, $accuracy]) {
            Monster::where('name', $name)->update([
                'agility' => $agility,
                'accuracy' => $accuracy,
            ]);
        }
    }
}
