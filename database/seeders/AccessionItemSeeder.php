<?php

namespace Database\Seeders;

use App\Models\Element;
use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AccessionItemSeeder extends Seeder
{
    /**
     * Contoh Accession Item (bagian 76-77) - item spesial yang bisa di-level
     * 1-100 lewat "Item Saya" (korbanin item Artifact + Mithril). Harganya
     * lebih mahal & drop rate lebih kecil dari item Artifact biasa (rarity
     * setara), soalnya power-nya bisa jauh lebih gede di level tinggi.
     */
    public function run(): void
    {
        $elementIds = Element::pluck('id', 'name');

        $items = [
            ['Tongkat Accession Arcane', 'magic_damage', null, 'rare', 500, 15, 3, 'cat-magic-damage'],
            ['Zirah Accession Abadi', 'physical_defense', null, 'rare', 500, 15, 3, 'cat-physical-defense'],
            ['Amulet Accession Vitalitas', 'hp', null, 'sr', 1200, 40, 1.5, 'cat-hp'],
            ['Cincin Accession Presisi', 'critical_hit', null, 'sr', 1200, 30, 1.5, 'cat-critical-hit'],
            ['Inti Elemental Accession', 'elemental_damage', 'Fire', 'sr', 1200, 35, 1.5, 'cat-fire'],
            ['Pusaka Accession Naga', 'physical_damage', null, 'ur', 2500, 30, 0.5, 'cat-physical-damage'],
            ['Grimoire Accession Legenda', 'magic_damage', null, 'legendary', 5000, 50, 0.1, 'cat-magic-damage'],
        ];

        foreach ($items as [$name, $stat, $elementName, $rarity, $price, $value, $dropRate, $iconSlug]) {
            Item::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => 'Accession Item - bisa di-level 1-100 lewat "Item Saya", makin tinggi level makin kuat. Power melonjak tiap kelipatan 20 level.',
                    'rarity' => $rarity,
                    'category' => 'accession',
                    'price' => $price,
                    'effect_stat' => $stat,
                    'effect_element_id' => $elementName ? ($elementIds[$elementName] ?? null) : null,
                    'effect_value' => $value,
                    'drop_rate' => $dropRate,
                    'icon_path' => "/images/items/{$iconSlug}.png",
                ]
            );
        }
    }
}
