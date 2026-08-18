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
        'scaling_stat', 'combat_range', 'stamina_cost', 'mana_cost', 'cooldown_seconds',
        'base_multiplier', 'can_stun', 'buff_type', 'heal_resource', 'icon_path', 'animation_path', 'required_level',
    ];

    protected $casts = [
        'can_stun' => 'boolean',
    ];

    public const BUFF_TYPES = ['none', 'heal', 'nerf', 'buff'];

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
