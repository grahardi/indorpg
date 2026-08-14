<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monsters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('level');
            $table->string('type'); // Slime, Beast, Undead, Humanoid, Insect, Spirit, Elemental, Construct, dst
            $table->foreignId('element_id')->nullable()->constrained('elements')->nullOnDelete();

            // Pola combat: close/range/area (cara skill menyerang) x physical/magic (jenis damage).
            // Nilai: close_physical, range_physical, area_physical, close_magic, range_magic, area_magic
            $table->string('strong_against');
            $table->string('weak_against');

            $table->unsignedInteger('hp');
            $table->unsignedSmallInteger('physical_damage');
            $table->unsignedSmallInteger('physical_defense');
            $table->unsignedSmallInteger('magic_damage');
            $table->unsignedSmallInteger('magic_defense');

            $table->unsignedInteger('exp_reward');
            $table->unsignedSmallInteger('min_party_level')->default(1);

            $table->string('special_skill_name')->nullable();
            $table->text('special_skill_description')->nullable();

            $table->text('description')->nullable();
            $table->string('avatar_path')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monsters');
    }
};
