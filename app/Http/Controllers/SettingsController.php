<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Pengaturan PLAYER (bukan admin) - sejauh ini cuma preferensi mode
     * battle default (Auto/Manual), diakses lewat klik nama sendiri di nav.
     */
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'defaultBattleMode' => auth()->user()->default_battle_mode,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'default_battle_mode' => ['required', 'string', 'in:auto,manual'],
        ]);

        $request->user()->update($data);

        return back()->with('success', 'Pengaturan disimpan.');
    }
}
