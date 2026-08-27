<?php

namespace Database\Seeders;

use App\Models\AccessionRecipe;
use App\Models\Item;
use Illuminate\Database\Seeder;

class AccessionRecipeSeeder extends Seeder
{
    /**
     * Resep naik tier (20/40/60/80/100) buat tiap Accession Item - beda-beda
     * per RARITY item (makin tinggi rarity, makin butuh material langka dari
     * tier awal). Sesuai contoh: Legendary butuh Mithril dari Part 1 (tier
     * 20), Rare masih bisa pakai Ore biasa sampai beberapa tier.
     */
    public function run(): void
    {
        $materialIds = Item::where('category', 'material')->pluck('id', 'slug');

        // Template per rarity: [tier => [material_slug => qty]]
        $templates = [
            'rare' => [
                20 => ['gold-ore' => 10, 'silver-ore' => 15],
                40 => ['gold-ore' => 15, 'silver-ore' => 20],
                60 => ['ancient-rune' => 3, 'gold-ore' => 20],
                80 => ['ancient-rune' => 5, 'gold-ore' => 25],
                100 => ['dragon-scale' => 2, 'ancient-rune' => 8],
            ],
            'sr' => [
                20 => ['ancient-rune' => 5, 'gold-ore' => 15, 'silver-ore' => 10],
                40 => ['ancient-rune' => 8, 'gold-ore' => 20, 'silver-ore' => 15],
                60 => ['dragon-scale' => 3, 'ancient-rune' => 10, 'gold-ore' => 25],
                80 => ['dragon-scale' => 5, 'ancient-rune' => 15, 'gold-ore' => 30],
                100 => ['mithril' => 1, 'dragon-scale' => 8, 'ancient-rune' => 20],
            ],
            'ur' => [
                20 => ['dragon-scale' => 5, 'ancient-rune' => 8, 'gold-ore' => 10],
                40 => ['dragon-scale' => 8, 'ancient-rune' => 12, 'gold-ore' => 15],
                60 => ['mithril' => 1, 'dragon-scale' => 12, 'ancient-rune' => 18],
                80 => ['mithril' => 2, 'dragon-scale' => 16, 'ancient-rune' => 22],
                100 => ['mithril' => 4, 'mystical-orb' => 5, 'dragon-scale' => 20],
            ],
            'legendary' => [
                20 => ['mithril' => 1, 'mystical-orb' => 10, 'silver-ore' => 3],
                40 => ['mithril' => 3, 'mystical-orb' => 15, 'silver-ore' => 5],
                60 => ['mithril' => 6, 'mystical-orb' => 20, 'dragon-scale' => 8],
                80 => ['mithril' => 10, 'mystical-orb' => 25, 'dragon-scale' => 12],
                100 => ['mithril' => 15, 'mystical-orb' => 30, 'dragon-scale' => 20],
            ],
        ];

        $accessionItems = Item::where('category', 'accession')->get();

        foreach ($accessionItems as $item) {
            $template = $templates[$item->rarity] ?? $templates['rare'];

            foreach ($template as $tier => $materials) {
                $materialsById = collect($materials)
                    ->mapWithKeys(fn ($qty, $slug) => [$materialIds[$slug] => $qty])
                    ->toArray();

                AccessionRecipe::updateOrCreate(
                    ['item_id' => $item->id, 'tier' => $tier],
                    ['materials' => $materialsById]
                );
            }
        }
    }
}
