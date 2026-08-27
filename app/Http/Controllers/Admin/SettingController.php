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
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required', 'string'],
        ]);

        // DIAGNOSTIK SEMENTARA: user laporan setting gak nyimpen (ubah 1.5 ->
        // 2, abis disimpen balik ke 1.5). Log ke file biar ketauan persis data
        // apa yang beneran ke-terima & ke-simpen - dihapus lagi kalau udah
        // ketauan/kelar masalahnya.
        $before = \App\Models\GameSetting::whereIn('key', collect($data['settings'])->pluck('key'))->pluck('value', 'key');
        \Illuminate\Support\Facades\Log::channel('single')->info('[Settings] Update diterima', [
            'received' => $data['settings'],
            'before' => $before,
        ]);

        foreach ($data['settings'] as $s) {
            GameSetting::set($s['key'], $s['value']);
        }

        $after = \App\Models\GameSetting::whereIn('key', collect($data['settings'])->pluck('key'))->pluck('value', 'key');
        \Illuminate\Support\Facades\Log::channel('single')->info('[Settings] Setelah disimpan', ['after' => $after]);

        return back()->with('success', 'Setting disimpan.');
    }
}
