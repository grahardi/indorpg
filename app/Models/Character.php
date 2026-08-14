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
        'user_id', 'subclass_id', 'name', 'level', 'exp', 'total_exp',
        'bonus_physical_damage', 'bonus_physical_defense',
        'bonus_magic_damage', 'bonus_magic_defense',
        'bonus_agility', 'bonus_evasion',
        'bonus_critical_hit', 'bonus_critical_luck',
        'current_hp', 'current_stamina', 'current_mana', 'avatar_path', 'full_body_path', 'is_npc', 'busy_until',
    ];

    protected $casts = [
        'busy_until' => 'datetime',
    ];

    protected $appends = [
        'avatar_url', 'full_body_url', 'is_busy',
        'effective_physical_damage', 'effective_physical_defense',
        'effective_magic_damage', 'effective_magic_defense',
        'effective_base_hp', 'effective_base_mp', 'effective_base_sp',
        'effective_mana_regen', 'effective_stamina_regen',
        'effective_agility', 'effective_evasion',
        'effective_critical_hit', 'effective_critical_luck',
        'exp_for_current_level', 'exp_for_next_level',
    ];

    /**
     * Biaya EXP buat upgrade 1 poin stat tertentu. Naik tiap kali udah pernah
     * di-upgrade (semakin banyak bonus yang udah ada, semakin mahal poin berikutnya).
     */
    public const UPGRADABLE_STATS = [
        'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'agility', 'evasion', 'critical_hit', 'critical_luck',
    ];

    public function subclass(): BelongsTo
    {
        return $this->belongsTo(Subclass::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    public function getEffectivePhysicalDamageAttribute(): int
    {
        return $this->subclass->base_physical_damage + $this->bonus_physical_damage;
    }

    public function getEffectivePhysicalDefenseAttribute(): int
    {
        return $this->subclass->base_physical_defense + $this->bonus_physical_defense;
    }

    public function getEffectiveMagicDamageAttribute(): int
    {
        return $this->subclass->base_magic_damage + $this->bonus_magic_damage;
    }

    public function getEffectiveMagicDefenseAttribute(): int
    {
        return $this->subclass->base_magic_defense + $this->bonus_magic_defense;
    }

    public function getEffectiveBaseHpAttribute(): int
    {
        return $this->effective_physical_defense + $this->effective_magic_defense;
    }

    public function getEffectiveBaseMpAttribute(): int
    {
        return $this->effective_magic_damage + $this->effective_magic_defense;
    }

    public function getEffectiveBaseSpAttribute(): int
    {
        return $this->effective_physical_damage + $this->effective_physical_defense;
    }

    public function getEffectiveManaRegenAttribute(): int
    {
        return max(1, (int) round($this->effective_base_mp * 0.1));
    }

    public function getEffectiveStaminaRegenAttribute(): int
    {
        return max(1, (int) round($this->effective_base_sp * 0.1));
    }

    public function getEffectiveAgilityAttribute(): int
    {
        return $this->effective_physical_damage + $this->effective_magic_damage + $this->bonus_agility;
    }

    public function getEffectiveEvasionAttribute(): int
    {
        return $this->effective_physical_defense + $this->effective_magic_defense + $this->bonus_evasion;
    }

    public function getEffectiveCriticalHitAttribute(): int
    {
        return $this->subclass->critical_hit_bonus + $this->bonus_critical_hit;
    }

    public function getEffectiveCriticalLuckAttribute(): int
    {
        return $this->subclass->critical_luck + $this->bonus_critical_luck;
    }

    /**
     * Biaya EXP buat nambah 1 poin ke stat tertentu. Formula: (bonus_saat_ini + 1) * 15.
     * Stat critical (persentase, lebih powerful per poin) dikali biaya 25.
     */
    public function upgradeCost(string $stat): int
    {
        $currentBonus = $this->{"bonus_{$stat}"} ?? 0;
        $multiplier = in_array($stat, ['critical_hit', 'critical_luck'], true) ? 25 : 15;

        return ($currentBonus + 1) * $multiplier;
    }

    /**
     * Total EXP kumulatif (bukan exp yang bisa dipotong buat upgrade) yang
     * dibutuhkan buat NYAMPE level tertentu. Formula: 100 * (level-1)^1.6,
     * dibulatkan. Level 2 = 100, level 3 = ~303, level 4 = ~580, dst -
     * naik makin curam tiap level (makin tinggi makin susah).
     */
    public static function totalExpRequiredForLevel(int $level): int
    {
        if ($level <= 1) {
            return 0;
        }

        return (int) round(100 * ($level - 1) ** 1.6);
    }

    /**
     * Hitung level yang seharusnya berdasarkan total_exp saat ini.
     */
    public function calculateLevelFromTotalExp(): int
    {
        $level = 1;
        while (self::totalExpRequiredForLevel($level + 1) <= $this->total_exp) {
            $level++;
        }

        return $level;
    }

    /**
     * Naikkan level kalau total_exp udah cukup. Dipanggil abis dapat EXP dari battle.
     * Return true kalau naik level.
     */
    public function syncLevel(): bool
    {
        $newLevel = $this->calculateLevelFromTotalExp();
        if ($newLevel > $this->level) {
            $this->level = $newLevel;

            return true;
        }

        return false;
    }

    public function getExpForCurrentLevelAttribute(): int
    {
        return self::totalExpRequiredForLevel($this->level);
    }

    public function getExpForNextLevelAttribute(): int
    {
        return self::totalExpRequiredForLevel($this->level + 1);
    }

    public function getIsBusyAttribute(): bool
    {
        return $this->busy_until !== null && $this->busy_until->isFuture();
    }
}
