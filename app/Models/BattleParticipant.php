<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BattleParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'battle_id', 'character_id', 'current_hp',
        'current_stamina', 'current_mana', 'skill_cooldowns', 'is_alive',
    ];

    protected $casts = [
        'is_alive' => 'boolean',
        'skill_cooldowns' => 'array',
    ];

    public function battle(): BelongsTo
    {
        return $this->belongsTo(Battle::class);
    }

    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class);
    }
}
