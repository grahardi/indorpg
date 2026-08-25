<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
}
