<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * "Pedang Accession Purba" - salah satu dari 8 contoh Accession Item awal
     * (bagian 77) - udah gak sesuai lagi sama arah desain sistem crafting yang
     * baru (bagian 79), dihapus. Foreign key cascade otomatis beresin
     * character_items (copy yang udah dipunya player) & accession_recipes
     * (resep item ini) begitu row Item-nya dihapus.
     */
    public function up(): void
    {
        Item::where('slug', 'pedang-accession-purba')->delete();
    }

    public function down(): void
    {
        // Gak di-restore - item ini emang sengaja dihapus permanen, bukan
        // di-rollback ke kondisi ada lagi.
    }
};
