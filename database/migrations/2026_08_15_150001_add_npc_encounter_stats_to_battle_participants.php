<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NPC sekarang "diset kayak monster" - level dasarnya di database SAMA
     * kayak player (kolom characters.level, disamain ke 1 semua), tapi level
     * BENERAN pas battle di-roll dinamis (level tertinggi karakter kamu di
     * party ±2 random), stat-nya di-scale pakai rasio yang bisa diatur admin.
     * NPC gak numpuk EXP/level permanen kayak player.
     */
    public function up(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->unsignedSmallInteger('npc_encounter_level')->nullable()->after('loadout_skill_ids');
            $table->json('npc_stat_snapshot')->nullable()->after('npc_encounter_level');
        });
    }

    public function down(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn(['npc_encounter_level', 'npc_stat_snapshot']);
        });
    }
};
