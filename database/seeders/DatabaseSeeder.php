<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ClassSeeder::class,
            ElementSeeder::class,
            SubclassSeeder::class,
            SkillSeeder::class,
            CombatRangeSeeder::class,
            MonsterSeeder::class,
            SkillAnimationSeeder::class,
            SkillReworkSeeder::class,
            MonsterRankSeeder::class,
            MonsterDefaultSkillSeeder::class,
            NpcResetSeeder::class,
            SecondaryStatsSeeder::class,
            MapSeeder::class,
            GameSettingSeeder::class,
            ItemSeeder::class,
            BulkItemSeeder::class,
            NpcSeeder::class,
        ]);
    }
}
