<?php

namespace Database\Seeders;

use App\Models\Character;
use Illuminate\Database\Seeder;

class NpcResetSeeder extends Seeder
{
    /**
     * NPC sekarang "diset kayak monster" - gak numpuk level/EXP/stat permanen
     * lagi, level asli di-roll dinamis tiap battle. Reset NPC yang udah ada
     * (mungkin sempat naik level dari fitur lama) balik ke kondisi bersih.
     */
    public function run(): void
    {
        Character::where('is_npc', true)->update([
            'level' => 1,
            'exp' => 0,
            'total_exp' => 0,
            'stat_points' => 0,
            'bonus_physical_damage' => 0,
            'bonus_physical_defense' => 0,
            'bonus_magic_damage' => 0,
            'bonus_magic_defense' => 0,
            'bonus_accuracy' => 0,
            'bonus_evasion' => 0,
            'bonus_critical_hit' => 0,
            'bonus_critical_luck' => 0,
        ]);
    }
}
