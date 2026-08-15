<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pose "idle" khusus buat arena battle - ukuran/kanvas-nya di-sync sama
     * GIF skill (364x360), beda dari full_body_path yang dipakai di halaman
     * lain (roster, profil karakter, dst - kanvas 512x1024).
     */
    public function up(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->string('battle_idle_path')->nullable()->after('full_body_path');
        });
    }

    public function down(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->dropColumn('battle_idle_path');
        });
    }
};
