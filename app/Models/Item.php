<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Item extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'rarity', 'price',
        'effect_stat', 'effect_value', 'drop_rate', 'icon_path',
    ];

    public const RARITIES = ['common', 'rare', 'sr', 'ur', 'legendary'];

    public const RARITY_LABELS = [
        'common' => 'Common',
        'rare' => 'Rare',
        'sr' => 'SR',
        'ur' => 'UR',
        'legendary' => 'Legendary',
    ];

    public const EFFECT_STATS = [
        'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'accuracy', 'evasion', 'critical_hit', 'critical_luck',
    ];

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'character_items')
            ->withPivot('is_equipped', 'obtained_at')
            ->withTimestamps();
    }
}
