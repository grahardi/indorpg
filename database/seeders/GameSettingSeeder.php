<?php

namespace Database\Seeders;

use App\Models\GameSetting;
use Illuminate\Database\Seeder;

class GameSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'monster_level_growth_ratio' => ['1.5', 'Rasio kenaikan stat monster tiap level (misal 1.5 = naik 50% tiap level, kompon berlapis). Naikkan/turunkan kalau monster kerasa terlalu OP/lemah.'],
            'monster_max_level_bonus' => ['3', 'Level monster maksimum = level tertinggi party + angka ini. Contoh: party level 5, angka 3 -> monster bisa sampai level 8.'],
            'regen_ratio' => ['0.1', 'Rasio HP/SP/MP regen per ronde battle (0.1 = 10%). HP regen = ratio x (Physical Defense + Magic Defense). SP regen = ratio x Base SP. MP regen = ratio x Base MP. Contoh: Physical Defense 30 + Magic Defense 30 = 60, dengan ratio 10% -> HP regen 6/ronde.'],
            'npc_level_growth_ratio' => ['1.3', 'Rasio kenaikan stat NPC (bukan karakter pemain) per level - sama konsepnya kayak monster. NPC gak numpuk level permanen; level asli di-roll dinamis tiap battle (level tertinggi karaktermu di party ±2 random), stat-nya di-scale pakai rasio ini dari base level 1.'],
            'npc_level_variance' => ['2', 'NPC level asli = level tertinggi karaktermu di party, ditambah/dikurangi angka acak sampai segini. Contoh: 2 -> bisa -2 sampai +2 dari level tertinggi party.'],
            'skill_level_growth_ratio' => ['1.3', 'Rasio kenaikan damage & mana/stamina cost SKILL tiap level karakter (kompon berlapis dari level 1). Contoh: damage dasar 20, karakter level 2 -> 26 (20 x 1.3). Cooldown TIDAK ikut naik. Ini otomatis, terpisah dari skill point allocation (yang manual per-skill).'],
            'npc_level_cache_seconds' => ['300', 'Level NPC (di preview Guild MAUPUN battle beneran) di-cache selama sekian detik - biar konsisten (angka yang keliatan pas milih party = angka yang beneran dipakai), gak diacak ulang tiap request. Setelah kadaluarsa, di-roll ulang otomatis pas ada yang buka Guild/mulai battle lagi.'],
        ];

        foreach ($defaults as $key => [$value, $desc]) {
            GameSetting::updateOrCreate(['key' => $key], ['value' => $value, 'description' => $desc]);
        }
    }
}
