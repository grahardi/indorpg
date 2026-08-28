<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Settings', [
            'settings' => GameSetting::orderBy('key')->get(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        // BUG FIX FATAL DITEMUKAN: sebelumnya 'settings.*.value' => 'required'
        // - tapi 9 setting audio (audio_battle_start, audio_critical, dst -
        // bagian 57) SENGAJA kosong secara default (artinya "pakai suara
        // sintesis", diisi lewat /admin/audio, bukan di sini). Alfabetis
        // "audio_*" selalu ada di 9 baris PERTAMA (index 0-8) - makanya error
        // "settings.0.value required" dst SELALU muncul kalau ada audio yang
        // belum di-upload, GAGALIN SELURUH form save (bukan cuma bagian audio).
        // Fix: 'nullable' - biar string kosong (memang disengaja) boleh lolos.
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $s) {
            GameSetting::set($s['key'], $s['value'] ?? '');
        }

        return back()->with('success', 'Setting disimpan.');
    }
}
