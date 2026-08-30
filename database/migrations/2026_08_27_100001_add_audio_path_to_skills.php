<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Custom audio PER-SKILL (beda dari setting global audio_skill/
     * audio_ultimate di /admin/settings yang berlaku sama buat SEMUA skill).
     * Kosong = fallback ke setting global, yang juga kosong = fallback ke
     * suara sintesis. Monster skill (skills_config JSON di tabel monsters)
     * dapet field 'audio_path' yang sama secara terpisah, gak butuh migration
     * kolom baru karena udah JSON.
     */
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('icon_path');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn('audio_path');
        });
    }
};
