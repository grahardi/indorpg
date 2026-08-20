<?php

namespace Database\Seeders;

use App\Models\Monster;
use Illuminate\Database\Seeder;

class MonsterDefaultSkillSeeder extends Seeder
{
    /**
     * Jamin SEMUA monster punya minimal 1 skill eksplisit (usage_ratio 100 =
     * selalu ke-pick kalau gak ada skill lain yang lebih dulu ke-roll) -
     * sebelumnya monster tanpa skills_config bakal fallback ke "serangan
     * generik" yang nebak sendiri physical/magic dari stat mana yang lebih
     * gede (ambigu). Sekarang physical_ratio-nya EKSPLISIT, sekali ditentuin
     * di sini dari perbandingan stat physical_damage vs magic_damage
     * masing-masing monster (bukan dihitung ulang tiap ronde kayak dulu).
     *
     * Monster yang UDAH punya skills_config (misal diedit manual admin)
     * gak disentuh - cuma yang masih kosong/null yang dikasih default ini.
     */
    public function run(): void
    {
        foreach (Monster::whereNull('skills_config')->orWhere('skills_config', '[]')->get() as $monster) {
            // Rasio physical ditentuin dari perbandingan stat asli monster -
            // sekali aja di sini, jadi angka TETAP (bukan ambigu/berubah-ubah).
            $total = $monster->physical_damage + $monster->magic_damage;
            $physicalRatio = $total > 0 ? (int) round(($monster->physical_damage / $total) * 100) : 100;

            $monster->update([
                'skills_config' => [[
                    'name' => 'Serangan '.$monster->name,
                    'damage_ratio' => 100,
                    'effect' => 'single',
                    'can_stun' => false,
                    'usage_ratio' => 100,
                    'physical_ratio' => $physicalRatio,
                ]],
            ]);
        }
    }
}
