<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdminCommand extends Command
{
    protected $signature = 'user:make-admin {username}';

    protected $description = 'Jadikan user tertentu admin (akses ke /admin)';

    public function handle(): int
    {
        $user = User::whereRaw('LOWER(username) = ?', [strtolower($this->argument('username'))])->first();

        if (! $user) {
            $this->error("User '{$this->argument('username')}' gak ketemu.");

            return self::FAILURE;
        }

        $user->is_admin = true;
        $user->save();
        $this->info("{$user->username} sekarang admin. Bisa akses /admin.");

        return self::SUCCESS;
    }
}
