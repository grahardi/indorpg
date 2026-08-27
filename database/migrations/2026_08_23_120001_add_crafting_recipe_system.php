<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * REWORK TOTAL sistem Accession (bagian 77) - dari "sacrifice bebas +
     * poin" jadi model RESEP ala DotA: tiap accession item butuh material
     * SPESIFIK (Mithril, Gold Ore, Mystical Orb, dll) buat naik ke tiap
     * MILESTONE (20/40/60/80/100 - bukan lagi 1-100 granular, tapi 5 tier
     * diskrit "Part 1/2/3/4/5"). Item Legendary butuh material yang lebih
     * langka/susah dari item Common/Rare buat milestone yang sama.
     */
    public function up(): void
    {
        Schema::table('character_items', function (Blueprint $table) {
            // Item 'material' numpuk di 1 baris (quantity naik), bukan 1 baris
            // per unit kayak equipment (artifact/accession). Default 1 biar
            // equipment lama tetap konsisten (1 baris = 1 unit).
            $table->unsignedInteger('quantity')->default(1)->after('accession_level');
        });

        // Resep per accession item per milestone - JSON {material_item_id: qty}.
        Schema::create('accession_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->cascadeOnDelete();
            $table->unsignedTinyInteger('tier'); // 20, 40, 60, 80, atau 100
            $table->json('materials'); // {"3": 1, "7": 10, "9": 3} = item_id => qty
            $table->timestamps();

            $table->unique(['item_id', 'tier']);
        });

        // Kolom 'mithril' terpisah di characters SEKARANG DIGANTI - mithril
        // jadi item 'material' biasa (lebih fleksibel, bisa nambah material
        // jenis lain gampang tanpa migration baru tiap kali). Kolom lama
        // dibiarin ada dulu (data historis), gak dipake lagi kodenya.
    }

    public function down(): void
    {
        Schema::dropIfExists('accession_recipes');
        Schema::table('character_items', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }
};
