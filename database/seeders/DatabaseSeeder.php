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
            SecondaryStatsSeeder::class,
            MapSeeder::class,
        ]);
    }
}
