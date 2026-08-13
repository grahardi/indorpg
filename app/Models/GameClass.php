<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'name', 'slug', 'description', 'base_hp', 'base_stamina', 'base_mana',
    ];

    public function subclasses(): HasMany
    {
        return $this->hasMany(Subclass::class, 'class_id');
    }
}
