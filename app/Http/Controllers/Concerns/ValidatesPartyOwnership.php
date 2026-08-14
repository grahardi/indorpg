<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Character;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

trait ValidatesPartyOwnership
{
    /**
     * Pastikan minimal 1 karakter di party adalah milik user yang login
     * (bukan cuma NPC / karakter orang lain). NPC (user_id null) boleh
     * ikut party asal ada minimal 1 karakter yang beneran punya user ini.
     */
    protected function ensureOwnedCharacterInParty(Request $request, array $characterIds): void
    {
        $ownsOne = Character::whereIn('id', $characterIds)
            ->where('user_id', $request->user()->id)
            ->exists();

        if (! $ownsOne) {
            throw ValidationException::withMessages([
                'character_ids' => 'Party harus punya minimal 1 karakter milik kamu sendiri (bukan cuma NPC).',
            ]);
        }
    }

    /**
     * Pastikan gak ada NPC yang lagi "on mission" (busy_until masih di masa depan)
     * ikut kepilih di party - jaga-jaga request curang di luar UI normal.
     */
    protected function ensureNoBusyNpcInParty(array $characterIds): void
    {
        $busy = Character::whereIn('id', $characterIds)
            ->where('is_npc', true)
            ->whereNotNull('busy_until')
            ->where('busy_until', '>', now())
            ->exists();

        if ($busy) {
            throw ValidationException::withMessages([
                'character_ids' => 'Ada NPC di party yang lagi on mission, gak bisa dipilih sekarang.',
            ]);
        }
    }
}
