<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ItemSeeder extends Seeder
{
    /**
     * Item awal - contoh persis dari instruksi (Black Dagger) + beberapa
     * variasi lain biar shop gak kosong dan tiap rarity ke-wakilin.
     * Harga & drop_rate makin ekstrem seiring naik rarity (makin mahal,
     * makin susah drop).
     */
    public function run(): void
    {
        $items = [
            ['name' => 'Black Dagger', 'rarity' => 'common', 'price' => 80, 'stat' => 'physical_damage', 'value' => 20, 'drop' => 22,
                'desc' => 'Belati hitam sederhana, nambah dikit tenaga serangan fisik.'],
            ['name' => 'Iron Bracer', 'rarity' => 'common', 'price' => 70, 'stat' => 'physical_defense', 'value' => 18, 'drop' => 22,
                'desc' => 'Pelindung lengan besi dasar.'],
            ['name' => 'Arcane Ring', 'rarity' => 'rare', 'price' => 250, 'stat' => 'magic_damage', 'value' => 35, 'drop' => 8,
                'desc' => 'Cincin berukir rune, nyimpen sedikit energi arkana.'],
            ['name' => 'Guardian Amulet', 'rarity' => 'rare', 'price' => 220, 'stat' => 'magic_defense', 'value' => 32, 'drop' => 8,
                'desc' => 'Jimat pelindung yang nolak serangan sihir ringan.'],
            ['name' => "Hawk's Eye Lens", 'rarity' => 'sr', 'price' => 650, 'stat' => 'accuracy', 'value' => 40, 'drop' => 2.5,
                'desc' => 'Lensa langka yang mempertajam bidikan serangan.'],
            ['name' => 'Shadowstep Boots', 'rarity' => 'sr', 'price' => 700, 'stat' => 'evasion', 'value' => 42, 'drop' => 2.5,
                'desc' => 'Sepatu ringan yang bikin gerakan lebih licin dihindari musuh.'],
            ['name' => "Dragon's Fang", 'rarity' => 'ur', 'price' => 1800, 'stat' => 'critical_hit', 'value' => 15, 'drop' => 0.6,
                'desc' => 'Taring naga tua, nambah kekuatan pukulan kritis secara drastis.'],
            ['name' => 'Fortune Coin', 'rarity' => 'ur', 'price' => 1600, 'stat' => 'critical_luck', 'value' => 18, 'drop' => 0.6,
                'desc' => 'Koin kuno yang katanya nambah keberuntungan pertarungan.'],
            ['name' => 'Excalibur Shard', 'rarity' => 'legendary', 'price' => 5000, 'stat' => 'physical_damage', 'value' => 80, 'drop' => 0.1,
                'desc' => 'Pecahan pedang legendaris, kekuatannya jauh di atas senjata biasa.'],
            ['name' => "Phoenix Heart", 'rarity' => 'legendary', 'price' => 4800, 'stat' => 'magic_defense', 'value' => 75, 'drop' => 0.1,
                'desc' => 'Jantung phoenix yang masih berdenyut, perlindungan sihir tanpa tanding.'],
        ];

        foreach ($items as $item) {
            $slug = Str::slug($item['name']);
            Item::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $item['name'],
                    'description' => $item['desc'],
                    'rarity' => $item['rarity'],
                    'price' => $item['price'],
                    'effect_stat' => $item['stat'],
                    'effect_value' => $item['value'],
                    'drop_rate' => $item['drop'],
                    'icon_path' => "/images/items/{$slug}.png",
                ]
            );
        }
    }
}
