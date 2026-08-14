<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encounters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spawn_point_id')->constrained('spawn_points')->cascadeOnDelete();
            $table->foreignId('monster_id')->constrained('monsters')->cascadeOnDelete();
            $table->enum('status', ['pending', 'won', 'lost', 'fled'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encounters');
    }
};
