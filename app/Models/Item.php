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
    // 'accession' = item baru, bisa di-level 1-100 lewat sacrifice (lihat
    // AccessionController) - power-nya (effect_value efektif) NAIK sesuai
    // level, plus power spike ekstra tiap kelipatan 20 level.
    public const CATEGORIES = ['artifact', 'accession'];

    public const CATEGORY_LABELS = [
        'artifact' => 'Artifact Item',
        'accession' => 'Accession Item',
    ];

    public const MAX_ACCESSION_LEVEL = 100;

    // Kelipatan level yang dapet power spike ekstra ("hidden skill" - buat
    // sekarang berupa bonus power melonjak, bukan skill terpisah).
    public const ACCESSION_MILESTONE_STEP = 20;

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
            ->withPivot('is_equipped', 'obtained_at', 'accession_level')
            ->withTimestamps();
    }

    /**
     * effect_value EFEKTIF item accession di level tertentu - naik linear
     * per level (2% per level dari base), PLUS lompatan +15% ekstra tiap
     * kelipatan ACCESSION_MILESTONE_STEP (20/40/60/80/100) yang udah
     * kelewatin ("hidden skill" power spike). Level 0/1 (belum di-level
     * sama sekali) = base effect_value apa adanya.
     */
    public function accessionEffectiveValue(int $level): int
    {
        if ($this->category !== 'accession' || $level <= 1) {
            return $this->effect_value;
        }

        $milestonesPassed = intdiv($level, self::ACCESSION_MILESTONE_STEP);
        $linearBonus = 1 + (($level - 1) * 0.02);
        $milestoneBonus = 1 + ($milestonesPassed * 0.15);

        return (int) round($this->effect_value * $linearBonus * $milestoneBonus);
    }
}
