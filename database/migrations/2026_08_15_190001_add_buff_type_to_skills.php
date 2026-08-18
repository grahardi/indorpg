<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            // 'none' = serangan biasa (default), 'heal' = nambah HP/MP/SP teman,
            // 'nerf' = debuff monster (serangan berikutnya ke monster kena
            // dikali base_multiplier skill ini, one-shot lalu abis).
            $table->string('buff_type')->default('none')->after('can_stun');
            // Cuma relevan buat buff_type='heal': resource mana yang disembuhin.
            $table->string('heal_resource')->nullable()->after('buff_type');
        });

        Schema::table('battles', function (Blueprint $table) {
            // Debuff satu-kali dari skill nerf - dikonsumsi pas hit berikutnya
            // ke monster (siapapun yang mukul), abis itu balik null.
            $table->decimal('monster_debuff_multiplier', 4, 2)->nullable()->after('monster_stunned');
        });
    }

    public function down(): void
    {
        Schema::table('skills', function (Blueprint $table) {
            $table->dropColumn(['buff_type', 'heal_resource']);
        });
        Schema::table('battles', function (Blueprint $table) {
            $table->dropColumn('monster_debuff_multiplier');
        });
    }
};
