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
     * effect_value EFEKTIF item ARTIFACT di level tertentu - tiap 20 level
     * (1 "blok") nambah +25% power dari base. Level 0 (belum pernah di-level
     * sama sekali) = base effect_value apa adanya. Berlaku SEMUA artifact
     * (equipment), bukan cuma kategori khusus lagi.
     */
    public function accessionEffectiveValue(int $level): int
    {
        if ($this->category !== 'artifact' || $level <= 0) {
            return $this->effect_value;
        }

        $tierIndex = intdiv($level, self::ACCESSION_MILESTONE_STEP);
        $multiplier = 1 + ($tierIndex * 0.25);

        return (int) round($this->effect_value * $multiplier);
    }
}
