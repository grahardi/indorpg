<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Encounter extends Model
{
    use HasFactory;

    protected $fillable = ['spawn_point_id', 'monster_id', 'status'];

    public function spawnPoint(): BelongsTo
    {
        return $this->belongsTo(SpawnPoint::class);
    }

    public function monster(): BelongsTo
    {
        return $this->belongsTo(Monster::class);
    }
}
