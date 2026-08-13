<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('element_matchups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attacker_element_id')->constrained('elements')->cascadeOnDelete();
            $table->foreignId('defender_element_id')->constrained('elements')->cascadeOnDelete();
            $table->decimal('multiplier', 4, 2)->default(1.00); // 1.25 = strong, 0.85 = weak
            $table->timestamps();

            $table->unique(['attacker_element_id', 'defender_element_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('element_matchups');
    }
};
