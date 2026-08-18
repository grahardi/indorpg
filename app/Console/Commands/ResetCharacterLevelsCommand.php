<?php

namespace App\Console\Commands;

use App\Models\Character;
use Illuminate\Console\Command;

class ResetCharacterLevelsCommand extends Command
{
    protected $signature = 'characters:reset-level {--npc-only : Cuma reset NPC, biarin karakter pemain} {--force : Skip konfirmasi}';

    protected $description = 'Reset SEMUA karakter (pemain + NPC) balik ke level 1, EXP/stat_points/bonus stat 0, HP/SP/MP full';

    public function handle(): int
    {
        $query = Character::query();
        if ($this->option('npc-only')) {
            $query->where('is_npc', true);
        }

        $count = $query->count();

        if ($count === 0) {
            $this->info('Gak ada karakter yang cocok.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("Reset {$count} karakter ke level 1 (EXP, stat point, bonus stat semua ke-hapus)? Ini gak bisa di-undo.")) {
            $this->info('Dibatalkan.');

            return self::SUCCESS;
        }

        $characters = $query->with('subclass')->get();
        $bar = $this->output->createProgressBar($characters->count());

        foreach ($characters as $character) {
            $character->level = 1;
            $character->exp = 0;
            $character->total_exp = 0;
            $character->stat_points = 0;
            $character->bonus_physical_damage = 0;
            $character->bonus_physical_defense = 0;
            $character->bonus_magic_damage = 0;
            $character->bonus_magic_defense = 0;
            $character->bonus_accuracy = 0;
            $character->bonus_evasion = 0;
            $character->bonus_critical_hit = 0;
            $character->bonus_critical_luck = 0;

            // HP/SP/MP full lagi sesuai pool level 1 (base stat subclass, tanpa bonus).
            $character->current_hp = $character->effective_base_hp;
            $character->current_stamina = $character->effective_base_sp;
            $character->current_mana = $character->effective_base_mp;

            $character->save();
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("{$characters->count()} karakter direset ke level 1.");

        return self::SUCCESS;
    }
}
