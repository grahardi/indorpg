<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Monster extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'level', 'class_rank', 'type', 'element_id',
        'strong_against', 'weak_against', 'weak_matchups', 'strong_matchups',
        'hp', 'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'agility', 'accuracy',
        'exp_reward', 'min_party_level',
        'special_skill_name', 'special_skill_description',
        'description', 'avatar_path', 'full_body_path',
    ];

    protected $casts = [
        'weak_matchups' => 'array',
        'strong_matchups' => 'array',
    ];

    /**
     * Kombinasi pola combat yang valid: cara serang (close/range/area) x jenis damage (physical/magic).
     */
    public const COMBAT_PATTERNS = [
        'close_physical', 'range_physical', 'area_physical',
        'close_magic', 'range_magic', 'area_magic',
    ];

    public const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }

    /**
     * Cek apakah serangan (combat_range + elemen skill) kena salah satu slot
     * weak/strong matchup monster ini, return multiplier damage-nya.
     * Weak matchup: damage x ratio (misal ratio 2 = 2x damage).
     * Strong matchup: damage x (1/ratio) (misal ratio 2 = setengah damage).
     * Slot dengan element_id null artinya cocok ke elemen APAPUN (cuma cek combat_range).
     * Slot dengan combat_range null dianggap gak aktif (belum diisi admin).
     */
    public function matchupMultiplier(string $combatRange, ?int $skillElementId): float
    {
        foreach ($this->weak_matchups ?? [] as $slot) {
            if ($this->slotMatches($slot, $combatRange, $skillElementId)) {
                return (float) ($slot['ratio'] ?? 1);
            }
        }

        foreach ($this->strong_matchups ?? [] as $slot) {
            if ($this->slotMatches($slot, $combatRange, $skillElementId)) {
                $ratio = (float) ($slot['ratio'] ?? 1);

                return $ratio > 0 ? 1 / $ratio : 1;
            }
        }

        return 1.0;
    }

    private function slotMatches(?array $slot, string $combatRange, ?int $skillElementId): bool
    {
        if (! $slot || empty($slot['combat_range'])) {
            return false;
        }

        if ($slot['combat_range'] !== $combatRange) {
            return false;
        }

        // Slot tanpa element_id = cocok ke elemen apapun (termasuk skill tanpa elemen).
        if (empty($slot['element_id'])) {
            return true;
        }

        return (int) $slot['element_id'] === $skillElementId;
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

        // Dulu dicek dari level >= map.max_level, tapi sekarang semua monster
        // level dasarnya disamain ke 1 (lihat MonsterRankSeeder) - "boss" sekarang
        // ditentukan dari class_rank (C ke atas dianggap tier atas/boss).
        $isBoss = in_array($this->class_rank, ['C', 'B', 'A', 'S'], true);
        $variant = $isBoss ? 'boss' : 'regular';

        return "/images/battle-backgrounds/{$theme}-{$variant}.jpg";
    }
}
