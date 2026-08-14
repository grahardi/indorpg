<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SpawnPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'map_id', 'name', 'description', 'pos_x', 'pos_y',
        'respawn_seconds', 'last_defeated_at',
    ];

    protected $casts = [
        'last_defeated_at' => 'datetime',
    ];

    public function map(): BelongsTo
    {
        return $this->belongsTo(GameMap::class, 'map_id');
    }

    public function monsters(): BelongsToMany
    {
        return $this->belongsToMany(Monster::class, 'spawn_point_monster')
            ->withPivot('weight')
            ->withTimestamps();
    }

    public function encounters(): HasMany
    {
        return $this->hasMany(Encounter::class);
    }

    /**
     * Apakah spawn point ini masih cooldown (baru dibersihkan).
     */
    public function isOnCooldown(): bool
    {
        if (! $this->last_defeated_at) {
            return false;
        }

        return $this->last_defeated_at->addSeconds($this->respawn_seconds)->isFuture();
    }

    public function cooldownRemainingSeconds(): int
    {
        if (! $this->isOnCooldown()) {
            return 0;
        }

        return now()->diffInSeconds($this->last_defeated_at->addSeconds($this->respawn_seconds));
    }

    /**
     * Weighted-random pick satu monster dari pool spawn point ini.
     * Return null kalau lagi cooldown atau pool kosong.
     */
    public function rollMonster(): ?Monster
    {
        if ($this->isOnCooldown()) {
            return null;
        }

        $pool = $this->monsters()->get();

        if ($pool->isEmpty()) {
            return null;
        }

        $totalWeight = $pool->sum(fn ($monster) => $monster->pivot->weight);
        $roll = random_int(1, max($totalWeight, 1));

        $cumulative = 0;
        foreach ($pool as $monster) {
            $cumulative += $monster->pivot->weight;
            if ($roll <= $cumulative) {
                return $monster;
            }
        }

        return $pool->last();
    }
}
