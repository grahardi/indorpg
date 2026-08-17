<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('username');
        });

        Schema::table('battles', function (Blueprint $table) {
            $table->unsignedSmallInteger('monster_level')->nullable()->after('monster_id');
            // Snapshot stat monster yang udah di-scale sesuai level encounter ini -
            // biar battle lama (sebelum fitur ini) & battle baru konsisten disimpan.
            $table->json('monster_stats')->nullable()->after('monster_level');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
        Schema::table('battles', function (Blueprint $table) {
            $table->dropColumn(['monster_level', 'monster_stats']);
        });
    }
};
