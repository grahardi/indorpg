<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->timestamp('busy_until')->nullable()->after('is_npc');
            // total_exp = akumulasi EXP seumur hidup (gak pernah berkurang, dipakai
            // buat hitung level). Beda dari 'exp' yang bisa DIPOTONG buat upgrade stat.
            $table->unsignedInteger('total_exp')->default(0)->after('exp');
        });
    }

    public function down(): void
    {
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn(['busy_until', 'total_exp']);
        });
    }
};
