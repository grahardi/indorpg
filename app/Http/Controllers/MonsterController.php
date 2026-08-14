<?php

namespace App\Http\Controllers;

use App\Models\Monster;
use App\Services\ImageResizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MonsterController extends Controller
{
    public function index(): Response
    {
        $monsters = Monster::with('element')
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Monsters/Index', [
            'monsters' => $monsters,
        ]);
    }

    public function show(Monster $monster): Response
    {
        $monster->load('element');

        return Inertia::render('Monsters/Show', [
            'monster' => $monster,
        ]);
    }

    /**
     * Upload avatar referensi monster. Sama seperti art subclass, disimpan
     * sebagai aset statis di public/, bukan storage disk.
     */
    public function uploadAvatar(Request $request, Monster $monster): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:8192', 'dimensions:min_width=100,min_height=100'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('avatar')->getRealPath(), 256, 256, 'top');

        $filename = $monster->slug.'-avatar.png';
        $relativePath = 'images/monsters/'.$filename;

        file_put_contents(public_path($relativePath), $binary);

        $monster->update(['avatar_path' => '/'.$relativePath]);

        return back();
    }

    public function uploadFullBody(Request $request, Monster $monster): RedirectResponse
    {
        $request->validate([
            'full_body' => ['required', 'image', 'max:10240', 'dimensions:min_width=100,min_height=100'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('full_body')->getRealPath(), 512, 1024, 'bottom');

        $filename = $monster->slug.'-fullbody.png';
        $relativePath = 'images/monsters/'.$filename;

        file_put_contents(public_path($relativePath), $binary);

        $monster->update(['full_body_path' => '/'.$relativePath]);

        return back();
    }
}
