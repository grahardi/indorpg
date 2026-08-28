<?php

use App\Models\Skill;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Migration bagian 62 dulu udah nge-set semua ultimate (tier 3) jadi
     * cooldown 15s LANGSUNG di database - tapi SkillSeeder.php (sumber data
     * asli) masih hardcode 'cd' => 30, jadi begitu di-reseed ulang (misal
     * abis `game:purge-players` + migrate:fresh --seed, atau db:seed manual),
     * nilainya BALIK LAGI ke 30 (updateOrCreate nimpa pakai data seeder).
     * SkillSeeder.php sekarang udah diperbaiki di sumbernya (bagian 92),
     * migration ini cuma buat mastiin database yang UDAH ADA sekarang juga
     * langsung kena fix tanpa perlu nunggu re-seed.
     */
    public function up(): void
    {
        Skill::where('tier', 3)->update(['cooldown_seconds' => 15]);
    }

    public function down(): void
    {
        // Gak di-rollback ke 30 - itu emang bug lama yang mau dihilangin.
    }
};
