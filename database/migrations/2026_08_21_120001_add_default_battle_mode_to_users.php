<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Preferensi PLAYER (bukan admin setting) - mode battle default (Auto/
     * Manual) yang otomatis kepilih di halaman Frontman, diatur di menu
     * Pengaturan (klik nama sendiri di nav).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('default_battle_mode')->default('auto')->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('default_battle_mode');
        });
    }
};
