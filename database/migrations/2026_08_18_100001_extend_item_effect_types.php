<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extend item: dulu cuma bisa boost 8 stat combat dasar. Sekarang bisa
     * juga: HP pool, HP/MP/SP regen, dan damage elemental spesifik (misal
     * "+fire damage" - cuma nambah damage kalau skill yang dipakai elemen-nya
     * sama kayak effect_element_id item ini).
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('effect_element_id')->nullable()->after('effect_stat')
                ->constrained('elements')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('effect_element_id');
        });
    }
};
