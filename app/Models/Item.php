<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Item extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'rarity', 'category', 'price',
        'effect_stat', 'effect_element_id', 'effect_value', 'accession_bonuses', 'drop_rate', 'icon_path',
    ];

    protected $casts = [
        'accession_bonuses' => 'array',
    ];

    public const RARITIES = ['common', 'rare', 'sr', 'ur', 'legendary'];

    public const RARITY_LABELS = [
        'common' => 'Common',
        'rare' => 'Rare',
        'sr' => 'SR',
        'ur' => 'UR',
        'legendary' => 'Legendary',
    ];

    // 'artifact' = SEMUA equipment (bisa di-equip, DAN bisa di-level lewat
    // sacrifice item lain - naik power sesuai level).
    // 'accession' = CATALYST sekali pakai (consumable, GAK BISA di-equip) -
    // wajib dikonsumsi buat nembus batas kelipatan 20 level pas level-up
    // artifact (lihat AccessionController::levelUp()).
    // 'material' = bahan crafting (Mithril, Ore, Orb dll) - GAK BISA di-equip,
    // stackable, buat sekarang cuma flavor/future use (belum ada resep aktif
    // yang makenya lagi, resep lama dihapus pas rework konsep ini).
    public const CATEGORIES = ['artifact', 'accession', 'material'];

    public const CATEGORY_LABELS = [
        'artifact' => 'Artifact Item',
        'accession' => 'Accession Item (Catalyst)',
        'material' => 'Material (Crafting)',
    ];

    public const MAX_ACCESSION_LEVEL = 100;

    // Kelipatan level yang jadi "batas blok" - naik BEBAS lewat sacrifice
    // sampai kelipatan ini, abis itu MENTOK, wajib consume 1 Accession Item
    // (catalyst) yang cocok buat buka blok berikutnya (lihat unlocked_tier
    // di character_items).
    public const ACCESSION_MILESTONE_STEP = 20;

    public const ACCESSION_TIERS = [0, 20, 40, 60, 80, 100];

    public const EFFECT_STATS = [
        'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'accuracy', 'evasion', 'critical_hit', 'critical_luck',
        'hp', 'hp_regen', 'mp_regen', 'sp_regen',
        'elemental_damage',
    ];

    public function element()
    {
        return $this->belongsTo(Element::class, 'effect_element_id');
    }

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'character_items')
            ->withPivot('id', 'is_equipped', 'obtained_at', 'accession_level', 'unlocked_tier', 'quantity')
            ->withTimestamps();
    }

    /**
     * Semua bonus stat item ini di level tertentu - base (effect_stat/value)
     * DIGABUNG (aditif, bukan nimpa) sama tiap bonus Part yang udah
     * tercapai (accession_bonuses, admin-defined per item). Stat yang SAMA
     * dijumlahin; stat yang BEDA jadi entri terpisah. Return: array
     * [['stat' => ..., 'value' => ..., 'element_id' => ...|null], ...]
     * (list, bukan map, biar bisa nampung 2 bonus elemental beda elemen).
     */
    public function allBonusesAtLevel(int $level): array
    {
        $bonuses = collect([
            ['stat' => $this->effect_stat, 'value' => $this->effect_value, 'element_id' => $this->effect_element_id],
        ]);

        if ($this->category === 'artifact' && $level > 0) {
            foreach ($this->accession_bonuses ?? [] as $b) {
                if (($b['tier'] ?? 0) <= $level && ! empty($b['stat']) && ($b['value'] ?? 0) != 0) {
                    $bonuses->push(['stat' => $b['stat'], 'value' => (int) $b['value'], 'element_id' => $b['element_id'] ?? null]);
                }
            }
        }

        // Gabungin (sum) entri yang stat+element_id-nya SAMA, biarin yang beda tetep terpisah.
        return $bonuses
            ->groupBy(fn ($b) => $b['stat'].'-'.($b['element_id'] ?? 'x'))
            ->map(fn ($group) => ['stat' => $group->first()['stat'], 'value' => $group->sum('value'), 'element_id' => $group->first()['element_id']])
            ->values()
            ->all();
    }

    /**
     * Total bonus utk 1 stat spesifik (non-elemental) di level tertentu -
     * dipakai Character::itemBonus().
     */
    public function bonusForStat(string $stat, int $level): int
    {
        return collect($this->allBonusesAtLevel($level))
            ->where('stat', $stat)
            ->sum('value');
    }

    /**
     * Total bonus elemental_damage utk elemen tertentu di level tertentu -
     * dipakai Character::elementalDamageBonus().
     */
    public function elementalBonusForElement(int $elementId, int $level): int
    {
        return collect($this->allBonusesAtLevel($level))
            ->where('stat', 'elemental_damage')
            ->where('element_id', $elementId)
            ->sum('value');
    }
}
