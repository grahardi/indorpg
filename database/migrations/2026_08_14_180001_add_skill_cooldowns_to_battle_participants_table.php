<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->json('skill_cooldowns')->nullable()->after('current_mana');
        });
    }

    public function down(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('skill_cooldowns');
        });
    }
};
