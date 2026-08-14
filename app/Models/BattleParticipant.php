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
        'current_stamina', 'current_mana', 'is_alive',
    ];

    protected $casts = [
        'is_alive' => 'boolean',
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
