<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->boolean('can_stun')->default(false)->after('base_multiplier');
        });

        Schema::table('battles', function (Blueprint $table) {
            $table->boolean('monster_stunned')->default(false)->after('monster_current_hp');
        });

        Schema::table('battle_participants', function (Blueprint $table) {
            $table->boolean('is_stunned')->default(false)->after('is_alive');
        });

        Schema::table('monsters', function (Blueprint $table) {
            // Array of {name, damage_ratio (0-100), effect (single/area), can_stun, usage_ratio}
            $table->json('skills_config')->nullable()->after('special_skill_description');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('can_stun');
        });
        Schema::table('battles', function (Blueprint $table) {
            $table->dropColumn('monster_stunned');
        });
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('is_stunned');
        });
        Schema::table('monsters', function (Blueprint $table) {
            $table->dropColumn('skills_config');
        });
    }
};
