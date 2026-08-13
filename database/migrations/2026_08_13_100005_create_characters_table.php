<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subclass_id')->constrained('subclasses')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('level')->default(1);
            $table->unsignedInteger('exp')->default(0);

            $table->unsignedSmallInteger('current_hp');
            $table->unsignedSmallInteger('current_stamina');
            $table->unsignedSmallInteger('current_mana');

            $table->string('avatar_path')->nullable(); // diisi manual/upload nanti

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
