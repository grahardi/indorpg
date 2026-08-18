<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Level NPC dulu di-acak ulang tiap kali (baik pas preview di Guild maupun
     * pas battle mulai) - gak konsisten, dan player gak bisa "pilih yang pas"
     * karena angkanya keburu ganti. Sekarang di-cache: sekali di-generate,
     * dipakai terus (di preview MAUPUN battle beneran) sampai kadaluarsa
     * (default 300 detik, lihat GameSetting npc_level_cache_seconds).
     */
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->unsignedSmallInteger('npc_cached_level')->nullable()->after('busy_until');
            $table->timestamp('npc_level_refreshed_at')->nullable()->after('npc_cached_level');
        });
    }

    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn(['npc_cached_level', 'npc_level_refreshed_at']);
        });
    }
};
