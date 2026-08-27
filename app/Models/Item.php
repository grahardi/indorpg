<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Item extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'rarity', 'category', 'price',
        'effect_stat', 'effect_element_id', 'effect_value', 'drop_rate', 'icon_path',
    ];

    public const RARITIES = ['common', 'rare', 'sr', 'ur', 'legendary'];

    public const RARITY_LABELS = [
        'common' => 'Common',
        'rare' => 'Rare',
        'sr' => 'SR',
        'ur' => 'UR',
        'legendary' => 'Legendary',
    ];

    // 'artifact' = item biasa (equip buat bonus stat, gak bisa di-level).
    // 'accession' = item baru, bisa di-level lewat resep (lihat AccessionRecipe)
    // - power-nya (effect_value efektif) NAIK sesuai level.
    // 'material' = bahan crafting (Mithril, Ore, Orb dll) - GAK BISA di-equip,
    // stackable (numpuk quantity di 1 baris character_items), cuma dipakai
    // buat naik level accession item lewat resep.
    public const CATEGORIES = ['artifact', 'accession', 'material'];

    public const CATEGORY_LABELS = [
        'artifact' => 'Artifact Item',
        'accession' => 'Accession Item',
        'material' => 'Material (Crafting)',
    ];

    public const MAX_ACCESSION_LEVEL = 100;

    // Level accession SEKARANG diskrit (bukan granular 1-100 lagi) - naik per
    // TIER lewat resep crafting (lihat AccessionRecipe): 0 (belum di-level) ->
    // 20 (Part 1) -> 40 (Part 2) -> 60 (Part 3) -> 80 (Part 4) -> 100 (Part 5).
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
            ->withPivot('is_equipped', 'obtained_at', 'accession_level', 'quantity')
            ->withTimestamps();
    }

    public function recipes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AccessionRecipe::class);
    }

    /**
     * effect_value EFEKTIF item accession di tier tertentu - tiap tier yang
     * kelewatin (0/20/40/60/80/100 = 5 tier maks) nambah +25% power dari base.
     * Tier 0 (belum di-craft sama sekali) = base effect_value apa adanya.
     */
    public function accessionEffectiveValue(int $level): int
    {
        if ($this->category !== 'accession' || $level <= 0) {
            return $this->effect_value;
        }

        $tierIndex = intdiv($level, self::ACCESSION_MILESTONE_STEP); // 1-5
        $multiplier = 1 + ($tierIndex * 0.25);

        return (int) round($this->effect_value * $multiplier);
    }
}
