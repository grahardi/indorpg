<?php

namespace Database\Seeders;

use App\Models\Character;
use App\Models\Subclass;
use Illuminate\Database\Seeder;

class NpcSeeder extends Seeder
{
    /**
     * Bikin minimal 1 NPC per subclass biar roster gak kosong dan Guild Adventure
     * langsung bisa dicoba tanpa perlu bikin karakter manual dulu.
     */
    public function run(): void
    {
        $names = [
            'Berserker' => 'Ragil Baswara',
            'Blade Knight' => 'Danu Ksatriya',
            'Spellblade' => 'Arya Wicaksana',
            'Paladin' => 'Bintang Nararya',
            'Bulwark' => 'Girindra Prakosa',
            'Warden' => 'Wisnu Adiguna',
            'Sentinel' => 'Baskara Wirawan',
            'Pyromancer' => 'Nyala Anindita',
            'Hydromancer' => 'Tirta Maheswari',
            'Geomancer' => 'Bumi Prasetyo',
            'Aeromancer' => 'Angkasa Wardhana',
            'Cleric' => 'Suci Rahayu',
            'Warlock' => 'Kelam Prawira',
            'Enchanter' => 'Melodi Kusuma',
        ];

        foreach ($names as $subclassName => $npcName) {
            $subclass = Subclass::where('name', $subclassName)->first();
            if (! $subclass) {
                continue;
            }

            $exists = Character::where('name', $npcName)->where('is_npc', true)->exists();
            if ($exists) {
                continue;
            }

            $level = random_int(1, 3);

            Character::create([
                'subclass_id' => $subclass->id,
                'name' => $npcName,
                'level' => $level,
                'exp' => 0,
                'current_hp' => $subclass->base_hp,
                'current_stamina' => $subclass->base_sp,
                'current_mana' => $subclass->base_mp,
                'is_npc' => true,
            ]);
        }
    }
}
