<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * mana_regen, stamina_regen, agility jadi COMPUTED (accessor di model), gak
     * disimpan lagi sebagai kolom - dihitung dari base_physical/magic_damage/defense
     * yang udah ada. accuracy dihapus total, diganti Agility (sisi ofensif) & Evasion
     * (sisi defensif, kolomnya gak pernah ada, cuma accessor).
     * critical_hit_bonus & critical_luck tetap kolom asli, tapi disamain semua
     * subclass ke 20% / 10% (baseline default dari user, "nanti dirumuskan lagi").
     */
    public function up(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->dropColumn(['mana_regen', 'stamina_regen', 'agility', 'accuracy']);
        });

        // Raw SQL (bukan Schema::change()) biar gak butuh dependency doctrine/dbal.
        DB::statement('ALTER TABLE subclasses ALTER COLUMN critical_hit_bonus SET DEFAULT 20');
        DB::statement('ALTER TABLE subclasses ALTER COLUMN critical_luck SET DEFAULT 10');

        // Migration jalan SEBELUM seeder di `migrate --seed`, jadi di instalasi fresh
        // tabel subclasses masih kosong saat ini - UPDATE ini cuma efektif kalau
        // dijalankan di server yang datanya udah ada (migrate biasa, bukan fresh).
        DB::table('subclasses')->update([
            'critical_hit_bonus' => 20,
            'critical_luck' => 10,
        ]);
    }

    public function down(): void
    {
        Schema::table('subclasses', function (Blueprint $table) {
            $table->unsignedSmallInteger('mana_regen')->default(5)->after('base_magic_defense');
            $table->unsignedSmallInteger('stamina_regen')->default(5)->after('mana_regen');
            $table->unsignedSmallInteger('agility')->default(5)->after('stamina_regen');
            $table->unsignedSmallInteger('accuracy')->default(90)->after('agility');
        });
    }
};
