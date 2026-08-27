<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AccessionCatalystSeeder extends Seeder
{
    /**
     * 5 Accession Item (CATALYST sekali pakai) - dikonsumsi buat nembus
     * batas kelipatan 20 level pas naikin Artifact Item. Makin tinggi rarity
     * Artifact yang mau di-level, makin langka catalyst yang dibutuhin
     * (lihat AccessionController::CATALYST_BY_RARITY).
     */
    public function run(): void
    {
        $catalysts = [
            ['Accession Stone', 'common', 100, 20, 'accession-stone'],
            ['Accession Crystal', 'rare', 400, 8, 'accession-crystal'],
            ['Accession Orb', 'sr', 1000, 3, 'accession-orb'],
            ['Accession Core', 'ur', 2200, 1, 'accession-core'],
            ['Accession Relic', 'legendary', 5000, 0.3, 'accession-relic'],
        ];

        foreach ($catalysts as [$name, $rarity, $price, $dropRate, $iconSlug]) {
            Item::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'description' => 'Catalyst sekali pakai - konsumsi ini buat nembus batas kelipatan 20 level pas nge-level-in Artifact Item. Gak bisa di-equip.',
                    'rarity' => $rarity,
                    'category' => 'accession',
                    'price' => $price,
                    'effect_stat' => 'physical_damage', // gak relevan buat catalyst, kolom wajib diisi
                    'effect_value' => 0,
                    'drop_rate' => $dropRate,
                    'icon_path' => "/images/items/catalysts/{$iconSlug}.png",
                ]
            );
        }
    }
}
