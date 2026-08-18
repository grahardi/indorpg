<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RollsNpcAvailability;
use App\Http\Controllers\Concerns\ValidatesPartyOwnership;
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
    use RollsNpcAvailability, ValidatesPartyOwnership;

    public function __construct(private BattleService $battleService) {}

    /**
     * Halaman pilih 2-3 karakter buat lawan monster dari suatu encounter.
     */
    public function select(Request $request, Encounter $encounter): Response
    {
        $encounter->load('monster');

        $characters = Character::with(['subclass.gameClass', 'user'])
            ->where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)->orWhere('is_npc', true);
            })
            ->get();

        // Fitur "NPC on mission" dimatikan sementara - lihat catatan di GuildController.
        // $this->rollNpcAvailability($characters);

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

        $this->ensureOwnedCharacterInParty($request, $data['character_ids']);
        $this->ensureNoBusyNpcInParty($data['character_ids']);
        $this->ensureNoFaintedCharacterInParty($data['character_ids']);

        $battle = $this->battleService->startBattle($encounter, $data['character_ids']);

        return redirect()->route('battles.show', $battle);
    }

    public function show(Battle $battle): Response|RedirectResponse
    {
        // Battle yang statusnya udah final (bukan ongoing) dan udah pernah dibuka
        // sekali sebelumnya -> anggap ini "history", jangan ditampilkan ulang kayak
        // battle hidup lagi (misal user pencet Back di browser). Lempar ke Guild.
        if ($battle->status !== 'ongoing' && $battle->viewed_at !== null) {
            return redirect()->route('guild.index')
                ->withErrors(['mission' => 'Battle ini udah pernah selesai dan dilihat sebelumnya.']);
        }

        if ($battle->viewed_at === null) {
            $battle->update(['viewed_at' => now()]);
        }

        $battle->load([
            'participants.character.subclass.gameClass',
            'participants.character.subclass.skills',
            'monster.element',
            'monster.spawnPoints.map',
        ]);

        return Inertia::render('Battle/Show', [
            'battle' => $battle,
            'battleBackground' => $battle->monster->battleBackgroundPath(),
        ]);
    }

    public function flee(Battle $battle): RedirectResponse
    {
        $this->battleService->flee($battle);

        return redirect()->route('maps.index');
    }
}
