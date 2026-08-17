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
        ];

        foreach ($defaults as $key => [$value, $desc]) {
            GameSetting::updateOrCreate(['key' => $key], ['value' => $value, 'description' => $desc]);
        }
    }
}
