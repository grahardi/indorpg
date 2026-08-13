<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subclass extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id', 'element_id', 'name', 'slug', 'power_type',
        'description', 'flavor_bonus',
        'base_physical_damage', 'base_physical_defense',
        'base_magic_damage', 'base_magic_defense',
    ];

    public function gameClass(): BelongsTo
    {
        return $this->belongsTo(GameClass::class, 'class_id');
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }
}
