<?php

use App\Models\Skill;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Samain semua skill ultimate (tier 3) jadi cooldown 15 detik - biar
     * konsisten & gampang diprediksi (dulu variatif per skill dari base data).
     */
    public function up(): void
    {
        Skill::where('tier', 3)->update(['cooldown_seconds' => 15]);
    }

    public function down(): void
    {
        // Gak ada nilai lama yang bisa dipulihin (udah ketimpa) - dibiarin
        // kosong, ini emang perubahan permanen yang disengaja.
    }
};
