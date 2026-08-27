<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ganti rumus flat "+25% per tier" (bagian 81) jadi bonus per-Part yang
     * DIATUR ADMIN & ADITIF (nambah, bukan nimpa) - tiap Part (1-5, tier
     * 20/40/60/80/100) bisa kasih stat BEDA dari base item. Contoh: base
     * item +10 Physical Attack, Part 1 nambah +5 Physical Attack (total +15
     * begitu tier 20 tercapai), Part 2 malah nambah +5 HP (stat lain sama
     * sekali, bukan physical attack lagi).
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Array of {tier, stat, value, element_id?} - maks 5 entri (tier
            // 20/40/60/80/100). Null/kosong = item ini gak punya bonus
            // accession di tier itu (misal item accession-nya kepotong di
            // Part 3 doang).
            $table->json('accession_bonuses')->nullable()->after('effect_value');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('accession_bonuses');
        });
    }
};
