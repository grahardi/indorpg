<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Skill point allocation" - invest poin ke skill SPESIFIK (bukan stat
     * karakter generik lagi). Tiap poin: +1% damage, -1% cooldown skill itu.
     */
    public function up(): void
    {
        Schema::table('character_skills', function (Blueprint $table) {
            $table->unsignedSmallInteger('bonus_level')->default(0)->after('skill_id');
        });
    }

    public function down(): void
    {
        Schema::table('character_skills', function (Blueprint $table) {
            $table->dropColumn('bonus_level');
        });
    }
};
