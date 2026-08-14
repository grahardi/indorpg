<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spawn_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('map_id')->constrained('maps')->cascadeOnDelete();
            $table->string('name'); // "Tepi Hutan", "Gua Kelelawar", dst
            $table->text('description')->nullable();

            // posisi marker di background map (persentase 0-100, biar responsive)
            $table->decimal('pos_x', 5, 2)->default(50);
            $table->decimal('pos_y', 5, 2)->default(50);

            $table->unsignedInteger('respawn_seconds')->default(300);
            $table->timestamp('last_defeated_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spawn_points');
    }
};
