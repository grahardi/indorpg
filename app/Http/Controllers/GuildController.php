<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RollsNpcAvailability;
use App\Http\Controllers\Concerns\ValidatesPartyOwnership;
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
    use RollsNpcAvailability, ValidatesPartyOwnership;

    public function __construct(private BattleService $battleService) {}

    public function index(Request $request): Response
    {
        // Pisah karakter pemain (sendiri aja, milik user lain masih disembunyikan
        // dulu) sama NPC - dua list terpisah, bukan digabung kayak sebelumnya.
        $playerCharacters = Character::with(['subclass.gameClass'])
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        $npcCharacters = Character::with(['subclass.gameClass'])
            ->where('is_npc', true)
            ->orderBy('name')
            ->get();

        // FITUR "NPC ON MISSION" DIMATIKAN SEMENTARA - kemarin kejadian semua NPC
        // ke-mark "Sedang Misi" pas testing (kemungkinan besar gara-gara reload
        // berkali-kali numpuk banyak NPC ke-roll busy bersamaan). Nanti diaktifkan
        // lagi setelah logic-nya diperbaiki (misal: cooldown per-request/session,
        // bukan re-roll tiap page load).
        // $this->rollNpcAvailability($npcCharacters);

        // Level NPC di database selalu 1 (lihat catatan di Character::resolveNpcLevel) -
        // sekarang di-cache 300 detik (default) biar angka yang keliatan pas
        // milih party = angka yang beneran dipakai pas battle, gak diacak ulang.
        $playerMaxLevel = (int) ($playerCharacters->max('level') ?: 1);

        $npcCharacters->each(function (Character $c) use ($playerMaxLevel) {
            $c->npc_display_level = $c->resolveNpcLevel($playerMaxLevel);
        });

        return Inertia::render('Guild/Index', [
            'playerCharacters' => $playerCharacters,
            'npcCharacters' => $npcCharacters,
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

        $this->ensureOwnedCharacterInParty($request, $data['character_ids']);
        $this->ensureNoBusyNpcInParty($data['character_ids']);
        $this->ensureNoFaintedCharacterInParty($data['character_ids']);

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

        $this->ensureOwnedCharacterInParty($request, $data['character_ids']);
        $this->ensureNoBusyNpcInParty($data['character_ids']);
        $this->ensureNoFaintedCharacterInParty($data['character_ids']);

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

        // Party udah dipilih di Guild, tapi jangan langsung mulai battle -
        // lempar ke halaman "lineup" (encounters.select) dulu biar player bisa
        // liat susunan party vs monster & pilih Frontman. Party-nya di-prefill
        // otomatis lewat session (sama mekanisme kayak jalur explore peta).
        session(['guild_party' => $data['character_ids']]);

        return redirect()->route('encounters.select', $encounter);
    }
}
