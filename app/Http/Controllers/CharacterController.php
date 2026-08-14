<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Subclass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CharacterController extends Controller
{
    public function index(): Response
    {
        $characters = Character::with(['subclass.gameClass', 'subclass.element'])
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
        $gameClass = $subclass->gameClass;

        $character = Character::create([
            'subclass_id' => $subclass->id,
            'name' => $data['name'],
            'level' => 1,
            'exp' => 0,
            'current_hp' => $gameClass->base_hp,
            'current_stamina' => $gameClass->base_stamina,
            'current_mana' => $gameClass->base_mana,
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

    /**
     * Upload avatar. Spec: crop dari bahu ke atas, idealnya 256x256 (rasio 1:1).
     */
    public function uploadAvatar(Request $request, Character $character): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:4096', 'dimensions:ratio=1/1,min_width=128'],
        ]);

        if ($character->avatar_path) {
            Storage::disk('public')->delete($character->avatar_path);
        }

        $path = $request->file('avatar')->store('characters/avatars', 'public');
        $character->update(['avatar_path' => $path]);

        return back();
    }

    /**
     * Upload full body art. Spec: anchor telapak kaki di y=1000, idealnya 512x1024 (rasio 1:2).
     */
    public function uploadFullBody(Request $request, Character $character): RedirectResponse
    {
        $request->validate([
            'full_body' => ['required', 'image', 'max:6144', 'dimensions:ratio=1/2,min_width=128'],
        ]);

        if ($character->full_body_path) {
            Storage::disk('public')->delete($character->full_body_path);
        }

        $path = $request->file('full_body')->store('characters/fullbody', 'public');
        $character->update(['full_body_path' => $path]);

        return back();
    }

    public function destroy(Character $character): RedirectResponse
    {
        if ($character->avatar_path) {
            Storage::disk('public')->delete($character->avatar_path);
        }
        if ($character->full_body_path) {
            Storage::disk('public')->delete($character->full_body_path);
        }

        $character->delete();

        return redirect()->route('characters.index');
    }
}
