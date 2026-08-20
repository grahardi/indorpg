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
     * Halaman pilih Frontman - party-nya UDAH FIX (dipilih di Guild sebelumnya,
     * disimpen di session), di sini cuma nampilin party vs monster + pilih
     * Frontman. Kalau session party kosong (misal user nyasar akses langsung
     * tanpa lewat Guild dulu), lempar balik ke Guild.
     */
    public function select(Request $request, Encounter $encounter): Response|RedirectResponse
    {
        $partyIds = session('guild_party', []);

        if (empty($partyIds)) {
            return redirect()->route('guild.index')
                ->withErrors(['mission' => 'Pilih party dulu di Guild sebelum battle.']);
        }

        $encounter->load('monster');

        $characters = Character::with(['subclass.gameClass'])->whereIn('id', $partyIds)->get();
        // whereIn() gak jamin urutan - urutin balik sesuai urutan pilih di Guild
        // (karakter pemain pertama, biar tampil di posisi utama).
        $characters = collect($partyIds)->map(fn ($id) => $characters->firstWhere('id', $id))->filter()->values();

        $playerMaxLevel = (int) (Character::where('user_id', $request->user()->id)->where('is_npc', false)->max('level') ?: 1);

        $characters->each(function (Character $c) use ($playerMaxLevel) {
            if ($c->is_npc) {
                $c->npc_display_level = $c->resolveNpcLevel($playerMaxLevel);
            }
        });

        return Inertia::render('Battle/Select', [
            'encounter' => $encounter,
            'characters' => $characters,
        ]);
    }

    public function start(Request $request, Encounter $encounter): RedirectResponse
    {
        $data = $request->validate([
            'character_ids' => ['required', 'array', 'min:2', 'max:3'],
            'character_ids.*' => ['exists:characters,id'],
            'frontman_character_id' => ['nullable', 'integer', 'in:'.implode(',', $request->input('character_ids', []))],
            'mode' => ['nullable', 'string', 'in:auto,manual'],
        ]);

        $this->ensureOwnedCharacterInParty($request, $data['character_ids']);
        $this->ensureNoBusyNpcInParty($data['character_ids']);
        $this->ensureNoFaintedCharacterInParty($data['character_ids']);

        $battle = $this->battleService->startBattle(
            $encounter,
            $data['character_ids'],
            $data['frontman_character_id'] ?? null,
            $data['mode'] ?? 'auto',
        );

        return redirect()->route('battles.show', $battle);
    }

    /**
     * Mode MANUAL: 1 giliran/aksi per request - player klik tombol skill
     * (atau tekan keyboard) di frontend, ini yang mroses giliran itu ke server
     * dan balikin log delta + state terbaru. Response JSON (bukan Inertia
     * redirect/render) biar responsif, gak reload halaman tiap aksi.
     */
    public function act(Request $request, Battle $battle)
    {
        if ($battle->mode !== 'manual' || $battle->status !== 'ongoing') {
            return response()->json(['error' => 'Battle ini bukan mode manual atau udah selesai.'], 422);
        }

        $data = $request->validate([
            'skill_id' => ['nullable', 'integer', 'exists:skills,id'],
        ]);

        // Karakter yang dikontrol = karakter PEMAIN INI (bukan NPC/karakter
        // orang lain) yang ada di party battle ini.
        $actingCharacter = Character::where('user_id', $request->user()->id)
            ->whereIn('id', $battle->participants()->pluck('character_id'))
            ->first();

        if (! $actingCharacter) {
            return response()->json(['error' => 'Kamu gak punya karakter di battle ini.'], 403);
        }

        $log = $this->battleService->processManualTurn($battle, $actingCharacter, $data['skill_id'] ?? null);
        $battle->refresh()->load(['participants.character.subclass', 'monster']);

        return response()->json([
            'battle' => $battle,
            'log' => $log,
        ]);
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
            'keyBindings' => [
                'skill1' => \App\Models\GameSetting::get('skill_key_1', 'Q'),
                'skill2' => \App\Models\GameSetting::get('skill_key_2', 'W'),
                'skill3' => \App\Models\GameSetting::get('skill_key_3', 'A'),
                'skill4' => \App\Models\GameSetting::get('skill_key_4', 'S'),
                'ulti' => \App\Models\GameSetting::get('skill_key_ulti', 'R'),
            ],
            'skillActionDelay' => \App\Models\GameSetting::getFloat('skill_action_delay', 2),
        ]);
    }

    public function flee(Battle $battle): RedirectResponse
    {
        $this->battleService->flee($battle);

        return redirect()->route('maps.index');
    }
}
