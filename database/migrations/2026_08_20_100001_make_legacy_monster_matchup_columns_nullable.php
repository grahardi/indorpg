<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * BUG FIX: weak_against/strong_against adalah kolom LAMA (1 pola string),
     * udah digantikan total sama weak_matchups/strong_matchups (json, 2 slot)
     * dari migration rework_monster_rank_and_matchups. Tapi kolom lama ini
     * masih NOT NULL tanpa default, sedangkan Admin\MonsterController udah
     * lama berhenti ngisi kolom ini - jadi INSERT monster baru lewat admin
     * panel selalu gagal (null value in column violates not-null constraint).
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE monsters ALTER COLUMN strong_against DROP NOT NULL');
        DB::statement('ALTER TABLE monsters ALTER COLUMN weak_against DROP NOT NULL');
    }

    public function down(): void
    {
        // Gak di-restore ke NOT NULL - data lama mungkin udah banyak yang null,
        // restore paksa bisa gagal/ngerusak rollback. Legacy column ini emang
        // udah gak dipakai lagi di kode manapun.
    }
};
