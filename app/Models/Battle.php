<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Battle extends Model
{
    use HasFactory;

    protected $fillable = [
        'token', 'encounter_id', 'monster_id', 'monster_current_hp',
        'status', 'round_number', 'battle_log', 'viewed_at',
    ];

    protected $casts = [
        'battle_log' => 'array',
        'viewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Battle $battle) {
            if (! $battle->token) {
                do {
                    $token = Str::random(14);
                } while (static::where('token', $token)->exists());

                $battle->token = $token;
            }
        });
    }

    /**
     * URL battle pakai token random (bukan ID urut) - biar gak gampang ditebak
     * / di-enumerate orang lain (/battles/1, /battles/2, dst).
     */
    public function getRouteKeyName(): string
    {
        return 'token';
    }

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
