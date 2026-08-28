<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Skill;
use App\Models\Subclass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CharacterController extends Controller
{
    public function index(Request $request): Response
    {
        $characters = Character::with(['subclass.gameClass', 'subclass.element', 'user'])
            ->where('user_id', $request->user()?->id)
            ->latest()
            ->get();

        return Inertia::render('Characters/Index', [
            'characters' => $characters,
        ]);
    }

    public function create(): Response
    {
        $subclasses = Subclass::with('gameClass')->orderBy('class_id')->get();

        return Inertia::render('Characters/Create', [
            'subclasses' => $subclasses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'subclass_id' => ['required', 'exists:subclasses,id'],
        ]);

        $subclass = Subclass::with('gameClass')->findOrFail($data['subclass_id']);

        $character = Character::create([
            'user_id' => $request->user()->id,
            'subclass_id' => $subclass->id,
            'name' => $data['name'],
            'level' => 1,
            'exp' => 0,
            'current_hp' => $subclass->base_hp,
            'current_stamina' => $subclass->base_sp,
            'current_mana' => $subclass->base_mp,
        ]);

        return redirect()->route('characters.show', $character->id);
    }

    public function show(Character $character): Response
    {
        $character->load(['subclass.gameClass', 'subclass.element', 'subclass.skills', 'skills', 'items.element']);

        return Inertia::render('Characters/Show', [
            'character' => $character,
            // Buat preview damage per skill di kartu (sementara, bantu debug OP) -
            // formula-nya PERSIS sama kayak yang beneran dipakai di battle
            // (lihat BattleService::skillCombatStats).
            'skillLevelGrowthRatio' => \App\Models\GameSetting::getFloat('skill_level_growth_ratio', 1.3),
            'itemLevelGrowthRatio' => \App\Models\GameSetting::getFloat('item_level_growth_ratio', 1.0),
        ]);
    }

    public function destroy(Character $character): RedirectResponse
    {
        $character->delete();

        return redirect()->route('characters.index');
    }

    /**
     * Upgrade 1 poin stat pakai EXP. Cuma pemilik karakter yang boleh.
     */
    /**
     * Upgrade 1 poin stat. Prioritas pakai stat_points gratis (dari naik level)
     * dulu kalau ada, baru potong EXP kalau stat_points abis.
     */
    public function upgradeStat(Request $request, Character $character): RedirectResponse
    {
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $data = $request->validate([
            'stat' => ['required', 'string', 'in:'.implode(',', Character::UPGRADABLE_STATS)],
        ]);

        if ($character->stat_points > 0) {
            $cost = $character->freePointCost($data['stat']);

            if ($character->stat_points < $cost) {
                return back()->withErrors(['stat' => "Butuh {$cost} stat point buat naikin stat ini lagi (kamu punya {$character->stat_points}). Investasi ke stat ini udah tinggi, cost-nya naik tiap kelipatan 25 poin."]);
            }

            $character->decrement('stat_points', $cost);
            $character->increment("bonus_{$data['stat']}");

            return back();
        }

        $cost = $character->upgradeCost($data['stat']);

        if ($character->exp < $cost) {
            return back()->withErrors(['stat' => 'Stat point abis dan EXP gak cukup buat upgrade ini.']);
        }

        $character->decrement('exp', $cost);
        $character->increment("bonus_{$data['stat']}");

        return back();
    }

    /**
     * Simpan loadout manual: harus persis 4 skill tier 1 (skill/magic biasa)
     * + 1 skill tier 3 (ultimate), semua dari subclass karakter itu sendiri.
     * Kalau kosong (belum pernah diisi), battle otomatis random 4+1.
     */
    public function updateLoadout(Request $request, Character $character): RedirectResponse
    {
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $data = $request->validate([
            'skill_ids' => ['required', 'array', 'size:5'],
            'skill_ids.*' => ['required', 'integer', 'exists:skills,id'],
        ]);

        $skills = \App\Models\Skill::whereIn('id', $data['skill_ids'])
            ->where('subclass_id', $character->subclass_id)
            ->get();

        if ($skills->count() !== 5) {
            return back()->withErrors(['skill_ids' => 'Semua skill harus dari subclass karakter ini.']);
        }

        $tier1Count = $skills->where('tier', 1)->count();
        $tier3Count = $skills->where('tier', 3)->count();

        if ($tier1Count !== 4 || $tier3Count !== 1) {
            return back()->withErrors(['skill_ids' => 'Harus persis 4 skill biasa + 1 ultimate.']);
        }

        $character->skills()->sync($data['skill_ids']);

        return back();
    }

    /**
     * "Skill point allocation" - invest EXP ke skill SPESIFIK (bukan stat
     * karakter generik). Tiap poin: +1% damage & -1% cooldown skill itu.
     * Cuma bisa buat skill yang ada di loadout manual karakter (character_skills).
     */
    public function allocateSkillPoint(Request $request, Character $character, Skill $skill): RedirectResponse
    {
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $pivot = $character->skills()->where('skill_id', $skill->id)->first();
        if (! $pivot) {
            return back()->withErrors(['skill' => 'Skill ini belum ada di loadout manual karaktermu.']);
        }

        $currentBonus = $pivot->pivot->bonus_level;
        $cost = ($currentBonus + 1) * 10;

        if ($character->exp < $cost) {
            return back()->withErrors(['skill' => 'EXP gak cukup buat allocate poin ke skill ini.']);
        }

        $character->decrement('exp', $cost);
        $character->skills()->updateExistingPivot($skill->id, ['bonus_level' => $currentBonus + 1]);

        return back();
    }

    /**
     * Toggle equip/unequip item - maks 4 item ke-equip sekaligus per karakter.
     */
    public function toggleEquipItem(Request $request, Character $character, int $characterItemId): RedirectResponse
    {
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        // BUG FIX FATAL: sebelumnya diidentifikasi pakai item_id (Item::class,
        // route-model-bound {item}) - kalau karakter punya LEBIH dari 1 copy
        // item yang SAMA (item_id sama, pivot row beda), updateExistingPivot()
        // di bawah bakal nge-update SEMUA baris yang item_id-nya cocok, BUKAN
        // cuma 1 copy yang dimaksud. Efeknya: equip 1 copy, SEMUA copy ikut
        // ke-equip. Fix: identifikasi by PIVOT ROW ID (character_items.id)
        // yang UNIK per baris, gak peduli ada berapa banyak copy item sama.
        $pivotRow = \Illuminate\Support\Facades\DB::table('character_items')
            ->where('id', $characterItemId)
            ->where('character_id', $character->id)
            ->first();

        if (! $pivotRow) {
            return back()->withErrors(['item' => 'Item ini gak ada di inventory karaktermu.']);
        }

        $item = \App\Models\Item::findOrFail($pivotRow->item_id);

        // Cuma Artifact Item (equipment beneran) yang bisa di-equip - Accession
        // (catalyst sekali pakai) & Material sama sekali BUKAN equipment.
        // Validasi server-side ini jaga-jaga (defense in depth) di luar
        // tombol Equip yang emang udah disembunyiin di frontend buat
        // kategori selain artifact (bagian 97).
        if ($item->category !== 'artifact') {
            return back()->withErrors(['item' => 'Cuma Artifact Item yang bisa di-equip.']);
        }

        $isEquipped = (bool) $pivotRow->is_equipped;

        if (! $isEquipped) {
            $equippedCount = $character->items()->wherePivot('is_equipped', true)->count();
            if ($equippedCount >= 4) {
                return back()->withErrors(['item' => 'Maksimal 4 item ke-equip sekaligus. Lepas salah satu dulu.']);
            }
        }

        // Update PERSIS baris pivot ini doang (by primary key), gak nyentuh
        // baris lain sama sekali - walau item_id-nya kebetulan sama.
        \Illuminate\Support\Facades\DB::table('character_items')->where('id', $characterItemId)->update(['is_equipped' => ! $isEquipped]);

        return back();
    }
}
