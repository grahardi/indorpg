<?php

use App\Models\Skill;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Rework balance: SEMUA skill sekarang WAJIB punya biaya SP DAN MP
     * sekaligus (rasionya boleh timpang, tapi gak boleh salah satunya 0
     * total) - biar player gak bisa "abuse" cuma investasi ke SATU resource
     * (misal cuma naikin mana_regen doang, terus semua skill fisik yang
     * mana_cost=0 jadi bisa spam tanpa batas dari sisi mana).
     *
     * Skill yang sebelumnya PURE 1 resource (69 skill mana-only, 20 skill
     * stamina-only dari 113 total) ditambahin biaya SEKUNDER proporsional
     * ~15% dari biaya utamanya (minimal 3), TIMPANG SENGAJA (contoh: skill
     * fisik 30 SP dapet tambahan cuma 5 MP) - biar "identitas" fisik/magic
     * skill itu tetap kerasa, cuma gak lagi 100% gratis di resource lain.
     * Skill yang UDAH punya dua-duanya (24 skill) dibiarin apa adanya.
     */
    public function up(): void
    {
        $secondaryRatio = 0.15;
        $secondaryMin = 3;

        Skill::where('mana_cost', 0)->where('stamina_cost', '>', 0)->get()->each(function (Skill $skill) use ($secondaryRatio, $secondaryMin) {
            $skill->update(['mana_cost' => max($secondaryMin, (int) round($skill->stamina_cost * $secondaryRatio))]);
        });

        Skill::where('stamina_cost', 0)->where('mana_cost', '>', 0)->get()->each(function (Skill $skill) use ($secondaryRatio, $secondaryMin) {
            $skill->update(['stamina_cost' => max($secondaryMin, (int) round($skill->mana_cost * $secondaryRatio))]);
        });
    }

    public function down(): void
    {
        // Gak ada cara aman balikin ke "0" yang mana yang asalnya 0 tanpa
        // nyimpen snapshot dulu - perubahan ini dianggap permanen/sengaja.
    }
};
