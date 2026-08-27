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
    /**
     * Menu utama Shop - 3 pilihan: Item Saya (kelola/level-up accession),
     * Beli Artifact Item (toko lama), Beli Accession Item (toko baru).
     */
    public function index(): Response
    {
        return Inertia::render('Shop/Menu');
    }

    /**
     * Toko - dipakai buat category 'artifact' MAUPUN 'accession' (bedanya
     * cuma filter category, tampilannya sama). Accession item bisa dibeli
     * pakai Gold + Mithril (kalau price_mithril > 0).
     */
    public function category(Request $request, string $category): Response
    {
        if (! in_array($category, Item::CATEGORIES)) {
            abort(404);
        }

        $rarityOrder = "CASE rarity ".
            implode(' ', array_map(fn ($r, $i) => "WHEN '{$r}' THEN {$i}", Item::RARITIES, array_keys(Item::RARITIES))).
            ' END';

        $items = Item::with('element')->where('category', $category)
            ->orderByRaw($rarityOrder)->orderBy('price')->get();

        $characters = Character::with('subclass')
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Shop/Category', [
            'items' => $items,
            'characters' => $characters,
            'category' => $category,
        ]);
    }

    /**
     * Beli item pakai gold (+ mithril kalau accession) karakter - item masuk
     * ke inventory (belum ke-equip otomatis, atur equip-nya sendiri di
     * halaman karakter atau di "Item Saya").
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
