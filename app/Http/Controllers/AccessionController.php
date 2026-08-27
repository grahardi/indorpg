<?php

namespace App\Http\Controllers;

use App\Models\AccessionRecipe;
use App\Models\Character;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AccessionController extends Controller
{
    /**
     * "Item Saya" - lihat semua item karakter (artifact + accession +
     * material), dan craft/upgrade accession item lewat resep material.
     */
    public function index(Request $request): Response
    {
        $characters = Character::with(['items.element'])
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        // Semua resep buat item accession yang ADA di game (dikirim sekali,
        // frontend nyocokin sendiri per item + tier berikutnya).
        $recipes = AccessionRecipe::with('item')->get()->groupBy('item_id');

        // Semua material yang ADA (bukan cuma yang dipunya karakter) - biar
        // panel resep tetap bisa nampilin nama/ikon material yang DIBUTUHIN
        // walau karakter masih punya 0 dari material itu.
        $allMaterials = Item::where('category', 'material')->get();

        return Inertia::render('Shop/MyItems', [
            'characters' => $characters,
            'recipes' => $recipes,
            'allMaterials' => $allMaterials,
        ]);
    }

    /**
     * Craft/upgrade 1 accession item ke TIER BERIKUTNYA (20/40/60/80/100)
     * pakai resep material yang udah ditentuin admin. Gak ada lagi sacrifice
     * bebas - based resep spesifik ala DotA.
     */
    public function levelUp(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'character_id' => ['required', 'exists:characters,id'],
            'character_item_id' => ['required', 'integer'], // id baris character_items (pivot)
        ]);

        $character = Character::with('items')->findOrFail($data['character_id']);
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $target = $character->items->firstWhere('pivot.id', $data['character_item_id']);
        if (! $target || $target->category !== 'accession') {
            return back()->withErrors(['accession' => 'Item target gak ketemu atau bukan Accession Item.']);
        }

        $currentLevel = (int) $target->pivot->accession_level;
        $nextTier = collect(Item::ACCESSION_TIERS)->first(fn ($t) => $t > $currentLevel);

        if (! $nextTier) {
            return back()->withErrors(['accession' => 'Item ini udah tier maksimal (100).']);
        }

        $recipe = AccessionRecipe::where('item_id', $target->id)->where('tier', $nextTier)->first();
        if (! $recipe) {
            return back()->withErrors(['accession' => "Belum ada resep buat tier {$nextTier} - hubungi admin."]);
        }

        // Cek stok material - harus PUNYA semua material di resep, jumlah cukup.
        $inventory = $character->items->where('category', 'material')
            ->groupBy('id')
            ->map(fn ($group) => $group->sum('pivot.quantity'));

        $missing = [];
        foreach ($recipe->materials as $materialId => $qtyNeeded) {
            $have = $inventory->get((int) $materialId, 0);
            if ($have < $qtyNeeded) {
                $materialName = Item::find($materialId)?->name ?? "Material #{$materialId}";
                $missing[] = "{$materialName} (punya {$have}, butuh {$qtyNeeded})";
            }
        }

        if (! empty($missing)) {
            return back()->withErrors(['accession' => 'Material kurang: '.implode(', ', $missing)]);
        }

        // Eksekusi: kurangin quantity material (hapus baris kalau habis), naikin
        // tier target ke nextTier.
        foreach ($recipe->materials as $materialId => $qtyNeeded) {
            $remaining = $qtyNeeded;
            $rows = DB::table('character_items')
                ->where('character_id', $character->id)
                ->where('item_id', $materialId)
                ->orderBy('id')
                ->get();

            foreach ($rows as $row) {
                if ($remaining <= 0) {
                    break;
                }
                $take = min($remaining, $row->quantity);
                $remaining -= $take;
                $newQty = $row->quantity - $take;
                if ($newQty <= 0) {
                    DB::table('character_items')->where('id', $row->id)->delete();
                } else {
                    DB::table('character_items')->where('id', $row->id)->update(['quantity' => $newQty]);
                }
            }
        }

        DB::table('character_items')->where('id', $target->pivot->id)->update(['accession_level' => $nextTier]);

        $partNumber = array_search($nextTier, Item::ACCESSION_TIERS);
        $message = "{$target->name} berhasil di-craft ke tier {$nextTier} (Part {$partNumber})! 🌟";

        return back()->with('success', $message);
    }
}
