<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spawn_point_monster', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spawn_point_id')->constrained('spawn_points')->cascadeOnDelete();
            $table->foreignId('monster_id')->constrained('monsters')->cascadeOnDelete();
            $table->unsignedSmallInteger('weight')->default(10); // makin besar, makin sering muncul
            $table->timestamps();

            $table->unique(['spawn_point_id', 'monster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spawn_point_monster');
    }
};
