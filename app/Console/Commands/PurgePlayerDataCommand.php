<?php

namespace App\Console\Commands;

use App\Models\Character;
use App\Models\Encounter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgePlayerDataCommand extends Command
{
    protected $signature = 'game:purge-players {--force : Skip konfirmasi}';

    protected $description = 'HAPUS PERMANEN semua karakter PEMAIN (bukan NPC) beserta item, skill point, dan seluruh history battle. NPC & data game (monster/map/item catalog) TIDAK disentuh.';

    public function handle(): int
    {
        $characterCount = Character::where('is_npc', false)->count();
        $battleCount = DB::table('battles')->count();

        if ($characterCount === 0 && $battleCount === 0) {
            $this->info('Gak ada data pemain buat dihapus.');

            return self::SUCCESS;
        }

        $this->warn("Ini bakal HAPUS PERMANEN:");
        $this->line("  - {$characterCount} karakter pemain (beserta item yang udah didapat & skill point allocation)");
        $this->line("  - {$battleCount} history battle");
        $this->line('NPC & data game (monster/map/item catalog/subclass/skill) TIDAK ikut kehapus.');

        if (! $this->option('force') && ! $this->confirm('Yakin? Ini GAK BISA di-undo.')) {
            $this->info('Dibatalkan.');

            return self::SUCCESS;
        }

        // Urutan penting: battles duluan (cascade ke battle_participants ->
        // battle_skill_cooldowns via FK), baru karakter (cascade ke
        // character_items & character_skills via FK).
        DB::table('battles')->delete();
        Encounter::query()->update(['status' => 'pending']);
        Character::where('is_npc', false)->delete();

        $this->info("Selesai. {$characterCount} karakter pemain + {$battleCount} battle history dihapus. Encounter direset ke 'pending'.");

        return self::SUCCESS;
    }
}
