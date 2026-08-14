<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('flavor_bonus');
            $table->string('full_body_path')->nullable()->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->dropColumn(['avatar_path', 'full_body_path']);
        });
    }
};
