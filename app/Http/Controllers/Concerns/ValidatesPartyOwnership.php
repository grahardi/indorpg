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

    /**
     * Pastikan gak ada karakter yang lagi tumbang (current_hp <= 0) ikut
     * kepilih di party - dulu ini bug: karakter yang tumbang tetap bisa
     * dipakai lagi seolah full HP. Karakter tumbang harus pulih dulu.
     */
    protected function ensureNoFaintedCharacterInParty(array $characterIds): void
    {
        $fainted = Character::whereIn('id', $characterIds)
            ->where('current_hp', '<=', 0)
            ->exists();

        if ($fainted) {
            throw ValidationException::withMessages([
                'character_ids' => 'Ada karakter tumbang (HP 0) di party, gak bisa dipilih sampai pulih.',
            ]);
        }
    }
}
