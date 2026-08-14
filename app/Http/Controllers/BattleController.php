<?php

namespace App\Http\Controllers;

use App\Models\Battle;
use App\Models\Character;
use App\Models\Encounter;
use App\Services\BattleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BattleController extends Controller
{
    public function __construct(private BattleService $battleService) {}

    /**
     * Halaman pilih 2-3 karakter buat lawan monster dari suatu encounter.
     */
    public function select(Encounter $encounter): Response
    {
        $encounter->load('monster');
        $characters = Character::with('subclass.gameClass')->get();

        return Inertia::render('Battle/Select', [
            'encounter' => $encounter,
            'characters' => $characters,
            'preselected' => session('guild_party', []),
        ]);
    }

    public function start(Request $request, Encounter $encounter): RedirectResponse
    {
        $data = $request->validate([
            'character_ids' => ['required', 'array', 'min:2', 'max:3'],
            'character_ids.*' => ['exists:characters,id'],
        ]);

        $battle = $this->battleService->startBattle($encounter, $data['character_ids']);

        return redirect()->route('battles.show', $battle->id);
    }

    public function show(Battle $battle): Response
    {
        $battle->load(['participants.character.subclass.gameClass', 'participants.character.subclass.skills', 'monster.element']);

        return Inertia::render('Battle/Show', [
            'battle' => $battle,
        ]);
    }

    public function flee(Battle $battle): RedirectResponse
    {
        $this->battleService->flee($battle);

        return redirect()->route('maps.index');
    }
}
