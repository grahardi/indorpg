<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dulu tiap skill cuma bisa 100% physical ATAU 100% magic (scaling_stat).
     * Sekarang bisa CAMPURAN (misal 60% physical + 40% magic) via physical_ratio
     * (0-100). Null = fallback ke scaling_stat lama (100% physical kalau
     * scaling_stat='physical', 0% kalau 'magic') - backward compatible, skill
     * yang udah ada gak perlu diubah kalau gak mau.
     */
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->unsignedTinyInteger('physical_ratio')->nullable()->after('scaling_stat');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('physical_ratio');
        });
    }
};
