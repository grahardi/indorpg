<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Character extends Model
{
    use HasFactory;

    protected $fillable = [
        'subclass_id', 'name', 'level', 'exp',
        'current_hp', 'current_stamina', 'current_mana', 'avatar_path',
    ];

    public function subclass(): BelongsTo
    {
        return $this->belongsTo(Subclass::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'character_skills')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }
}
