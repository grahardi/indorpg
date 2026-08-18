<?php

namespace Database\Seeders;

use App\Models\Monster;
use Illuminate\Database\Seeder;

class MonsterRankSeeder extends Seeder
{
    /**
     * Kelas manual (F-S), BUKAN dihitung dari level lagi. Dan convert
     * weak_against/strong_against lama (1 pola string "range_scaling") jadi
     * weak_matchups/strong_matchups baru (2 slot: combat_range + element + ratio).
     * Slot ke-2 sengaja dikosongin (element null, ratio default) - biar admin
     * bisa isi sendiri lewat /admin/monsters kalau mau nambah elemen spesifik.
     */
    public function run(): void
    {
        $ranks = [
            'Tikus Raksasa' => 'F',
            'Slime Api' => 'F',
            'Slime Air' => 'F',
            'Kelelawar Gua' => 'E',
            'Bandit Pemula' => 'E',
            'Serigala Hutan' => 'E',
            'Zombie Reyot' => 'E',
            'Laba-laba Beracun' => 'D',
            'Peri Air' => 'D',
            'Elemental Api Kecil' => 'D',
            'Golem Batu Kecil' => 'C',
            'Harpy Muda' => 'C',
        ];

        foreach (Monster::all() as $monster) {
            $rank = $ranks[$monster->name] ?? 'E';

            $weakRange = explode('_', $monster->weak_against ?? '')[0] ?? null;
            $strongRange = explode('_', $monster->strong_against ?? '')[0] ?? null;

            $monster->update([
                'class_rank' => $rank,
                'weak_matchups' => [
                    ['combat_range' => $weakRange, 'element_id' => null, 'ratio' => 2],
                    ['combat_range' => null, 'element_id' => null, 'ratio' => 2],
                ],
                'strong_matchups' => [
                    ['combat_range' => $strongRange, 'element_id' => null, 'ratio' => 2],
                    ['combat_range' => null, 'element_id' => null, 'ratio' => 2],
                ],
            ]);
        }
    }
}
