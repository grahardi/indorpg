<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMap;
use App\Services\ImageResizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Maps/Index', [
            'maps' => GameMap::withCount('spawnPoints')->orderBy('min_level')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Maps/Form', ['map' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        GameMap::create($data);

        return redirect()->route('admin.maps.index')->with('success', 'Map dibuat.');
    }

    public function edit(GameMap $map): Response
    {
        return Inertia::render('Admin/Maps/Form', ['map' => $map]);
    }

    public function update(Request $request, GameMap $map): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        $map->update($data);

        return redirect()->route('admin.maps.index')->with('success', 'Map diupdate.');
    }

    public function destroy(GameMap $map): RedirectResponse
    {
        $map->delete();

        return redirect()->route('admin.maps.index')->with('success', 'Map dihapus.');
    }

    /**
     * Upload foto background map (dipakai di halaman Peta publik + arena battle).
     * Pola sama kayak upload avatar/full body subclass/monster - resize ke
     * public_path() langsung, bukan Storage disk.
     */
    public function uploadBackground(Request $request, GameMap $map): RedirectResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240', 'dimensions:min_width=200,min_height=100'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('image')->getRealPath(), 1200, 675, 'center');

        $filename = $map->slug.'-bg.png';
        $relativePath = 'images/maps/'.$filename;
        @mkdir(public_path('images/maps'), 0755, true);

        file_put_contents(public_path($relativePath), $binary);

        $map->update(['background_path' => '/'.$relativePath]);

        return back()->with('success', 'Background map diupdate.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'min_level' => ['required', 'integer', 'min:1'],
            'max_level' => ['required', 'integer', 'min:1'],
        ]);
    }
}
