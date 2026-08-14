<?php

namespace Database\Seeders;

use App\Models\Monster;
use Illuminate\Database\Seeder;

class SecondaryStatsSeeder extends Seeder
{
    /**
     * Isi agility/accuracy buat monster. Stat subclass (mana_regen, stamina_regen,
     * agility, evasion) sekarang computed accessor di model Subclass, bukan kolom -
     * gak perlu di-seed lagi. critical_hit_bonus/critical_luck subclass di-set
     * flat 20%/10% lewat migration.
     */
    public function run(): void
    {
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
