<?php

namespace App\Http\Controllers;

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
     * Catalyst (Accession Item) yang cocok buat naikin item rarity tertentu -
     * makin tinggi rarity target, makin langka catalyst yang dibutuhin.
     */
    public const CATALYST_BY_RARITY = [
        'common' => 'accession-stone',
        'rare' => 'accession-crystal',
        'sr' => 'accession-orb',
        'ur' => 'accession-core',
        'legendary' => 'accession-relic',
    ];

    /**
     * "Item Saya" - lihat semua item karakter (Artifact + Accession/catalyst +
     * Material), dan level-up Artifact item (sacrifice + catalyst kalau perlu).
     */
    public function index(Request $request): Response
    {
        $characters = Character::with(['items.element'])
            ->where('user_id', $request->user()->id)
            ->where('is_npc', false)
            ->orderBy('name')
            ->get();

        return Inertia::render('Shop/MyItems', [
            'characters' => $characters,
            'elements' => \App\Models\Element::orderBy('name')->get(),
            'itemLevelGrowthRatio' => \App\Models\GameSetting::getFloat('item_level_growth_ratio', 1.0),
        ]);
    }

    /**
     * Level-up 1 Artifact item pakai sacrifice item lain (kayak konsep asli
     * bagian 77: SR/Legendary gak bisa dikorbanin, item equipped gak bisa,
     * item accession/material gak bisa). Level naik BEBAS sampai
     * `unlocked_tier` (default 20). Kalau target level abis sacrifice bakal
     * NGELEWATIN unlocked_tier saat ini, WAJIB consume 1 Accession Item
     * (catalyst) yang cocok rarity-nya - abis dikonsumsi, unlocked_tier naik
     * +20 (buka blok berikutnya).
     */
    public function levelUp(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'character_id' => ['required', 'exists:characters,id'],
            'character_item_id' => ['required', 'integer'],
            'sacrifice_character_item_ids' => ['required', 'array', 'min:1', 'max:10'],
            'sacrifice_character_item_ids.*' => ['integer'],
        ]);

        $character = Character::with('items')->findOrFail($data['character_id']);
        if ($character->user_id !== $request->user()->id) {
            abort(403, 'Bukan karaktermu.');
        }

        $target = $character->items->firstWhere('pivot.id', $data['character_item_id']);
        if (! $target || $target->category !== 'artifact') {
            return back()->withErrors(['accession' => 'Item target gak ketemu atau bukan Artifact Item.']);
        }

        $currentLevel = (int) $target->pivot->accession_level;
        $unlockedTier = (int) $target->pivot->unlocked_tier;

        if ($currentLevel >= Item::MAX_ACCESSION_LEVEL) {
            return back()->withErrors(['accession' => 'Item ini udah level maksimal (100).']);
        }

        // Validasi sacrifice - sama persis aturan bagian 77: milik karakter
        // yang sama, BUKAN SR/Legendary, BUKAN accession/material, BUKAN
        // di-equip, BUKAN item target itu sendiri.
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
            if ($sac->category !== 'artifact') {
                return back()->withErrors(['accession' => "{$sac->name} bukan Artifact Item - cuma Artifact yang bisa dikorbanin."]);
            }
            if ($sac->pivot->is_equipped) {
                return back()->withErrors(['accession' => "{$sac->name} lagi di-equip - lepas dulu sebelum dikorbanin."]);
            }
        }

        $rarityPoints = ['common' => 1, 'rare' => 3, 'ur' => 8];
        $points = $sacrifices->sum(fn ($i) => $rarityPoints[$i->rarity] ?? 1);

        // Simulasi naik level dari sacrifice - TAPI mentok di unlockedTier,
        // gak boleh nembus tanpa catalyst.
        $newLevel = $currentLevel;
        $remainingPoints = $points;
        while ($remainingPoints > 0 && $newLevel < $unlockedTier) {
            $costForNextLevel = $newLevel + 1;
            if ($remainingPoints < $costForNextLevel) {
                break;
            }
            $remainingPoints -= $costForNextLevel;
            $newLevel++;
        }

        $hitBlockCap = $newLevel >= $unlockedTier && $remainingPoints > 0;

        // Kalau masih ada poin sisa TAPI udah mentok di unlockedTier, coba
        // konsumsi 1 catalyst yang cocok buat buka blok berikutnya, lanjut
        // ngitung sisa poin ke blok baru.
        $catalystConsumed = null;
        if ($hitBlockCap && $unlockedTier < Item::MAX_ACCESSION_LEVEL) {
            $catalystSlug = self::CATALYST_BY_RARITY[$target->rarity] ?? 'accession-stone';
            $catalystItem = Item::where('slug', $catalystSlug)->first();
            $ownedCatalyst = $catalystItem
                ? $character->items->first(fn ($i) => $i->id === $catalystItem->id && $i->category === 'accession')
                : null;

            if ($ownedCatalyst) {
                $catalystConsumed = $catalystItem;
                $unlockedTier = min(Item::MAX_ACCESSION_LEVEL, $unlockedTier + Item::ACCESSION_MILESTONE_STEP);

                while ($remainingPoints > 0 && $newLevel < $unlockedTier) {
                    $costForNextLevel = $newLevel + 1;
                    if ($remainingPoints < $costForNextLevel) {
                        break;
                    }
                    $remainingPoints -= $costForNextLevel;
                    $newLevel++;
                }
            }
        }

        if ($newLevel === $currentLevel) {
            $catalystName = Item::where('slug', self::CATALYST_BY_RARITY[$target->rarity] ?? 'accession-stone')->value('name') ?? 'Accession Item';
            return back()->withErrors(['accession' => "Poin sacrifice belum cukup, atau butuh 1 {$catalystName} buat nembus batas level {$unlockedTier}."]);
        }

        // Eksekusi: hapus sacrifice (by pivot id, aman dari duplikat), consume
        // catalyst kalau kepake, update level+unlocked_tier target.
        foreach ($sacrifices as $sac) {
            DB::table('character_items')->where('id', $sac->pivot->id)->delete();
        }

        if ($catalystConsumed) {
            $catalystRow = DB::table('character_items')
                ->where('character_id', $character->id)->where('item_id', $catalystConsumed->id)->first();
            if ($catalystRow->quantity > 1) {
                DB::table('character_items')->where('id', $catalystRow->id)->decrement('quantity');
            } else {
                DB::table('character_items')->where('id', $catalystRow->id)->delete();
            }
        }

        DB::table('character_items')->where('id', $target->pivot->id)->update([
            'accession_level' => $newLevel,
            'unlocked_tier' => $unlockedTier,
        ]);

        $message = "{$target->name} naik ke level {$newLevel}!".($catalystConsumed ? " 🌟 {$catalystConsumed->name} dipakai, blok level ".($unlockedTier)." kebuka!" : '');

        return back()->with('success', $message);
    }
}
