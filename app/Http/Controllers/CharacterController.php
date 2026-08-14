<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Subclass;
use App\Services\ImageResizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
     * Upload avatar. Auto crop+resize ke 256x256 (cover, crop tengah dari bahu ke atas).
     */
    public function uploadAvatar(Request $request, Character $character): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:8192', 'dimensions:min_width=100,min_height=100'],
        ]);

        if ($character->avatar_path) {
            Storage::disk('public')->delete($character->avatar_path);
        }

        $path = $this->resizeAndStore($request->file('avatar'), 'characters/avatars', 256, 256);
        $character->update(['avatar_path' => $path]);

        return back();
    }

    /**
     * Upload full body art. Auto crop+resize ke 512x1024 (cover, anchor bawah = telapak kaki).
     */
    public function uploadFullBody(Request $request, Character $character): RedirectResponse
    {
        $request->validate([
            'full_body' => ['required', 'image', 'max:10240', 'dimensions:min_width=100,min_height=100'],
        ]);

        if ($character->full_body_path) {
            Storage::disk('public')->delete($character->full_body_path);
        }

        $path = $this->resizeAndStore($request->file('full_body'), 'characters/fullbody', 512, 1024, 'bottom');
        $character->update(['full_body_path' => $path]);

        return back();
    }

    /**
     * Crop+resize uploaded image to exact target dimensions (cover fit) and store as PNG.
     */
    private function resizeAndStore($uploadedFile, string $directory, int $width, int $height, string $position = 'center'): string
    {
        $binary = ImageResizer::coverResizePng($uploadedFile->getRealPath(), $width, $height, $position);

        $filename = Str::uuid()->toString().'.png';
        $path = $directory.'/'.$filename;

        Storage::disk('public')->put($path, $binary);

        return $path;
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
