<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subclasses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('element_id')->nullable()->constrained('elements')->nullOnDelete();
            $table->string('name');            // Berserker, Blade Knight, Pyromancer, etc.
            $table->string('slug')->unique();
            $table->string('power_type')->nullable();
            $table->text('description')->nullable();
            $table->text('flavor_bonus')->nullable(); // e.g. healing bonus, cursed magic bonus

            $table->unsignedSmallInteger('base_physical_damage');
            $table->unsignedSmallInteger('base_physical_defense');
            $table->unsignedSmallInteger('base_magic_damage');
            $table->unsignedSmallInteger('base_magic_defense');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subclasses');
    }
};
