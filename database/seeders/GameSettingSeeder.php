<?php

namespace Database\Seeders;

use App\Models\GameSetting;
use Illuminate\Database\Seeder;

class GameSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'monster_hp_growth_ratio' => ['1.5', 'Rasio kenaikan HP + Defense + EXP/Gold reward monster tiap level - LINEAR (bukan kompon berlapis). TERPISAH dari rasio damage - naikkan biar monster gak cepet mati, gak ikut bikin serangannya lebih sakit.'],
            'monster_damage_growth_ratio' => ['1.5', 'Rasio kenaikan Physical/Magic Damage monster tiap level - LINEAR (bukan kompon berlapis). TERPISAH dari rasio HP - turunkan biar player gak kena 1 hit, gak ikut bikin HP monster jadi kebanyakan/kesedikitan.'],
            'monster_level_variance' => ['3', 'Level monster di-roll RANDOM di sekitar level tertinggi party, RENTANG SIMETRIS (party level - angka ini, sampai party level + angka ini). Contoh: party level 16, angka 3 -> monster ke-roll antara level 13-19 (BUKAN dari level 1 lagi - itu bug lama yang bikin monster bisa keluar level 3 padahal party udah level 16). Sama angka ini juga dipakai buat gerbang level spawn point (Peta).'],
            'regen_ratio' => ['0.1', 'Rasio HP/SP/MP regen per ronde battle (0.1 = 10%). HP regen = ratio x (Physical Defense + Magic Defense). SP regen = ratio x Base SP. MP regen = ratio x Base MP. Contoh: Physical Defense 30 + Magic Defense 30 = 60, dengan ratio 10% -> HP regen 6/ronde.'],
            'npc_level_growth_ratio' => ['1.3', 'Rasio kenaikan stat NPC (bukan karakter pemain) per level - LINEAR, bukan kompon berlapis (sama fix-nya kayak monster & skill). NPC gak numpuk level permanen; level asli di-roll dinamis tiap battle (level tertinggi karaktermu di party ±2 random), stat-nya di-scale pakai rasio ini dari base level 1.'],
            'npc_level_variance' => ['2', 'NPC level asli = level tertinggi karaktermu di party, ditambah/dikurangi angka acak sampai segini. Contoh: 2 -> bisa -2 sampai +2 dari level tertinggi party.'],
            'skill_level_growth_ratio' => ['1.3', 'Rasio kenaikan damage SKILL per level karakter - LINEAR, bukan kompon berlapis (biar gak explode di level tinggi). Contoh: damage dasar 20, level 2 -> 26 (20 x 1.3, persis), level 13 -> ~92 (20 x 4.6, BUKAN 20 x 23 kalau kompon berlapis). Mana/stamina cost & cooldown TIDAK ikut naik dari level. Terpisah dari skill point allocation (manual per-skill).'],
            'npc_level_cache_seconds' => ['300', 'Level NPC (di preview Guild MAUPUN battle beneran) di-cache selama sekian detik - biar konsisten (angka yang keliatan pas milih party = angka yang beneran dipakai), gak diacak ulang tiap request. Setelah kadaluarsa, di-roll ulang otomatis pas ada yang buka Guild/mulai battle lagi.'],
        ];

        foreach ($defaults as $key => [$value, $desc]) {
            GameSetting::updateOrCreate(['key' => $key], ['value' => $value, 'description' => $desc]);
        }

        // Setting lama 'monster_level_growth_ratio' udah dipecah jadi
        // monster_hp_growth_ratio + monster_damage_growth_ratio - buang biar
        // gak nyangkut jadi row mati di /admin/settings.
        GameSetting::where('key', 'monster_level_growth_ratio')->delete();

        // Setting lama 'monster_max_level_bonus' di-rename jadi
        // 'monster_level_variance' (sekarang dipakai simetris -3/+3, bukan
        // cuma "max bonus" doang) - buang key lama biar gak nyangkut.
        GameSetting::where('key', 'monster_max_level_bonus')->delete();
    }
}
