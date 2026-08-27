<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessionController extends Controller
{
    /**
     * "Item Saya" - lihat semua item karakter (artifact + accession), dan
     * proses level-up accession item (korbanin item lain + Mithril).
     */
    public function index(Request $request): Response
    {
        $characters = Character::with(['items' => function ($q) {
            $q->orderBy('items.rarity');
        }, 'items.element'])
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Shop/MyItems', [
            'characters' => $characters,
        ]);
    }

    /**
     * Level-up 1 accession item pakai Mithril + sacrifice item lain (dari
     * karakter yang sama, gak boleh SR/Legendary, gak boleh accession item
     * lain, gak boleh item yang lagi di-equip - biar gak sengaja).
     */
    public function levelUp(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'character_id' => ['required', 'exists:characters,id'],
            'character_item_id' => ['required', 'integer'], // id baris character_items (pivot), bukan item_id
            'sacrifice_character_item_ids' => ['required', 'array', 'min:1', 'max:10'],
            'sacrifice_character_item_ids.*' => ['integer'],
            'mithril' => ['required', 'integer', 'min:0'],
        ]);

        $character = Character::with('items')->findOrFail($data['character_id']);
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $target = $character->items->firstWhere('pivot.id', $data['character_item_id']);
        if (! $target || $target->category !== 'accession') {
            return back()->withErrors(['accession' => 'Item target gak ketemu atau bukan Accession Item.']);
        }

        if ($target->pivot->accession_level >= Item::MAX_ACCESSION_LEVEL) {
            return back()->withErrors(['accession' => "Item ini udah level maksimal ({$target->pivot->accession_level})."]);
        }

        // Validasi sacrifice: item HARUS milik karakter yang sama, BUKAN SR/
        // Legendary, BUKAN accession item lain, BUKAN item yang lagi di-equip
        // (biar gak sengaja korbanin item yang lagi dipake), dan BUKAN target
        // item itu sendiri (gak bisa korbanin diri sendiri).
        $sacrifices = $character->items->filter(fn ($i) => in_array($i->pivot->id, $data['sacrifice_character_item_ids']));

        if ($sacrifices->count() !== count($data['sacrifice_character_item_ids'])) {
            return back()->withErrors(['accession' => 'Ada item sacrifice yang gak ketemu.']);
        }

        foreach ($sacrifices as $sac) {
            if ($sac->pivot->id === $target->pivot->id) {
                return back()->withErrors(['accession' => 'Gak bisa korbanin item yang lagi di-level.']);
            }
            if (in_array($sac->rarity, ['sr', 'legendary'])) {
                return back()->withErrors(['accession' => "{$sac->name} (SR/Legendary) gak bisa dikorbanin."]);
            }
            if ($sac->category === 'accession') {
                return back()->withErrors(['accession' => "{$sac->name} (Accession Item) gak bisa dikorbanin - cuma item Artifact biasa."]);
            }
            if ($sac->pivot->is_equipped) {
                return back()->withErrors(['accession' => "{$sac->name} lagi di-equip - lepas dulu sebelum dikorbanin."]);
            }
        }

        if ($character->mithril < $data['mithril']) {
            return back()->withErrors(['accession' => 'Mithril gak cukup.']);
        }

        // Rumus EXP level-up: tiap item sacrifice = 1 poin dasar (rarity makin
        // tinggi makin gede), + mithril nambah poin langsung 1:1. Total poin
        // dikonversi ke level naik (butuh (level_tujuan) poin buat naik 1 level
        // - biar makin tinggi level makin butuh banyak sacrifice, alami).
        $rarityPoints = ['common' => 1, 'rare' => 3, 'ur' => 8];
        $points = $sacrifices->sum(fn ($i) => $rarityPoints[$i->rarity] ?? 1) + $data['mithril'];

        $currentLevel = (int) $target->pivot->accession_level;
        $newLevel = $currentLevel;
        $remainingPoints = $points;
        while ($remainingPoints > 0 && $newLevel < Item::MAX_ACCESSION_LEVEL) {
            $costForNextLevel = $newLevel + 1; // makin tinggi level, makin mahal naik 1 level lagi
            if ($remainingPoints < $costForNextLevel) {
                break;
            }
            $remainingPoints -= $costForNextLevel;
            $newLevel++;
        }

        if ($newLevel === $currentLevel) {
            return back()->withErrors(['accession' => 'Poin dari sacrifice + Mithril belum cukup buat naik level. Tambah sacrifice/Mithril lagi.']);
        }

        // Eksekusi: hapus item yang dikorbankan (PERSIS baris pivot yang dipilih,
        // bukan by item_id - biar aman kalau karakter punya >1 copy item yang
        // sama, gak sengaja kehapus semua), kurangin mithril, naikin level target.
        foreach ($sacrifices as $sac) {
            \Illuminate\Support\Facades\DB::table('character_items')->where('id', $sac->pivot->id)->delete();
        }

        $character->decrement('mithril', $data['mithril']);
        \Illuminate\Support\Facades\DB::table('character_items')->where('id', $target->pivot->id)->update(['accession_level' => $newLevel]);

        $milestoneHit = intdiv($newLevel, Item::ACCESSION_MILESTONE_STEP) > intdiv($currentLevel, Item::ACCESSION_MILESTONE_STEP);
        $message = "{$target->name} naik ke level {$newLevel}!".($milestoneHit ? ' 🌟 Milestone! Power melonjak!' : '');

        return back()->with('success', $message);
    }
}
