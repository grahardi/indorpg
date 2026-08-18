<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Gerbang level per spawn point: 1 = semua level boleh masuk, 10 = butuh
     * level tertinggi karakter + bonus admin (monster_max_level_bonus, default +3)
     * minimal 10 buat bisa explore titik ini.
     */
    public function up(): void
    {
        Schema::table('spawn_points', function (Blueprint $table) {
            $table->unsignedSmallInteger('min_monster_level')->default(1)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('spawn_points', function (Blueprint $table) {
            $table->dropColumn('min_monster_level');
        });
    }
};
