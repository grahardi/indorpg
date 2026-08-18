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
        'agility', 'accuracy',
        'exp_reward', 'min_party_level',
        'special_skill_name', 'special_skill_description',
        'description', 'avatar_path', 'full_body_path',
    ];

    protected $appends = ['level_rank'];

    /**
     * Kombinasi pola combat yang valid: cara serang (close/range/area) x jenis damage (physical/magic).
     */
    public const COMBAT_PATTERNS = [
        'close_physical', 'range_physical', 'area_physical',
        'close_magic', 'range_magic', 'area_magic',
    ];

    /**
     * Rank huruf (E terlemah - S terkuat) buat tampilan publik (Bestiary,
     * preview sebelum battle) - level angka SEBENARNYA acak tiap encounter
     * (lihat BattleService::rollMonsterLevel), jadi nunjukkin angka level
     * statis di sini bisa menyesatkan (janji level yang gak sesuai battle
     * beneran). Level angka pasti cuma ditampilin di DALAM battle (udah akurat)
     * dan di admin panel (buat editing).
     */
    public function getLevelRankAttribute(): string
    {
        return match (true) {
            $this->level >= 17 => 'S',
            $this->level >= 12 => 'A',
            $this->level >= 8 => 'B',
            $this->level >= 5 => 'C',
            $this->level >= 3 => 'D',
            default => 'E',
        };
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }

    public function spawnPoints(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(SpawnPoint::class, 'spawn_point_monster')
            ->withPivot('weight')
            ->withTimestamps();
    }

    /**
     * Background arena battle: tema (forest/ruins) diambil dari map tempat
     * monster ini muncul (sama kayak background avatar/full view), varian
     * "boss" dipakai kalau level monster ini level TERTINGGI di map itu.
     */
    public function battleBackgroundPath(): string
    {
        $map = $this->relationLoaded('spawnPoints')
            ? $this->spawnPoints->first()?->map
            : $this->spawnPoints()->with('map')->first()?->map;

        $theme = 'forest';
        if ($map && str_contains($map->name, 'Reruntuhan')) {
            $theme = 'ruins';
        }

        $isBoss = $map && $this->level >= $map->max_level;
        $variant = $isBoss ? 'boss' : 'regular';

        return "/images/battle-backgrounds/{$theme}-{$variant}.jpg";
    }
}
