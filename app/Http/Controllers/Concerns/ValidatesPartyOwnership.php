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
}
