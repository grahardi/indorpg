<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Encounter;
use App\Models\SpawnPoint;
use App\Services\BattleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuildController extends Controller
{
    public function __construct(private BattleService $battleService) {}

    public function index(): Response
    {
        $characters = Character::with('subclass.gameClass')->get();

        return Inertia::render('Guild/Index', [
            'characters' => $characters,
        ]);
    }

    /**
     * Simpan pilihan party di session, lalu lempar ke halaman peta.
     * Dipakai biar party yang udah dipilih di Guild gak perlu dipilih ulang
     * pas nyampe di Battle/Select.
     */
    public function setPartyAndExplore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'character_ids' => ['required', 'array', 'min:2', 'max:3'],
            'character_ids.*' => ['exists:characters,id'],
        ]);

        session(['guild_party' => $data['character_ids']]);

        return redirect()->route('maps.index');
    }

    /**
     * "Ambil Misi Cepat" - langsung dicariin monster yang levelnya cocok
     * sama rata-rata level party, tanpa perlu buka peta manual.
     */
    public function quickMission(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'character_ids' => ['required', 'array', 'min:2', 'max:3'],
            'character_ids.*' => ['exists:characters,id'],
        ]);

        $characters = Character::whereIn('id', $data['character_ids'])->get();

        $monster = $this->battleService->findQuickMissionMonster($characters);

        if (! $monster) {
            return back()->withErrors(['mission' => 'Belum ada monster yang cocok. Coba lagi nanti.']);
        }

        // Misi cepat gak terikat spawn point manapun di peta, jadi pakai
        // spawn point "virtual" pertama yang punya monster ini di pool-nya
        // (biar cooldown & relasi encounter tetap konsisten dengan sistem map).
        $spawnPoint = SpawnPoint::whereHas('monsters', fn ($q) => $q->where('monsters.id', $monster->id))->first();

        if (! $spawnPoint) {
            $spawnPoint = SpawnPoint::first();
        }

        $encounter = Encounter::create([
            'spawn_point_id' => $spawnPoint->id,
            'monster_id' => $monster->id,
            'status' => 'pending',
        ]);

        $battle = $this->battleService->startBattle($encounter, $data['character_ids']);

        return redirect()->route('battles.show', $battle->id);
    }
}
