<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MaterialItemSeeder extends Seeder
{
    /**
     * 6 bahan crafting (category='material') - dipakai buat resep naik level
     * Accession Item (lihat AccessionRecipeSeeder). Rarity material nentuin
     * seberapa gampang didapat (drop_rate) & harga beli - Mithril & Mystical
     * Orb paling langka/mahal, Gold/Silver Ore paling gampang.
     */
    public function run(): void
    {
        $materials = [
            ['Mithril', 'legendary', 800, 1.5, 'mithril'],
            ['Mystical Orb', 'ur', 350, 3, 'mystical-orb'],
            ['Dragon Scale', 'sr', 150, 6, 'dragon-scale'],
            ['Ancient Rune', 'rare', 60, 12, 'ancient-rune'],
            ['Gold Ore', 'common', 15, 30, 'gold-ore'],
            ['Silver Ore', 'common', 8, 35, 'silver-ore'],
        ];

        foreach ($materials as [$name, $rarity, $price, $dropRate, $iconSlug]) {
            Item::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => 'Bahan crafting - dipakai buat naik level Accession Item lewat resep di "Item Saya". Gak bisa di-equip.',
                    'rarity' => $rarity,
                    'category' => 'material',
                    'price' => $price,
                    'effect_stat' => 'physical_damage', // gak relevan buat material, tapi kolom wajib diisi
                    'effect_value' => 0,
                    'drop_rate' => $dropRate,
                    'icon_path' => "/images/items/materials/{$iconSlug}.png",
                ]
            );
        }
    }
}
