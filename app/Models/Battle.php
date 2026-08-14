<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Battle extends Model
{
    use HasFactory;

    protected $fillable = [
        'encounter_id', 'monster_id', 'monster_current_hp',
        'status', 'round_number', 'battle_log',
    ];

    protected $casts = [
        'battle_log' => 'array',
    ];

    public function encounter(): BelongsTo
    {
        return $this->belongsTo(Encounter::class);
    }

    public function monster(): BelongsTo
    {
        return $this->belongsTo(Monster::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(BattleParticipant::class);
    }

    public function addLog(string $line): void
    {
        $log = $this->battle_log ?? [];
        $log[] = $line;
        $this->battle_log = $log;
    }
}
