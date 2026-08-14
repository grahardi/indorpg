<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('battles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('encounter_id')->constrained('encounters')->cascadeOnDelete();
            $table->foreignId('monster_id')->constrained('monsters')->cascadeOnDelete();
            $table->unsignedInteger('monster_current_hp');
            $table->enum('status', ['ongoing', 'won', 'lost', 'fled'])->default('ongoing');
            $table->unsignedInteger('round_number')->default(1);
            $table->json('battle_log')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('battles');
    }
};
