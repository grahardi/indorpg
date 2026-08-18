<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monsters', function (Blueprint $table) {
            // Kelas manual (F terlemah - S terkuat), BUKAN dihitung dari level lagi.
            $table->string('class_rank', 1)->default('E')->after('level');

            // Ganti weak_against/strong_against (1 pola string) jadi 2 slot masing-masing,
            // tiap slot: combat_range + element_id (opsional) + ratio (multiplier).
            // Contoh: [{"combat_range":"close","element_id":3,"ratio":2}, {...}]
            $table->json('weak_matchups')->nullable()->after('weak_against');
            $table->json('strong_matchups')->nullable()->after('weak_matchups');
        });
    }

    public function down(): void
    {
        Schema::table('monsters', function (Blueprint $table) {
            $table->dropColumn(['class_rank', 'weak_matchups', 'strong_matchups']);
        });
    }
};
