<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class DebugLogController extends Controller
{
    /**
     * Nampilin isi storage/logs/skill-debug.log sebagai teks polos (gampang
     * di-copy/screenshot langsung dari browser, gak perlu SSH/file manager).
     * Dipasang sementara buat lacak bug cooldown skill yang berulang -
     * dihapus lagi kalau masalahnya udah kelar.
     */
    public function show(): Response
    {
        $path = storage_path('logs/skill-debug.log');

        if (! file_exists($path)) {
            return response('(belum ada log - coba battle mode Manual dulu, lalu refresh halaman ini)', 200)
                ->header('Content-Type', 'text/plain');
        }

        // Tampilin 300 baris TERAKHIR aja (biar gak kepanjangan kalau udah
        // banyak battle yang dicoba) - paling relevan buat kejadian TERBARU.
        $lines = file($path);
        $recent = array_slice($lines, -300);

        return response(implode('', $recent), 200)->header('Content-Type', 'text/plain');
    }

    public function clear(): Response
    {
        @file_put_contents(storage_path('logs/skill-debug.log'), '');

        return response('Log dibersihkan.', 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Terima log DIAGNOSTIK dari BROWSER (frontend, bagian 104) - dipakai
     * buat lacak bug audio yang cuma kejadian di sisi client (battleAudio.js)
     * tanpa perlu bolak-balik screenshot DevTools Console. Ditulis ke file
     * TERPISAH (frontend-debug.log) biar gak campur sama log server-side.
     */
    public function receiveFrontendLog(Request $request): JsonResponse
    {
        $message = (string) $request->input('message', '');
        if ($message === '') {
            return response()->json(['ok' => false], 422);
        }

        $line = '['.now()->format('Y-m-d H:i:s').'] ['.$request->user()?->username.'] '.$message.PHP_EOL;
        @file_put_contents(storage_path('logs/frontend-debug.log'), $line, FILE_APPEND | LOCK_EX);

        return response()->json(['ok' => true]);
    }

    public function showFrontendLog(): Response
    {
        $path = storage_path('logs/frontend-debug.log');

        if (! file_exists($path)) {
            return response('(belum ada log - coba battle dulu, lalu refresh halaman ini)', 200)
                ->header('Content-Type', 'text/plain');
        }

        $lines = file($path);
        $recent = array_slice($lines, -300);

        return response(implode('', $recent), 200)->header('Content-Type', 'text/plain');
    }

    public function clearFrontendLog(): Response
    {
        @file_put_contents(storage_path('logs/frontend-debug.log'), '');

        return response('Log dibersihkan.', 200)->header('Content-Type', 'text/plain');
    }
}
