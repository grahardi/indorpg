<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buff (buff_type='buff') beda dari nerf: nerf debuff MONSTER (di battles),
     * buff nambah daya serang ALLY (per-participant) buat serangan berikutnya -
     * one-shot, dikonsumsi pas orang itu nyerang, abis itu reset null.
     */
    public function up(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->decimal('buff_multiplier', 5, 2)->nullable()->after('is_stunned');
        });
    }

    public function down(): void
    {
        Schema::table('battle_participants', function (Blueprint $table) {
            $table->dropColumn('buff_multiplier');
        });
    }
};
