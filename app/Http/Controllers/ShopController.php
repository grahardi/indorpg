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

        // Material ditampilin bareng di halaman Accession Item (biar gampang
        // beli bahan crafting-nya di tempat yang sama) - urutan rarity juga.
        $materials = $category === 'accession'
            ? Item::where('category', 'material')->orderByRaw($rarityOrder)->orderBy('price')->get()
            : collect();

        $characters = Character::with('subclass')
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Shop/Category', [
            'items' => $items,
            'materials' => $materials,
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
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        $character = Character::findOrFail($data['character_id']);
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $item = Item::findOrFail($data['item_id']);
        $qty = $data['quantity'] ?? 1;
        // Material & Accession (catalyst) bisa beli banyak sekaligus (numpuk 1
        // baris) - keduanya consumable. Cuma Artifact (equipment) yang unik
        // per unit, maksimal 1 per transaksi.
        $isStackable = in_array($item->category, ['material', 'accession']);
        if (! $isStackable) {
            $qty = 1;
        }

        $totalPrice = $item->price * $qty;

        if (! $isStackable && $character->items()->count() >= 50) {
            return back()->withErrors(['gold' => 'Bag udah penuh (maksimal 50 item). Jual/buang item dulu.']);
        }

        if ($character->gold < $totalPrice) {
            return back()->withErrors(['gold' => 'Gold gak cukup buat beli item ini.']);
        }

        $character->decrement('gold', $totalPrice);

        if ($isStackable) {
            // Numpuk - cari baris existing item ini, nambahin quantity; kalau
            // belum punya, baru bikin baris baru.
            $existing = \Illuminate\Support\Facades\DB::table('character_items')
                ->where('character_id', $character->id)->where('item_id', $item->id)->first();
            if ($existing) {
                \Illuminate\Support\Facades\DB::table('character_items')->where('id', $existing->id)->increment('quantity', $qty);
            } else {
                $character->items()->attach($item->id, ['obtained_at' => now(), 'quantity' => $qty]);
            }
        } else {
            $character->items()->attach($item->id, ['obtained_at' => now()]);
        }

        return back()->with('success', "{$item->name}".($qty > 1 ? " x{$qty}" : '')." dibeli buat {$character->name}.");
    }
}
