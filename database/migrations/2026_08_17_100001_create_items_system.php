<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            // common, rare, sr, ur, legendary - makin tinggi makin mahal & makin jarang drop.
            $table->string('rarity')->default('common');
            $table->unsignedInteger('price');
            // Stat yang ditambah: physical_damage, physical_defense, magic_damage,
            // magic_defense, accuracy, evasion, critical_hit, critical_luck.
            $table->string('effect_stat');
            $table->integer('effect_value');
            // Peluang drop per monster kalah (persen, dicek independen per item).
            $table->decimal('drop_rate', 5, 2)->default(0);
            $table->string('icon_path')->nullable();
            $table->timestamps();
        });

        Schema::create('character_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('character_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->cascadeOnDelete();
            // Max 4 equipped sekaligus per karakter (divalidasi di controller).
            $table->boolean('is_equipped')->default(false);
            $table->timestamp('obtained_at')->useCurrent();
            $table->timestamps();
        });

        Schema::table('characters', function (Blueprint $table) {
            $table->unsignedInteger('gold')->default(0)->after('total_exp');
        });

        Schema::table('monsters', function (Blueprint $table) {
            $table->unsignedInteger('gold_reward')->default(5)->after('exp_reward');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('character_items');
        Schema::dropIfExists('items');
        Schema::table('characters', function (Blueprint $table) {
            $table->dropColumn('gold');
        });
        Schema::table('monsters', function (Blueprint $table) {
            $table->dropColumn('gold_reward');
        });
    }
};
