<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bonus stat hasil upgrade pakai EXP - ditambahkan di atas base stat subclass
     * (yang sama buat semua karakter subclass itu). Ini yang bikin tiap karakter
     * bisa beda-beda progress-nya walau subclass sama.
     */
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->unsignedSmallInteger('bonus_physical_damage')->default(0)->after('exp');
            $table->unsignedSmallInteger('bonus_physical_defense')->default(0)->after('bonus_physical_damage');
            $table->unsignedSmallInteger('bonus_magic_damage')->default(0)->after('bonus_physical_defense');
            $table->unsignedSmallInteger('bonus_magic_defense')->default(0)->after('bonus_magic_damage');
            $table->unsignedSmallInteger('bonus_agility')->default(0)->after('bonus_magic_defense');
            $table->unsignedSmallInteger('bonus_evasion')->default(0)->after('bonus_agility');
            $table->unsignedSmallInteger('bonus_critical_hit')->default(0)->after('bonus_evasion');
            $table->unsignedSmallInteger('bonus_critical_luck')->default(0)->after('bonus_critical_hit');
        });
    }

    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn([
                'bonus_physical_damage', 'bonus_physical_defense',
                'bonus_magic_damage', 'bonus_magic_defense',
                'bonus_agility', 'bonus_evasion',
                'bonus_critical_hit', 'bonus_critical_luck',
            ]);
        });
    }
};
