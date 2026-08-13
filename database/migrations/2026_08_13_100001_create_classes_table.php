<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('name');            // Warrior, Tanker, Mage, Saint
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('base_hp');
            $table->unsignedSmallInteger('base_stamina');
            $table->unsignedSmallInteger('base_mana');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
