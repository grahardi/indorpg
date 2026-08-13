<?php

namespace Database\Seeders;

use App\Models\Subclass;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    /**
     * Contoh skill tier 1 (dasar, langsung terbuka) untuk tiap subclass.
     * Tier 2 & 3 menyusul setelah battle-testing angka dasar ini.
     */
    public function run(): void
    {
        $skills = [
            'Berserker' => [
                ['name' => 'Rage Slash', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 4, 'mult' => 1.4, 'desc' => 'Serangan cepat dengan damage fisik tinggi.'],
                ['name' => 'Reckless Charge', 'stat' => 'physical', 'stamina' => 30, 'mana' => 0, 'cd' => 8, 'mult' => 1.8, 'desc' => 'Menabrak musuh, damage besar tapi defense turun sementara.'],
            ],
            'Blade Knight' => [
                ['name' => 'Tebasan Baja', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 3, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Serangan pedang dasar yang cepat dan stabil.', 'icon' => 'blade-knight-tebasan-baja.svg'],
                ['name' => 'Serangan Berantai', 'stat' => 'physical', 'stamina' => 25, 'mana' => 0, 'cd' => 6, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Dua tebasan beruntun, hit kedua sedikit lebih kuat.', 'icon' => 'blade-knight-serangan-berantai.svg'],
                ['name' => 'Hantam Perisai', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 7, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Menghantam musuh dengan perisai, mengurangi physical defense musuh sementara.', 'icon' => 'blade-knight-hantam-perisai.svg'],
                ['name' => 'Tebasan Berputar', 'stat' => 'physical', 'stamina' => 30, 'mana' => 0, 'cd' => 9, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Berputar menebas seluruh musuh di sekitar.', 'icon' => 'blade-knight-tebasan-berputar.svg'],
                ['name' => 'Pedang Elemental', 'stat' => 'magic', 'stamina' => 10, 'mana' => 20, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melapisi bilah pedang dengan energi sihir untuk satu serangan.', 'icon' => 'blade-knight-pedang-elemental.svg'],
                ['name' => 'Gelombang Kejut', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 7, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melepaskan gelombang energi dari hantaman ke tanah.', 'icon' => 'blade-knight-gelombang-kejut.svg'],
                ['name' => 'Badai Bilah', 'stat' => 'physical', 'stamina' => 60, 'mana' => 0, 'cd' => 30, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: rangkaian tebasan bertubi-tubi ke segala arah dengan damage fisik masif.', 'icon' => 'blade-knight-badai-bilah.svg'],
                ['name' => 'Murka Ksatria', 'stat' => 'magic', 'stamina' => 0, 'mana' => 60, 'cd' => 30, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: ledakan sihir dari lambang ksatria, damage magic masif ke satu target.', 'icon' => 'blade-knight-murka-ksatria.svg'],
            ],
            'Spellblade' => [
                ['name' => 'Arcane Edge', 'stat' => 'physical', 'stamina' => 15, 'mana' => 10, 'cd' => 5, 'mult' => 1.3, 'desc' => 'Serangan pedang dilapisi energi sihir.'],
                ['name' => 'Mana Slash', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 5, 'mult' => 1.3, 'desc' => 'Gelombang energi dari bilah pedang.'],
            ],
            'Paladin' => [
                ['name' => 'Holy Smite', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 5, 'mult' => 1.5, 'desc' => 'Serangan sihir suci ke satu musuh.'],
                ['name' => 'Divine Shield', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 10, 'mult' => 1.0, 'desc' => 'Perisai sihir sementara untuk diri sendiri.'],
            ],
            'Bulwark' => [
                ['name' => 'Shield Bash', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 4, 'mult' => 1.0, 'desc' => 'Serangan sekaligus menarik aggro musuh.'],
                ['name' => 'Iron Stance', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 10, 'mult' => 1.0, 'desc' => 'Menaikkan physical defense sementara.'],
            ],
            'Warden' => [
                ['name' => 'Mana Barrier', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 10, 'mult' => 1.0, 'desc' => 'Menaikkan magic defense sementara.'],
                ['name' => 'Ward Pulse', 'stat' => 'magic', 'stamina' => 0, 'mana' => 15, 'cd' => 5, 'mult' => 0.9, 'desc' => 'Serangan sihir ringan sekaligus menarik aggro.'],
            ],
            'Sentinel' => [
                ['name' => 'Balanced Guard', 'stat' => 'physical', 'stamina' => 20, 'mana' => 10, 'cd' => 8, 'mult' => 1.0, 'desc' => 'Menaikkan physical & magic defense sedikit.'],
                ['name' => 'Counter Stance', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 6, 'mult' => 1.1, 'desc' => 'Membalas serangan musuh berikutnya.'],
            ],
            'Pyromancer' => [
                ['name' => 'Fireball', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'desc' => 'Bola api ke satu musuh.'],
                ['name' => 'Flame Nova', 'stat' => 'magic', 'stamina' => 0, 'mana' => 35, 'cd' => 10, 'mult' => 1.7, 'desc' => 'Ledakan api ke area sekitar.'],
            ],
            'Hydromancer' => [
                ['name' => 'Water Jet', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'desc' => 'Semburan air bertekanan tinggi.'],
                ['name' => 'Tidal Wave', 'stat' => 'magic', 'stamina' => 0, 'mana' => 35, 'cd' => 10, 'mult' => 1.7, 'desc' => 'Gelombang air ke area sekitar.'],
            ],
            'Geomancer' => [
                ['name' => 'Stone Spike', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'desc' => 'Duri batu muncul dari tanah.'],
                ['name' => 'Quake', 'stat' => 'magic', 'stamina' => 0, 'mana' => 35, 'cd' => 10, 'mult' => 1.7, 'desc' => 'Gempa lokal ke area sekitar.'],
            ],
            'Aeromancer' => [
                ['name' => 'Gale Slash', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'desc' => 'Serangan angin tajam.'],
                ['name' => 'Cyclone', 'stat' => 'magic', 'stamina' => 0, 'mana' => 35, 'cd' => 10, 'mult' => 1.7, 'desc' => 'Puting beliung ke area sekitar.'],
            ],
            'Cleric' => [
                ['name' => 'Heal', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.3, 'desc' => 'Memulihkan HP satu target.'],
                ['name' => 'Sanctuary', 'stat' => 'magic', 'stamina' => 0, 'mana' => 35, 'cd' => 12, 'mult' => 1.5, 'desc' => 'Memulihkan HP seluruh party sedikit.'],
            ],
            'Warlock' => [
                ['name' => 'Curse Mark', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 5, 'mult' => 1.2, 'desc' => 'Menandai musuh dengan damage over time.'],
                ['name' => 'Withering Touch', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 6, 'mult' => 1.3, 'desc' => 'Melemahkan damage musuh sementara.'],
            ],
            'Enchanter' => [
                ['name' => 'Power Chant', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 6, 'mult' => 1.0, 'desc' => 'Menaikkan damage skill satu rekan tim.'],
                ['name' => 'Haste Song', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 8, 'mult' => 1.0, 'desc' => 'Mengurangi cooldown skill rekan tim.'],
            ],
        ];

        foreach ($skills as $subclassName => $list) {
            $subclass = Subclass::where('name', $subclassName)->first();
            if (! $subclass) {
                continue;
            }

            foreach ($list as $skill) {
                $subclass->skills()->updateOrCreate(
                    ['name' => $skill['name']],
                    [
                        'description' => $skill['desc'],
                        'tier' => $skill['tier'] ?? 1,
                        'branch' => null,
                        'scaling_stat' => $skill['stat'],
                        'stamina_cost' => $skill['stamina'],
                        'mana_cost' => $skill['mana'],
                        'cooldown_seconds' => $skill['cd'],
                        'base_multiplier' => $skill['mult'],
                        'icon_path' => isset($skill['icon']) ? '/images/skills/'.$skill['icon'] : null,
                        'required_level' => 1,
                        'element_id' => $subclass->element_id,
                    ]
                );
            }
        }
    }
}
