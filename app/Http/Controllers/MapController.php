<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Encounter;
use App\Models\GameMap;
use App\Models\GameSetting;
use App\Models\SpawnPoint;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function index(): Response
    {
        $maps = GameMap::withCount('spawnPoints')->orderBy('min_level')->get();

        return Inertia::render('Maps/Index', [
            'maps' => $maps,
        ]);
    }

    public function show(GameMap $map): Response
    {
        $playerMaxLevel = auth()->check()
            ? (Character::where('user_id', auth()->id())->max('level') ?? 1)
            : 1;
        $bonus = GameSetting::getInt('monster_level_variance', 3);

        $spawnPoints = $map->spawnPoints()
            ->with(['monsters' => function ($q) {
                $q->select('monsters.id', 'name', 'level');
            }])
            ->get()
            ->map(function (SpawnPoint $sp) use ($playerMaxLevel, $bonus) {
                return [
                    'id' => $sp->id,
                    'name' => $sp->name,
                    'pos_x' => $sp->pos_x,
                    'pos_y' => $sp->pos_y,
                    'min_monster_level' => $sp->min_monster_level,
                    'is_locked' => ($playerMaxLevel + $bonus) < $sp->min_monster_level,
                    'on_cooldown' => $sp->isOnCooldown(),
                    'cooldown_remaining' => $sp->cooldownRemainingSeconds(),
                    'monsters' => $sp->monsters,
                ];
            });

        return Inertia::render('Maps/Show', [
            'map' => $map,
            'spawnPoints' => $spawnPoints,
        ]);
    }

    /**
     * Trigger algoritma roll monster di satu spawn point. Dicek dulu gerbang
     * level-nya: level tertinggi karakter (milik user ini) + bonus admin
     * harus >= min_monster_level spawn point ini.
     */
    public function explore(SpawnPoint $spawnPoint): RedirectResponse
    {
        $playerMaxLevel = Character::where('user_id', auth()->id())->max('level') ?? 1;
        $bonus = GameSetting::getInt('monster_level_variance', 3);

        if (($playerMaxLevel + $bonus) < $spawnPoint->min_monster_level) {
            return back()->with('explore_result', [
                'status' => 'locked',
                'message' => "Level kamu belum cukup buat masuk area ini. Butuh level tertinggi karakter + {$bonus} minimal {$spawnPoint->min_monster_level} (sekarang: {$playerMaxLevel}).",
            ]);
        }

        $monster = $spawnPoint->rollMonster();

        if (! $monster) {
            return back()->with('explore_result', [
                'status' => 'cooldown',
                'message' => 'Area ini masih sepi, monsternya belum muncul lagi. Coba lagi nanti.',
            ]);
        }

        $encounter = Encounter::create([
            'spawn_point_id' => $spawnPoint->id,
            'monster_id' => $monster->id,
            'status' => 'pending',
        ]);

        return back()->with('explore_result', [
            'status' => 'encounter',
            'encounter_id' => $encounter->id,
            'monster' => $monster,
            'message' => "{$monster->name} muncul!",
        ]);
    }
}
