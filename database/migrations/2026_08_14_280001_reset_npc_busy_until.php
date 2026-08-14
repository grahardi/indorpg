<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fitur "NPC on mission" dimatiin sementara (bug: kemarin semua NPC ke-mark
     * busy bareng pas testing). Reset semua NPC yang kejebak biar bisa dipilih lagi.
     */
    public function up(): void
    {
        DB::table('characters')->where('is_npc', true)->update(['busy_until' => null]);
    }

    public function down(): void
    {
        // Gak perlu dibalik, ini cuma data fix satu arah.
    }
};
