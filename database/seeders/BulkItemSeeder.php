<?php

namespace Database\Seeders;

use App\Models\Element;
use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BulkItemSeeder extends Seeder
{
    /**
     * Generate banyak item standar (40 Common + 15 Rare + 5 SR = 60 item),
     * variasi lengkap: physical/magic damage & defense, crit hit/luck,
     * accuracy/evasion, HP + HP/MP/SP regen, elemental damage (Fire/Wind/
     * Earth/Water). Harga & drop rate ngikutin formula scaling per rarity.
     */
    public function run(): void
    {
        $elementIds = Element::pluck('id', 'name');

        // Range [harga_min, harga_max, value_min, value_max, drop_min, drop_max] per rarity.
        $tierRange = [
            'common' => [30, 100, 6, 16, 15, 28],
            'rare' => [180, 380, 22, 42, 5, 12],
            'sr' => [550, 950, 40, 60, 1.5, 3.5],
        ];

        // [nama, effect_stat, elemen (null kalau bukan elemental), rarity]
        $items = [
            // === COMMON (40) ===
            ['Rusty Sword', 'physical_damage', null, 'common'],
            ['Wooden Club', 'physical_damage', null, 'common'],
            ['Bronze Axe', 'physical_damage', null, 'common'],
            ['Copper Spear', 'physical_damage', null, 'common'],
            ['Leather Vest', 'physical_defense', null, 'common'],
            ['Wooden Shield', 'physical_defense', null, 'common'],
            ['Cloth Armor', 'physical_defense', null, 'common'],
            ['Padded Gloves', 'physical_defense', null, 'common'],
            ['Apprentice Wand', 'magic_damage', null, 'common'],
            ['Simple Staff', 'magic_damage', null, 'common'],
            ['Chipped Orb', 'magic_damage', null, 'common'],
            ['Wool Cloak', 'magic_defense', null, 'common'],
            ['Charm Bead', 'magic_defense', null, 'common'],
            ['Warding Talisman', 'magic_defense', null, 'common'],
            ['Focus Lens', 'accuracy', null, 'common'],
            ['Steady Grip', 'accuracy', null, 'common'],
            ['Keen Monocle', 'accuracy', null, 'common'],
            ['Light Boots', 'evasion', null, 'common'],
            ['Quick Sandals', 'evasion', null, 'common'],
            ['Nimble Cape', 'evasion', null, 'common'],
            ['Sharp Edge Charm', 'critical_hit', null, 'common'],
            ['Hunter\'s Mark', 'critical_hit', null, 'common'],
            ['Lucky Clover', 'critical_luck', null, 'common'],
            ['Rabbit\'s Foot', 'critical_luck', null, 'common'],
            ['Vitality Herb', 'hp', null, 'common'],
            ['Life Ring', 'hp', null, 'common'],
            ['Sturdy Belt', 'hp', null, 'common'],
            ['Healing Salve', 'hp_regen', null, 'common'],
            ['Bandage Roll', 'hp_regen', null, 'common'],
            ['Mana Crystal Shard', 'mp_regen', null, 'common'],
            ['Meditation Bead', 'mp_regen', null, 'common'],
            ['Stamina Root', 'sp_regen', null, 'common'],
            ['Energy Band', 'sp_regen', null, 'common'],
            ['Ember Stone', 'elemental_damage', 'Fire', 'common'],
            ['Warm Coal Charm', 'elemental_damage', 'Fire', 'common'],
            ['Droplet Charm', 'elemental_damage', 'Water', 'common'],
            ['Dewdrop Bead', 'elemental_damage', 'Water', 'common'],
            ['Pebble Charm', 'elemental_damage', 'Earth', 'common'],
            ['Clay Talisman', 'elemental_damage', 'Earth', 'common'],
            ['Breeze Feather', 'elemental_damage', 'Wind', 'common'],

            // === RARE (15) ===
            ['Steel Sword', 'physical_damage', null, 'rare'],
            ['Sharpened Battleaxe', 'physical_damage', null, 'rare'],
            ['Iron Shield', 'physical_defense', null, 'rare'],
            ['Chainmail Vest', 'physical_defense', null, 'rare'],
            ['Enchanted Wand', 'magic_damage', null, 'rare'],
            ['Sage Staff', 'magic_damage', null, 'rare'],
            ['Mystic Cloak', 'magic_defense', null, 'rare'],
            ['Hawk Sight Lens', 'accuracy', null, 'rare'],
            ['Swift Boots', 'evasion', null, 'rare'],
            ['Assassin\'s Mark', 'critical_hit', null, 'rare'],
            ['Fortune Charm', 'critical_luck', null, 'rare'],
            ['Health Pendant', 'hp', null, 'rare'],
            ['Regeneration Ring', 'hp_regen', null, 'rare'],
            ['Flame Core', 'elemental_damage', 'Fire', 'rare'],
            ['Tide Core', 'elemental_damage', 'Water', 'rare'],

            // === SR (5) ===
            ['Mythril Blade', 'physical_damage', null, 'sr'],
            ['Archmage Rod', 'magic_damage', null, 'sr'],
            ['Titan\'s Heart', 'hp', null, 'sr'],
            ['Death\'s Precision', 'critical_hit', null, 'sr'],
            ['Inferno Shard', 'elemental_damage', 'Fire', 'sr'],
        ];

        // Ikon dikelompokkin per kategori stat (bukan per item - 60 item unik
        // butuh 60 gambar unik, gak sepadan effort-nya; ikon kategori tetap
        // ngasih visual jelas beda tiap jenis item).
        $categoryIcon = [
            'physical_damage' => 'cat-physical-damage',
            'physical_defense' => 'cat-physical-defense',
            'magic_damage' => 'cat-magic-damage',
            'magic_defense' => 'cat-magic-defense',
            'accuracy' => 'cat-accuracy',
            'evasion' => 'cat-evasion',
            'critical_hit' => 'cat-critical-hit',
            'critical_luck' => 'cat-critical-luck',
            'hp' => 'cat-hp',
            'hp_regen' => 'cat-hp-regen',
            'mp_regen' => 'cat-mp-regen',
            'sp_regen' => 'cat-sp-regen',
        ];
        $elementIcon = ['Fire' => 'cat-fire', 'Water' => 'cat-water', 'Earth' => 'cat-earth', 'Wind' => 'cat-wind'];

        foreach ($items as [$name, $stat, $elementName, $rarity]) {
            [$priceMin, $priceMax, $valMin, $valMax, $dropMin, $dropMax] = $tierRange[$rarity];

            // Interpolasi posisi item dalam range harga/value/drop biar gak
            // semua item se-tier nilainya sama persis (variasi dikit).
            $seed = crc32($name) % 100 / 100;
            $price = (int) round($priceMin + ($priceMax - $priceMin) * $seed);
            $value = (int) round($valMin + ($valMax - $valMin) * $seed);
            $drop = round($dropMin + ($dropMax - $dropMin) * (1 - $seed), 2);

            $slug = Str::slug($name);
            $iconSlug = $stat === 'elemental_damage' ? ($elementIcon[$elementName] ?? 'placeholder') : ($categoryIcon[$stat] ?? 'placeholder');

            Item::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => $this->describe($name, $stat, $elementName),
                    'rarity' => $rarity,
                    'price' => $price,
                    'effect_stat' => $stat,
                    'effect_element_id' => $elementName ? ($elementIds[$elementName] ?? null) : null,
                    'effect_value' => $value,
                    'drop_rate' => $drop,
                    'icon_path' => "/images/items/{$iconSlug}.png",
                ]
            );
        }
    }

    private function describe(string $name, string $stat, ?string $elementName): string
    {
        return match (true) {
            $stat === 'elemental_damage' => "Item bermuatan elemen {$elementName}, nambah damage skill elemen yang sama.",
            $stat === 'hp' => 'Nambah pool HP maksimum.',
            $stat === 'hp_regen' => 'Nambah pemulihan HP tiap ronde battle.',
            $stat === 'mp_regen' => 'Nambah pemulihan Mana tiap ronde battle.',
            $stat === 'sp_regen' => 'Nambah pemulihan Stamina tiap ronde battle.',
            $stat === 'critical_hit' => 'Nambah persentase kekuatan critical hit.',
            $stat === 'critical_luck' => 'Nambah peluang kena critical hit.',
            $stat === 'accuracy' => 'Nambah ketepatan serangan.',
            $stat === 'evasion' => 'Nambah kemampuan menghindar.',
            default => "{$name}, item standar buat nambah stat combat.",
        };
    }
}
