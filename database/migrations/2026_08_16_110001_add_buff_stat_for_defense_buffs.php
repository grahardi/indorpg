<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extend sistem buff: sebelumnya cuma bisa nambah DAMAGE (offense). Sekarang
     * bisa juga nambah DEFENSE (misal Warden "Gelombang Pelindung" - naikin
     * magic defense tim). skills.buff_stat nentuin skill buff ini nge-boost
     * attack atau defense. battle_participants.buff_stat nyimpen jenis buff
     * yang lagi nempel di karakter itu (biar tau cara konsumsinya nanti).
     */
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->string('buff_stat')->nullable()->after('buff_type');
        });

        Schema::table('battle_participants', function (Blueprint $table) {
            $table->string('buff_stat')->nullable()->after('buff_multiplier');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('buff_stat');
        });
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('buff_stat');
        });
    }
};
