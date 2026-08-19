<?php

namespace App\Http\Controllers;

use App\Models\GameClass;
use App\Models\Subclass;
use App\Services\ImageResizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameDataController extends Controller
{
    /**
     * Home page: kalau udah login, tampilin Town Hub (peta interaktif klik
     * bangunan). Guest tetap liat Codex (list class/subclass) kayak biasa.
     */
    public function index(): Response
    {
        if (auth()->check()) {
            return Inertia::render('Home/TownHub');
        }

        $classes = GameClass::with(['subclasses.element', 'subclasses.skills'])
            ->orderBy('id')
            ->get();

        return Inertia::render('Classes/Index', [
            'classes' => $classes,
        ]);
    }

    /**
     * Codex (list class/subclass) - dulu cuma bisa diakses lewat '/', sekarang
     * '/' buat user login nampilin Town Hub, jadi Codex butuh route sendiri
     * biar tetap bisa diakses siapapun.
     */
    public function codex(): Response
    {
        $classes = GameClass::with(['subclasses.element', 'subclasses.skills'])
            ->orderBy('id')
            ->get();

        return Inertia::render('Classes/Index', [
            'classes' => $classes,
        ]);
    }

    public function showSubclass(int $subclassId): Response
    {
        $subclass = Subclass::with(['gameClass', 'element', 'skills'])
            ->findOrFail($subclassId);

        return Inertia::render('Classes/Show', [
            'subclass' => $subclass,
        ]);
    }

    /**
     * Upload avatar referensi untuk subclass (bukan karakter player).
     * Disimpan sebagai aset statis di public/images/subclasses/, bukan storage
     * disk, karena ini art resmi/official yang ikut ter-commit ke repo.
     */
    public function uploadAvatar(Request $request, Subclass $subclass): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:8192', 'dimensions:min_width=100,min_height=100'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('avatar')->getRealPath(), 256, 256, 'top');

        $filename = $subclass->slug.'-avatar.png';
        $relativePath = 'images/subclasses/'.$filename;

        file_put_contents(public_path($relativePath), $binary);

        $subclass->update(['avatar_path' => '/'.$relativePath]);

        return back();
    }

    /**
     * Upload full body art referensi untuk subclass. Anchor bawah biar
     * telapak kaki gak kepotong (sama seperti spec karakter).
     */
    public function uploadFullBody(Request $request, Subclass $subclass): RedirectResponse
    {
        $request->validate([
            'full_body' => ['required', 'image', 'max:10240', 'dimensions:min_width=100,min_height=100'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('full_body')->getRealPath(), 512, 1024, 'bottom');

        $filename = $subclass->slug.'-fullbody.png';
        $relativePath = 'images/subclasses/'.$filename;

        file_put_contents(public_path($relativePath), $binary);

        $subclass->update(['full_body_path' => '/'.$relativePath]);

        return back();
    }
}
