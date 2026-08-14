<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameMap extends Model
{
    use HasFactory;

    protected $table = 'maps';

    protected $fillable = [
        'name', 'slug', 'description', 'min_level', 'max_level', 'background_path',
    ];

    public function spawnPoints(): HasMany
    {
        return $this->hasMany(SpawnPoint::class, 'map_id');
    }
}
