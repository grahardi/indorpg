<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->unsignedSmallInteger('mana_regen')->default(5)->after('base_magic_defense');
            $table->unsignedSmallInteger('stamina_regen')->default(5)->after('mana_regen');
            $table->unsignedSmallInteger('agility')->default(5)->after('stamina_regen'); // evasion
            $table->unsignedSmallInteger('accuracy')->default(90)->after('agility');
            $table->unsignedSmallInteger('critical_hit_bonus')->default(30)->after('accuracy'); // % dmg bonus pas crit
            $table->unsignedSmallInteger('critical_luck')->default(8)->after('critical_hit_bonus'); // % chance crit
        });
    }

    public function down(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->dropColumn(['mana_regen', 'stamina_regen', 'agility', 'accuracy', 'critical_hit_bonus', 'critical_luck']);
        });
    }
};
