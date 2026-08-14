<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Subclass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CharacterController extends Controller
{
    public function index(): Response
    {
        $characters = Character::with(['subclass.gameClass', 'subclass.element', 'user'])
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
        $character->load(['subclass.gameClass', 'subclass.element', 'skills']);

        return Inertia::render('Characters/Show', [
            'character' => $character,
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
    public function upgradeStat(Request $request, Character $character): RedirectResponse
    {
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $data = $request->validate([
            'stat' => ['required', 'string', 'in:'.implode(',', Character::UPGRADABLE_STATS)],
        ]);

        $cost = $character->upgradeCost($data['stat']);

        if ($character->exp < $cost) {
            return back()->withErrors(['stat' => 'EXP gak cukup buat upgrade ini.']);
        }

        $character->decrement('exp', $cost);
        $character->increment("bonus_{$data['stat']}");

        return back();
    }
}
