<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->json('loadout_skill_ids')->nullable()->after('skill_cooldowns');
        });
    }

    public function down(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('loadout_skill_ids');
        });
    }
};
