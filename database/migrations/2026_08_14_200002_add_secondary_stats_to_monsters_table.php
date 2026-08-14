<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monsters', function (Blueprint $table) {
            $table->unsignedSmallInteger('agility')->default(8)->after('magic_defense'); // evasion
            $table->unsignedSmallInteger('accuracy')->default(85)->after('agility');
        });
    }

    public function down(): void
    {
        Schema::table('monsters', function (Blueprint $table) {
            $table->dropColumn(['agility', 'accuracy']);
        });
    }
};
