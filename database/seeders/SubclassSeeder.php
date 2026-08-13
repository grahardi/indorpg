<?php

namespace Database\Seeders;

use App\Models\Element;
use App\Models\GameClass;
use App\Models\Subclass;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubclassSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'warrior' => [
                ['name' => 'Berserker', 'power_type' => 'Raw Power/Weapon', 'flavor_bonus' => null,
                    'phys_dmg' => 45, 'phys_def' => 20, 'magic_dmg' => 10, 'magic_def' => 10,
                    'description' => 'All-in damage fisik, raw power tanpa kompromi.'],
                ['name' => 'Blade Knight', 'power_type' => 'Weapon', 'flavor_bonus' => null,
                    'phys_dmg' => 30, 'phys_def' => 20, 'magic_dmg' => 20, 'magic_def' => 10,
                    'description' => 'All-rounder senjata, seimbang serang-bertahan.'],
                ['name' => 'Spellblade', 'power_type' => 'Weapon + Magic', 'flavor_bonus' => null,
                    'phys_dmg' => 20, 'phys_def' => 10, 'magic_dmg' => 30, 'magic_def' => 20,
                    'description' => 'Hybrid pedang dan sihir.'],
                ['name' => 'Paladin', 'power_type' => 'Weapon + Magic', 'flavor_bonus' => null,
                    'phys_dmg' => 10, 'phys_def' => 10, 'magic_dmg' => 45, 'magic_def' => 20,
                    'description' => 'Warrior dengan damage utama dari sihir suci.'],
            ],
            'tanker' => [
                ['name' => 'Bulwark', 'power_type' => 'Mana and Stamina Based', 'flavor_bonus' => null,
                    'phys_dmg' => 10, 'phys_def' => 45, 'magic_dmg' => 10, 'magic_def' => 20,
                    'description' => 'Tembok pertahanan fisik.'],
                ['name' => 'Warden', 'power_type' => 'Mana and Stamina Based', 'flavor_bonus' => null,
                    'phys_dmg' => 10, 'phys_def' => 20, 'magic_dmg' => 10, 'magic_def' => 45,
                    'description' => 'Tembok pertahanan sihir.'],
                ['name' => 'Sentinel', 'power_type' => 'Mana and Stamina Based', 'flavor_bonus' => null,
                    'phys_dmg' => 10, 'phys_def' => 30, 'magic_dmg' => 10, 'magic_def' => 30,
                    'description' => 'Tanker seimbang fisik dan sihir.'],
            ],
            'mage' => [
                ['name' => 'Pyromancer', 'element' => 'Fire', 'power_type' => 'Mana Based', 'flavor_bonus' => 'Kuat vs Wind',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 45, 'magic_def' => 20,
                    'description' => 'Elemental mage api.'],
                ['name' => 'Hydromancer', 'element' => 'Water', 'power_type' => 'Mana Based', 'flavor_bonus' => 'Kuat vs Fire',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 45, 'magic_def' => 20,
                    'description' => 'Elemental mage air.'],
                ['name' => 'Geomancer', 'element' => 'Earth', 'power_type' => 'Mana Based', 'flavor_bonus' => 'Kuat vs Water',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 45, 'magic_def' => 20,
                    'description' => 'Elemental mage tanah.'],
                ['name' => 'Aeromancer', 'element' => 'Wind', 'power_type' => 'Mana Based', 'flavor_bonus' => 'Kuat vs Earth',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 45, 'magic_def' => 20,
                    'description' => 'Elemental mage angin.'],
            ],
            'saint' => [
                ['name' => 'Cleric', 'power_type' => 'Mostly for Healing', 'flavor_bonus' => 'Healing bonus',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 25, 'magic_def' => 45,
                    'description' => 'Fokus penyembuhan party.'],
                ['name' => 'Warlock', 'power_type' => 'Mostly for Enemy Curse', 'flavor_bonus' => 'Cursed magic bonus',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 25, 'magic_def' => 45,
                    'description' => 'Fokus kutukan dan damage over time ke musuh.'],
                ['name' => 'Enchanter', 'power_type' => 'Mostly for Skill/Magic Buff', 'flavor_bonus' => 'Skill/buff magic bonus',
                    'phys_dmg' => 5, 'phys_def' => 10, 'magic_dmg' => 25, 'magic_def' => 45,
                    'description' => 'Fokus buff skill dan sihir party.'],
            ],
        ];

        foreach ($data as $classSlug => $subclasses) {
            $class = GameClass::where('slug', $classSlug)->firstOrFail();

            foreach ($subclasses as $item) {
                $elementId = null;
                if (! empty($item['element'])) {
                    $elementId = Element::where('name', $item['element'])->value('id');
                }

                Subclass::updateOrCreate(
                    ['slug' => Str::slug($item['name'])],
                    [
                        'class_id' => $class->id,
                        'element_id' => $elementId,
                        'name' => $item['name'],
                        'power_type' => $item['power_type'],
                        'description' => $item['description'],
                        'flavor_bonus' => $item['flavor_bonus'],
                        'base_physical_damage' => $item['phys_dmg'],
                        'base_physical_defense' => $item['phys_def'],
                        'base_magic_damage' => $item['magic_dmg'],
                        'base_magic_defense' => $item['magic_def'],
                    ]
                );
            }
        }
    }
}
