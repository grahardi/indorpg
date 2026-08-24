<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * REWORK TOTAL sistem cooldown skill - sebelumnya SEMUA cooldown 1
     * participant numpuk di 1 kolom JSON (skill_cooldowns), di-baca-ubah-
     * simpan (read-modify-write) tiap kali ada skill dipakai. User laporan
     * cuma cooldown skill PERTAMA yang jalan, abis itu berantakan - dicoba
     * dicari bug spesifiknya berkali-kali gak ketemu di logic PHP-nya (udah
     * sound), jadi diputuskan REWORK total ke pendekatan yang lebih robust:
     * 1 BARIS TABEL = 1 cooldown skill tertentu buat 1 participant tertentu.
     * Gak ada lagi read-modify-write 1 kolom gabungan yang bisa numpuk
     * masalah - tiap skill punya baris sendiri, di-update via upsert
     * (updateOrInsert), sama sekali independen dari skill lain.
     */
    public function up(): void
    {
        Schema::create('battle_skill_cooldowns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('battle_participant_id')->constrained('battle_participants')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained();
            // Detik elapsed (sejak battle dibuat) pas skill ini TERAKHIR dipakai.
            $table->decimal('used_at_seconds', 10, 2);
            $table->timestamps();

            $table->unique(['battle_participant_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('battle_skill_cooldowns');
    }
};
