<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Monster extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'level', 'type', 'element_id',
        'strong_against', 'weak_against',
        'hp', 'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'exp_reward', 'min_party_level',
        'special_skill_name', 'special_skill_description',
        'description', 'avatar_path',
    ];

    /**
     * Kombinasi pola combat yang valid: cara serang (close/range/area) x jenis damage (physical/magic).
     */
    public const COMBAT_PATTERNS = [
        'close_physical', 'range_physical', 'area_physical',
        'close_magic', 'range_magic', 'area_magic',
    ];

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }
}
