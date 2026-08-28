<?php

use App\Models\Monster;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Balance: karakter di level awal (belum punya item, damage minim)
     * kewalahan lawan monster yang HP-nya kegedean relatif ke damage output
     * segitu. HP dasar SEMUA monster dikurangi 50% - berlaku proporsional
     * di SEMUA level (HP dasar ini yang jadi acuan monster_hp_growth_ratio
     * buat scaling per level, jadi efeknya nurunin kurva HP monster
     * keseluruhan, bukan cuma level awal doang).
     *
     * MonsterSeeder.php (sumber data) JUGA udah diperbaiki di sumbernya
     * (nilai HP di array udah dibagi 2) - migration ini cuma buat database
     * yang UDAH ADA sekarang, biar gak perlu nunggu re-seed (pelajaran dari
     * bagian 92: migration data doang tanpa fix seeder sumbernya bikin fix
     * ilang lagi pas reseed - di sini KEDUANYA udah diperbaiki bareng).
     */
    public function up(): void
    {
        Monster::query()->each(function (Monster $monster) {
            $monster->update(['hp' => (int) round($monster->hp / 2)]);
        });
    }

    public function down(): void
    {
        Monster::query()->each(function (Monster $monster) {
            $monster->update(['hp' => (int) round($monster->hp * 2)]);
        });
    }
};
