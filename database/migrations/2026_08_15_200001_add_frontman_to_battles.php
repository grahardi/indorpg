<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->foreignId('frontman_character_id')->nullable()->after('monster_id')
                ->constrained('characters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('frontman_character_id');
        });
    }
};
