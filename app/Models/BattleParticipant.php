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
        'current_stamina', 'current_mana', 'skill_cooldowns', 'loadout_skill_ids', 'next_action_at',
        'npc_encounter_level', 'npc_stat_snapshot', 'is_alive', 'is_stunned', 'buff_multiplier', 'buff_stat',
    ];

    protected $casts = [
        'is_alive' => 'boolean',
        'is_stunned' => 'boolean',
        'skill_cooldowns' => 'array',
        'loadout_skill_ids' => 'array',
        'npc_stat_snapshot' => 'array',
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
