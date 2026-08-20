<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rework battle dari model RONDE (semua orang gerak barengan tiap ronde)
     * jadi model WAKTU KONTINU (tiap actor - karakter/NPC/monster - punya
     * timer sendiri, gerak begitu cooldown-nya abis, gak nunggu "giliran ronde").
     * 'mode' nentuin battle ini auto (sepenuhnya server yang jalanin, kayak
     * sebelumnya) atau manual (player kontrol skill karakternya sendiri real-time,
     * sisanya - NPC & monster - tetap auto).
     */
    public function up(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->string('mode')->default('auto')->after('status');
            // Waktu simulasi (detik) udah nyampe mana - dipakai mode manual buat
            // "fast-forward" actor auto (NPC/monster) sampai waktu sekarang.
            $table->decimal('elapsed_seconds', 8, 2)->default(0)->after('mode');
        });

        Schema::table('battle_participants', function (Blueprint $table) {
            // Kapan participant ini BOLEH nyerang lagi (detik simulasi) - ganti
            // total dari skill_cooldowns yang berbasis "nomor ronde".
            $table->decimal('next_action_at', 8, 2)->default(0)->after('skill_cooldowns');
        });

        Schema::table('battles', function (Blueprint $table) {
            $table->decimal('monster_next_action_at', 8, 2)->default(0)->after('elapsed_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->dropColumn(['mode', 'elapsed_seconds', 'monster_next_action_at']);
        });
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('next_action_at');
        });
    }
};
