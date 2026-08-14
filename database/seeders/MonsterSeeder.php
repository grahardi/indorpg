<?php

namespace Database\Seeders;

use App\Models\Element;
use App\Models\Monster;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MonsterSeeder extends Seeder
{
    public function run(): void
    {
        $monsters = [
            ['name' => 'Slime Api', 'level' => 1, 'type' => 'Slime', 'element' => 'Fire',
                'strong' => 'range_physical', 'weak' => 'area_magic',
                'hp' => 360, 'phys_dmg' => 8, 'phys_def' => 5, 'magic_dmg' => 10, 'magic_def' => 6,
                'exp' => 15, 'min_party_level' => 1,
                'skill_name' => 'Regenerasi Panas', 'skill_desc' => 'Memulihkan sedikit HP di akhir setiap giliran.',
                'desc' => 'Gumpalan lendir yang membara, tubuhnya lentur sehingga panah dan tombak cuma tenggelam tanpa efek berarti.'],

            ['name' => 'Slime Air', 'level' => 1, 'type' => 'Slime', 'element' => 'Water',
                'strong' => 'close_physical', 'weak' => 'range_magic',
                'hp' => 384, 'phys_dmg' => 7, 'phys_def' => 6, 'magic_dmg' => 9, 'magic_def' => 7,
                'exp' => 15, 'min_party_level' => 1,
                'skill_name' => 'Serap Elemen', 'skill_desc' => 'Mengurangi damage magic yang diterima sebesar 20% selama 2 giliran.',
                'desc' => 'Tubuh bening berisi air yang meredam pukulan jarak dekat, tapi mudah terurai kena serangan sihir jarak jauh.'],

            ['name' => 'Tikus Raksasa', 'level' => 1, 'type' => 'Beast', 'element' => null,
                'strong' => 'area_physical', 'weak' => 'close_physical',
                'hp' => 240, 'phys_dmg' => 9, 'phys_def' => 3, 'magic_dmg' => 2, 'magic_def' => 3,
                'exp' => 10, 'min_party_level' => 1,
                'skill_name' => 'Gigitan Beruntun', 'skill_desc' => 'Peluang kecil menyerang dua kali dalam satu giliran.',
                'desc' => 'Hewan pengerat raksasa yang gesit, terlalu kecil dan lincah buat kena sapuan area, tapi lemah kalau dikepung dari dekat.'],

            ['name' => 'Kelelawar Gua', 'level' => 2, 'type' => 'Beast', 'element' => 'Wind',
                'strong' => 'area_magic', 'weak' => 'range_physical',
                'hp' => 304, 'phys_dmg' => 10, 'phys_def' => 4, 'magic_dmg' => 6, 'magic_def' => 8,
                'exp' => 20, 'min_party_level' => 1,
                'skill_name' => 'Ekolokasi', 'skill_desc' => 'Serangan berikutnya tidak akan meleset (akurasi 100%).',
                'desc' => 'Terbang berputar-putar tak menentu di kegelapan, sapuan sihir area sering meleset, tapi mudah ditembak jatuh.'],

            ['name' => 'Bandit Pemula', 'level' => 2, 'type' => 'Humanoid', 'element' => null,
                'strong' => 'close_physical', 'weak' => 'range_magic',
                'hp' => 336, 'phys_dmg' => 11, 'phys_def' => 7, 'magic_dmg' => 3, 'magic_def' => 4,
                'exp' => 22, 'min_party_level' => 2,
                'skill_name' => 'Curi Emas', 'skill_desc' => 'Mencuri sedikit exp/gold dari party saat berhasil menyerang.',
                'desc' => 'Perampok jalanan bersenjata pedang pendek dan perisai kecil, cukup terlatih menangkis serangan dekat.'],

            ['name' => 'Laba-laba Beracun', 'level' => 3, 'type' => 'Insect', 'element' => 'Earth',
                'strong' => 'close_physical', 'weak' => 'area_magic',
                'hp' => 400, 'phys_dmg' => 12, 'phys_def' => 6, 'magic_dmg' => 5, 'magic_def' => 5,
                'exp' => 28, 'min_party_level' => 2,
                'skill_name' => 'Gigitan Racun', 'skill_desc' => 'Menyebabkan racun yang mengurangi HP musuh tiap giliran selama 3 giliran.',
                'desc' => 'Bersarang di celah bebatuan, taringnya beracun membuat siapapun yang berani mendekat harus berpikir dua kali.'],

            ['name' => 'Serigala Hutan', 'level' => 3, 'type' => 'Beast', 'element' => 'Earth',
                'strong' => 'range_magic', 'weak' => 'close_physical',
                'hp' => 440, 'phys_dmg' => 14, 'phys_def' => 7, 'magic_dmg' => 4, 'magic_def' => 6,
                'exp' => 30, 'min_party_level' => 2,
                'skill_name' => 'Lari Cepat', 'skill_desc' => 'Selalu menyerang lebih dulu di giliran pertama pertarungan.',
                'desc' => 'Berburu dalam kawanan, insting liarnya membuatnya lincah menghindar dari sihir jarak jauh.'],

            ['name' => 'Zombie Reyot', 'level' => 3, 'type' => 'Undead', 'element' => null,
                'strong' => 'close_physical', 'weak' => 'area_magic',
                'hp' => 520, 'phys_dmg' => 10, 'phys_def' => 8, 'magic_dmg' => 3, 'magic_def' => 3,
                'exp' => 25, 'min_party_level' => 2,
                'skill_name' => 'Tak Kenal Sakit', 'skill_desc' => 'Kebal terhadap efek stagger/stun dari serangan fisik.',
                'desc' => 'Mayat hidup yang bergerak lamban, tubuhnya sudah mati rasa terhadap pukulan tapi hancur berantakan kena sihir area.'],

            ['name' => 'Peri Air', 'level' => 4, 'type' => 'Spirit', 'element' => 'Water',
                'strong' => 'area_physical', 'weak' => 'close_magic',
                'hp' => 384, 'phys_dmg' => 6, 'phys_def' => 5, 'magic_dmg' => 15, 'magic_def' => 10,
                'exp' => 35, 'min_party_level' => 3,
                'skill_name' => 'Kabut Penyembuh', 'skill_desc' => 'Memulihkan HP dirinya sendiri setiap 2 giliran.',
                'desc' => 'Roh air yang lembut namun licin, tubuh kabutnya sulit kena sapuan area tapi rentan disihir dari jarak dekat.'],

            ['name' => 'Elemental Api Kecil', 'level' => 5, 'type' => 'Elemental', 'element' => 'Fire',
                'strong' => 'range_physical', 'weak' => 'close_magic',
                'hp' => 480, 'phys_dmg' => 8, 'phys_def' => 6, 'magic_dmg' => 20, 'magic_def' => 12,
                'exp' => 45, 'min_party_level' => 3,
                'skill_name' => 'Ledakan Panas', 'skill_desc' => 'Saat HP di bawah 30%, meledak sekali memberi damage area ke seluruh party.',
                'desc' => 'Kobaran api hidup, panah dan proyektil fisik cuma menembus tanpa bekas, tapi rentan disihir dari dekat.'],

            ['name' => 'Golem Batu Kecil', 'level' => 5, 'type' => 'Construct', 'element' => 'Earth',
                'strong' => 'close_physical', 'weak' => 'range_magic',
                'hp' => 720, 'phys_dmg' => 16, 'phys_def' => 18, 'magic_dmg' => 4, 'magic_def' => 8,
                'exp' => 50, 'min_party_level' => 4,
                'skill_name' => 'Kulit Batu', 'skill_desc' => 'Mengurangi seluruh damage fisik masuk sebesar 25% secara permanen.',
                'desc' => 'Konstruksi batu yang lambat tapi sangat kokoh, nyaris tak mempan pukulan biasa, namun retak kena sihir jarak jauh yang presisi.'],

            ['name' => 'Harpy Muda', 'level' => 6, 'type' => 'Beast', 'element' => 'Wind',
                'strong' => 'area_magic', 'weak' => 'range_physical',
                'hp' => 560, 'phys_dmg' => 17, 'phys_def' => 9, 'magic_dmg' => 10, 'magic_def' => 10,
                'exp' => 60, 'min_party_level' => 4,
                'skill_name' => 'Cakar Kilat', 'skill_desc' => 'Peluang tinggi menyerang dua kali beruntun tiap giliran.',
                'desc' => 'Terbang gesit berputar-putar di udara, sapuan sihir area sering meleset mengejarnya, tapi jadi sasaran empuk tembakan jarak jauh.'],
        ];

        foreach ($monsters as $m) {
            $elementId = $m['element'] ? Element::where('name', $m['element'])->value('id') : null;

            Monster::updateOrCreate(
                ['slug' => Str::slug($m['name'])],
                [
                    'name' => $m['name'],
                    'level' => $m['level'],
                    'type' => $m['type'],
                    'element_id' => $elementId,
                    'strong_against' => $m['strong'],
                    'weak_against' => $m['weak'],
                    'hp' => $m['hp'],
                    'physical_damage' => $m['phys_dmg'],
                    'physical_defense' => $m['phys_def'],
                    'magic_damage' => $m['magic_dmg'],
                    'magic_defense' => $m['magic_def'],
                    'exp_reward' => $m['exp'],
                    'min_party_level' => $m['min_party_level'],
                    'special_skill_name' => $m['skill_name'],
                    'special_skill_description' => $m['skill_desc'],
                    'description' => $m['desc'],
                ]
            );
        }
    }
}
