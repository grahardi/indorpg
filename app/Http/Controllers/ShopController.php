<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $rarityOrder = "CASE rarity ".
            implode(' ', array_map(fn ($r, $i) => "WHEN '{$r}' THEN {$i}", Item::RARITIES, array_keys(Item::RARITIES))).
            ' END';

        $items = Item::with('element')->orderByRaw($rarityOrder)->orderBy('price')->get();

        // BUG FIX: sebelumnya select(['id','name','gold']) gak include subclass_id,
        // jadi relasi subclass() lazy-load gagal (null) - tapi Character model
        // punya banyak accessor $appends (effective_physical_damage dst) yang
        // OTOMATIS keitung pas di-serialize ke JSON, dan accessor2 itu baca
        // $this->subclass->base_physical_damage -> crash "read property on null".
        // Fix: eager-load subclass beneran, jangan restrict select().
        $characters = Character::with('subclass')
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Shop/Index', [
            'items' => $items,
            'characters' => $characters,
        ]);
    }

    /**
     * Beli item pakai gold karakter - item masuk ke inventory (belum ke-equip
     * otomatis, atur equip-nya sendiri di halaman karakter).
     */
    public function buy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'character_id' => ['required', 'exists:characters,id'],
        ]);

        $character = Character::findOrFail($data['character_id']);
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $item = Item::findOrFail($data['item_id']);

        if ($character->items()->count() >= 50) {
            return back()->withErrors(['gold' => 'Bag udah penuh (maksimal 50 item). Jual/buang item dulu.']);
        }

        if ($character->gold < $item->price) {
            return back()->withErrors(['gold' => 'Gold gak cukup buat beli item ini.']);
        }

        $character->decrement('gold', $item->price);
        $character->items()->attach($item->id, ['obtained_at' => now()]);

        return back()->with('success', "{$item->name} dibeli buat {$character->name}.");
    }
}
