<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Agility" karakter fungsinya emang buat akurasi nyerang (offense), bukan
        // evasion (itu udah ada stat sendiri: Evasion) - rename biar jelas.
        DB::statement('ALTER TABLE characters RENAME COLUMN bonus_agility TO bonus_accuracy');

        Schema::table('characters', function (Blueprint $table) {
            $table->unsignedInteger('stat_points')->default(0)->after('total_exp');
        });
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE characters RENAME COLUMN bonus_accuracy TO bonus_agility');

        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('stat_points');
        });
    }
};
