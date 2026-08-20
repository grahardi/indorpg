<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AudioController extends Controller
{
    /**
     * Slot audio yang bisa dikustomisasi - key GameSetting + label buat admin.
     * Kosong (belum di-upload) = fallback ke suara sintesis default (Web
     * Audio API, lihat resources/js/battleAudio.js), KECUALI item_drop yang
     * emang gak ada suara default sama sekali (fitur baru).
     */
    public const SLOTS = [
        'audio_battle_start' => 'Battle Mulai (monster muncul)',
        'audio_skill' => 'Pakai Skill (biasa)',
        'audio_ultimate' => 'Pakai Skill Ultimate',
        'audio_critical' => 'Critical Hit',
        'audio_miss' => 'Serangan Meleset',
        'audio_hit_taken' => 'Kena Serangan Monster',
        'audio_item_drop' => 'Dapat Item Drop',
        'audio_victory' => 'Menang Battle',
        'audio_defeat' => 'Kalah Battle',
    ];

    public function index(): Response
    {
        $slots = collect(self::SLOTS)->map(fn ($label, $key) => [
            'key' => $key,
            'label' => $label,
            'path' => GameSetting::get($key, '') ?: null,
        ])->values();

        return Inertia::render('Admin/Audio/Index', [
            'slots' => $slots,
        ]);
    }

    public function upload(Request $request, string $key): RedirectResponse
    {
        if (! array_key_exists($key, self::SLOTS)) {
            abort(404);
        }

        $request->validate([
            'audio' => ['required', 'file', 'mimes:mp3,wav,ogg,m4a', 'max:2048'],
        ]);

        $extension = $request->file('audio')->getClientOriginalExtension();
        $filename = "{$key}.{$extension}";
        $relativePath = "audio/{$filename}";

        @mkdir(public_path('audio'), 0755, true);
        // Bersihin file lama dulu (ekstensi bisa beda tiap upload).
        foreach (glob(public_path("audio/{$key}.*")) ?: [] as $old) {
            @unlink($old);
        }
        $request->file('audio')->move(public_path('audio'), $filename);

        GameSetting::set($key, '/'.$relativePath);

        return back()->with('success', 'Audio berhasil diupload.');
    }

    public function reset(string $key): RedirectResponse
    {
        if (! array_key_exists($key, self::SLOTS)) {
            abort(404);
        }

        foreach (glob(public_path("audio/{$key}.*")) ?: [] as $old) {
            @unlink($old);
        }

        GameSetting::set($key, '');

        return back()->with('success', 'Audio direset ke default.');
    }
}
