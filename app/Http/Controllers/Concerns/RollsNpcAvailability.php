<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Support\Collection;

trait RollsNpcAvailability
{
    /**
     * NPC yang lagi gak "busy" (busy_until null/lewat) punya ~25% kemungkinan
     * ke-roll jadi "on mission" (gak bisa dipilih) buat beberapa menit ke depan.
     * NPC yang udah busy dibiarkan aja sampe expired sendiri (gak di-roll ulang).
     */
    protected function rollNpcAvailability(Collection $characters): void
    {
        foreach ($characters as $character) {
            if (! $character->is_npc || $character->is_busy) {
                continue;
            }

            if (random_int(1, 100) <= 25) {
                $character->update(['busy_until' => now()->addMinutes(random_int(3, 15))]);
            }
        }
    }
}
