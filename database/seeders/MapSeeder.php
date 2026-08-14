<?php

namespace Database\Seeders;

use App\Models\GameMap;
use App\Models\Monster;
use App\Models\SpawnPoint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MapSeeder extends Seeder
{
    public function run(): void
    {
        $maps = [
            [
                'name' => 'Hutan Awal',
                'description' => 'Area petualangan pertama, cocok buat party baru mulai.',
                'min_level' => 1,
                'max_level' => 3,
                'spawn_points' => [
                    ['name' => 'Tepi Hutan', 'pos_x' => 20, 'pos_y' => 70, 'respawn' => 180,
                        'monsters' => ['Slime Api' => 10, 'Slime Air' => 10, 'Tikus Raksasa' => 15]],
                    ['name' => 'Gua Kelelawar', 'pos_x' => 55, 'pos_y' => 30, 'respawn' => 240,
                        'monsters' => ['Kelelawar Gua' => 15, 'Tikus Raksasa' => 8]],
                    ['name' => 'Jalan Setapak', 'pos_x' => 75, 'pos_y' => 60, 'respawn' => 300,
                        'monsters' => ['Serigala Hutan' => 12, 'Bandit Pemula' => 10]],
                    ['name' => 'Kolam Tenang', 'pos_x' => 40, 'pos_y' => 45, 'respawn' => 200,
                        'monsters' => ['Slime Air' => 15]],
                ],
            ],
            [
                'name' => 'Reruntuhan Kuno',
                'description' => 'Bekas kuil yang sudah runtuh, lebih berbahaya dari Hutan Awal.',
                'min_level' => 3,
                'max_level' => 6,
                'spawn_points' => [
                    ['name' => 'Gerbang Reruntuhan', 'pos_x' => 25, 'pos_y' => 65, 'respawn' => 300,
                        'monsters' => ['Zombie Reyot' => 15]],
                    ['name' => 'Sarang Laba-laba', 'pos_x' => 60, 'pos_y' => 25, 'respawn' => 240,
                        'monsters' => ['Laba-laba Beracun' => 15]],
                    ['name' => 'Kuil Terendam', 'pos_x' => 45, 'pos_y' => 50, 'respawn' => 300,
                        'monsters' => ['Peri Air' => 10, 'Elemental Api Kecil' => 10]],
                    ['name' => 'Puncak Menara', 'pos_x' => 80, 'pos_y' => 35, 'respawn' => 360,
                        'monsters' => ['Harpy Muda' => 12, 'Golem Batu Kecil' => 8]],
                ],
            ],
        ];

        foreach ($maps as $mapData) {
            $map = GameMap::updateOrCreate(
                ['slug' => Str::slug($mapData['name'])],
                [
                    'name' => $mapData['name'],
                    'description' => $mapData['description'],
                    'min_level' => $mapData['min_level'],
                    'max_level' => $mapData['max_level'],
                ]
            );

            foreach ($mapData['spawn_points'] as $spData) {
                $spawnPoint = SpawnPoint::updateOrCreate(
                    ['map_id' => $map->id, 'name' => $spData['name']],
                    [
                        'pos_x' => $spData['pos_x'],
                        'pos_y' => $spData['pos_y'],
                        'respawn_seconds' => $spData['respawn'],
                    ]
                );

                $syncData = [];
                foreach ($spData['monsters'] as $monsterName => $weight) {
                    $monster = Monster::where('name', $monsterName)->first();
                    if ($monster) {
                        $syncData[$monster->id] = ['weight' => $weight];
                    }
                }
                $spawnPoint->monsters()->sync($syncData);
            }
        }
    }
}
