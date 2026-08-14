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
        'current_hp', 'current_stamina', 'current_mana', 'avatar_path', 'full_body_path', 'is_npc',
    ];

    protected $appends = ['avatar_url', 'full_body_url'];

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

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->avatar_path) : null;
    }

    public function getFullBodyUrlAttribute(): ?string
    {
        return $this->full_body_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->full_body_path) : null;
    }
}
