<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * KOREKSI KONSEP TOTAL: 'accession' BUKAN kategori equipment terpisah -
     * itu CATALYST sekali pakai (consumable). SEMUA equipment (yang dulu
     * dipisah 'artifact' vs 'accession') sekarang JADI SATU kategori
     * 'artifact', dan SEMUA bisa di-level lewat sacrifice item lain (bagian
     * 77 punya konsep asli, dipakai lagi). Tapi level MENTOK di tiap
     * kelipatan 20 (20/40/60/80) - buat nembus ke blok berikutnya (21-40,
     * 41-60, dst) WAJIB konsumsi 1 Accession Item (catalyst) yang rarity-nya
     * cocok sama item yang di-level.
     */
    public function up(): void
    {
        // 7 item "Accession" lama (equipment) balik jadi kategori 'artifact'
        // biasa - mereka equipment beneran, cuma salah kategori sebelumnya.
        Item::where('category', 'accession')->update(['category' => 'artifact']);

        // Hapus resep lama (AccessionRecipe) yang berbasis model SALAH (resep
        // per tier buat NAIKIN item itu sendiri) - gak relevan lagi sama
        // model catalyst yang baru.
        \Illuminate\Support\Facades\DB::table('accession_recipes')->truncate();

        Schema::table('character_items', function (Blueprint $table) {
            // Sejauh mana item INI (baris spesifik ini) boleh di-level TANPA
            // catalyst lagi - default 20 (semua item awalnya bisa bebas
            // di-sacrifice-level sampai 20 doang). Abis consume catalyst yang
            // cocok, nilainya naik +20 (jadi 40, lalu 60, dst).
            $table->unsignedTinyInteger('unlocked_tier')->default(20)->after('accession_level');
        });
    }

    public function down(): void
    {
        Schema::table('character_items', function (Blueprint $table) {
            $table->dropColumn('unlocked_tier');
        });
    }
};
