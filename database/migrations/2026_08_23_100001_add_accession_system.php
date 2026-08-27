<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sistem Accession Item - kategori item baru terpisah dari Artifact
     * (item biasa yang udah ada). Accession item bisa di-LEVEL UP (1-100)
     * dengan cara "korbanin" item lain (kecuali SR/Legendary) + Mithril
     * (currency baru). Tiap kelipatan 20 level (20/40/60/80/100) dapet bonus
     * power spike ekstra ("hidden skill" - power melonjak, bukan literal
     * skill baru dulu buat sekarang, infrastruktur skill terpisah nanti bisa
     * dikembangin lagi).
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // 'artifact' = item biasa yang udah ada (default, biar 70 item lama
            // otomatis kekategori ini). 'accession' = item baru, bisa di-level.
            $table->string('category')->default('artifact')->after('rarity');
        });

        Schema::table('character_items', function (Blueprint $table) {
            // Cuma relevan buat item category='accession' - level 1-100.
            // Item 'artifact' biasa gak pernah nyentuh kolom ini (tetep 0).
            $table->unsignedTinyInteger('accession_level')->default(0)->after('is_equipped');
        });

        Schema::table('characters', function (Blueprint $table) {
            // Currency baru - dipakai buat level up accession item (bareng
            // sacrifice item lain). Bisa dibeli di shop ATAU drop dari monster.
            $table->unsignedInteger('mithril')->default(0)->after('gold');
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('category');
        });
        Schema::table('character_items', function (Blueprint $table) {
            $table->dropColumn('accession_level');
        });
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('mithril');
        });
    }
};
