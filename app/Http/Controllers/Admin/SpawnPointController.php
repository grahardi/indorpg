<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMap;
use App\Models\Monster;
use App\Models\SpawnPoint;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpawnPointController extends Controller
{
    public function index(GameMap $map): Response
    {
        return Inertia::render('Admin/SpawnPoints/Index', [
            'map' => $map,
            'spawnPoints' => $map->spawnPoints()->with('monsters')->get(),
        ]);
    }

    public function create(GameMap $map): Response
    {
        return Inertia::render('Admin/SpawnPoints/Form', [
            'map' => $map,
            'spawnPoint' => null,
            'monsters' => Monster::orderBy('level')->get(['id', 'name', 'level', 'class_rank']),
        ]);
    }

    public function store(Request $request, GameMap $map): RedirectResponse
    {
        $data = $this->validated($request);
        $monsterWeights = $data['monsters'];
        unset($data['monsters']);

        $spawnPoint = $map->spawnPoints()->create($data);
        $spawnPoint->monsters()->sync($this->weightMap($monsterWeights));

        return redirect()->route('admin.maps.spawn-points.index', $map->id)->with('success', 'Spawn point dibuat.');
    }

    public function edit(GameMap $map, SpawnPoint $spawnPoint): Response
    {
        return Inertia::render('Admin/SpawnPoints/Form', [
            'map' => $map,
            'spawnPoint' => $spawnPoint->load('monsters'),
            'monsters' => Monster::orderBy('level')->get(['id', 'name', 'level', 'class_rank']),
        ]);
    }

    public function update(Request $request, GameMap $map, SpawnPoint $spawnPoint): RedirectResponse
    {
        $data = $this->validated($request);
        $monsterWeights = $data['monsters'];
        unset($data['monsters']);

        $spawnPoint->update($data);
        $spawnPoint->monsters()->sync($this->weightMap($monsterWeights));

        return redirect()->route('admin.maps.spawn-points.index', $map->id)->with('success', 'Spawn point diupdate.');
    }

    public function destroy(GameMap $map, SpawnPoint $spawnPoint): RedirectResponse
    {
        $spawnPoint->delete();

        return redirect()->route('admin.maps.spawn-points.index', $map->id)->with('success', 'Spawn point dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'pos_x' => ['required', 'numeric', 'min:0', 'max:100'],
            'pos_y' => ['required', 'numeric', 'min:0', 'max:100'],
            'min_monster_level' => ['required', 'integer', 'min:1'],
            'respawn_seconds' => ['required', 'integer', 'min:0'],
            'monsters' => ['required', 'array', 'min:1'],
            'monsters.*.id' => ['required', 'exists:monsters,id'],
            'monsters.*.weight' => ['required', 'integer', 'min:1'],
        ]);
    }

    /**
     * Format [{'id':1,'weight':5}, ...] -> [1 => ['weight'=>5], ...] buat sync() pivot.
     */
    private function weightMap(array $monsterWeights): array
    {
        $map = [];
        foreach ($monsterWeights as $m) {
            $map[$m['id']] = ['weight' => $m['weight']];
        }

        return $map;
    }
}
