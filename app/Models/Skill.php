<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'subclass_id', 'element_id', 'name', 'description', 'tier', 'branch',
        'scaling_stat', 'physical_ratio', 'combat_range', 'stamina_cost', 'mana_cost', 'cooldown_seconds',
        'base_multiplier', 'can_stun', 'buff_type', 'buff_stat', 'heal_resource', 'icon_path', 'animation_path', 'required_level',
    ];

    protected $casts = [
        'can_stun' => 'boolean',
    ];

    public const BUFF_TYPES = ['none', 'heal', 'nerf', 'buff'];

    public const BUFF_STATS = ['attack', 'defense'];

    /**
     * Rasio physical (0-100) buat kalkulasi damage campuran. Kalau physical_ratio
     * gak diisi (null), fallback ke scaling_stat lama (100 kalau 'physical',
     * 0 kalau 'magic') - backward compatible sama skill yang belum di-set.
     */
    public function resolvedPhysicalRatio(): int
    {
        if ($this->physical_ratio !== null) {
            return $this->physical_ratio;
        }

        return $this->scaling_stat === 'magic' ? 0 : 100;
    }

    public const HEAL_RESOURCES = ['hp', 'mp', 'sp'];

    public function subclass(): BelongsTo
    {
        return $this->belongsTo(Subclass::class);
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'character_skills')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
