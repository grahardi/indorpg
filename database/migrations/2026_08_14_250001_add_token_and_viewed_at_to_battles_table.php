<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->string('token', 20)->nullable()->after('id');
            $table->timestamp('viewed_at')->nullable()->after('battle_log');
        });

        // Isi token buat battle yang udah ada (kalau ada) biar gak null.
        foreach (DB::table('battles')->whereNull('token')->get() as $battle) {
            DB::table('battles')->where('id', $battle->id)->update(['token' => Str::random(14)]);
        }

        // Raw SQL biar gak butuh dependency doctrine/dbal (sama kayak migration sebelumnya).
        DB::statement('ALTER TABLE battles ALTER COLUMN token SET NOT NULL');
        DB::statement('ALTER TABLE battles ADD CONSTRAINT battles_token_unique UNIQUE (token)');
    }

    public function down(): void
    {
        Schema::table('battles', function (Blueprint $table) {
            $table->dropColumn(['token', 'viewed_at']);
        });
    }
};
