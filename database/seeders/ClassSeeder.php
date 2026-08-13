<?php

namespace Database\Seeders;

use App\Models\GameClass;
use Illuminate\Database\Seeder;

class ClassSeeder extends Seeder
{
    public function run(): void
    {
        $classes = [
            [
                'name' => 'Warrior',
                'slug' => 'warrior',
                'description' => 'Damage dealer, main attacker jarak dekat.',
                'base_hp' => 120,
                'base_stamina' => 100,
                'base_mana' => 40,
            ],
            [
                'name' => 'Tanker',
                'slug' => 'tanker',
                'description' => 'Shielder, pertahanan utama party.',
                'base_hp' => 160,
                'base_stamina' => 70,
                'base_mana' => 60,
            ],
            [
                'name' => 'Mage',
                'slug' => 'mage',
                'description' => 'Range attacker elemental, damage sihir tinggi.',
                'base_hp' => 80,
                'base_stamina' => 40,
                'base_mana' => 110,
            ],
            [
                'name' => 'Saint',
                'slug' => 'saint',
                'description' => 'Support: healing, curse, atau buff.',
                'base_hp' => 90,
                'base_stamina' => 40,
                'base_mana' => 100,
            ],
        ];

        foreach ($classes as $class) {
            GameClass::updateOrCreate(['slug' => $class['slug']], $class);
        }
    }
}
