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
        'user_id', 'subclass_id', 'name', 'level', 'exp', 'total_exp', 'stat_points',
        'bonus_physical_damage', 'bonus_physical_defense',
        'bonus_magic_damage', 'bonus_magic_defense',
        'bonus_accuracy', 'bonus_evasion',
        'bonus_critical_hit', 'bonus_critical_luck',
        'current_hp', 'current_stamina', 'current_mana', 'avatar_path', 'full_body_path', 'is_npc', 'busy_until',
    ];

    protected $casts = [
        'busy_until' => 'datetime',
    ];

    protected $appends = [
        'avatar_url', 'full_body_url', 'is_busy',
        'leveled_physical_damage', 'leveled_physical_defense',
        'leveled_magic_damage', 'leveled_magic_defense',
        'effective_physical_damage', 'effective_physical_defense',
        'effective_magic_damage', 'effective_magic_defense',
        'effective_base_hp', 'effective_base_mp', 'effective_base_sp',
        'effective_mana_regen', 'effective_stamina_regen', 'effective_hp_regen',
        'effective_accuracy', 'effective_evasion',
        'effective_critical_hit', 'effective_critical_luck',
        'exp_for_current_level', 'exp_for_next_level',
    ];

    /**
     * 4 stat inti yang naik otomatis tiap level (bukan lagi upgrade manual).
     * Bonus stat yang masih bisa di-upgrade (pakai stat point gratis atau EXP).
     *
     * Catatan: "Agility" di-rename jadi "Accuracy" - fungsinya emang akurasi
     * nyerang (offense), bukan evasion (itu udah ada stat sendiri: Evasion).
     */
    public const CORE_LEVEL_STATS = ['physical_damage', 'physical_defense', 'magic_damage', 'magic_defense'];

    public const UPGRADABLE_STATS = [
        'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
        'accuracy', 'evasion', 'critical_hit', 'critical_luck',
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
            ->withPivot('unlocked_at', 'bonus_level')
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

    /**
     * Kenaikan stat inti otomatis tiap level, sebanding sama base value-nya di
     * subclass - jadi stat yang UDAH TINGGI di excel (misal Physical Attack
     * Berserker=45) naik CEPAT tiap level, sedangkan stat yang RENDAH (misal
     * Magic Attack Berserker=10) naik SANGAT LAMBAT. Gak perlu tabel growth
     * per-subclass terpisah - otomatis ngikutin profil excel yang udah ada.
     * Formula: floor(base * 10% * (level-1)). Level 1 = 0 (belum naik apa-apa).
     */
    public function levelGrowth(string $stat): int
    {
        $baseValue = $this->subclass->{"base_{$stat}"} ?? 0;

        return (int) floor($baseValue * 0.1 * ($this->level - 1));
    }

    public function getLeveledPhysicalDamageAttribute(): int
    {
        return $this->subclass->base_physical_damage + $this->levelGrowth('physical_damage');
    }

    public function getLeveledPhysicalDefenseAttribute(): int
    {
        return $this->subclass->base_physical_defense + $this->levelGrowth('physical_defense');
    }

    public function getLeveledMagicDamageAttribute(): int
    {
        return $this->subclass->base_magic_damage + $this->levelGrowth('magic_damage');
    }

    public function getLeveledMagicDefenseAttribute(): int
    {
        return $this->subclass->base_magic_defense + $this->levelGrowth('magic_defense');
    }

    public function getEffectivePhysicalDamageAttribute(): int
    {
        return $this->leveled_physical_damage + $this->bonus_physical_damage;
    }

    public function getEffectivePhysicalDefenseAttribute(): int
    {
        return $this->leveled_physical_defense + $this->bonus_physical_defense;
    }

    public function getEffectiveMagicDamageAttribute(): int
    {
        return $this->leveled_magic_damage + $this->bonus_magic_damage;
    }

    public function getEffectiveMagicDefenseAttribute(): int
    {
        return $this->leveled_magic_defense + $this->bonus_magic_defense;
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
        $ratio = \App\Models\GameSetting::getFloat('regen_ratio', 0.1);

        return max(1, (int) round($this->effective_base_mp * $ratio));
    }

    public function getEffectiveStaminaRegenAttribute(): int
    {
        $ratio = \App\Models\GameSetting::getFloat('regen_ratio', 0.1);

        return max(1, (int) round($this->effective_base_sp * $ratio));
    }

    /**
     * HP regen per ronde battle - sebelumnya HP GAK regen sama sekali (cuma
     * SP/MP). Formula: ratio x (Physical Defense + Magic Defense) = ratio x
     * Base HP (karena Base HP emang udah dihitung dari 2 stat itu). Rasio
     * bisa diatur admin di /admin/settings (default 10%).
     */
    public function getEffectiveHpRegenAttribute(): int
    {
        $ratio = \App\Models\GameSetting::getFloat('regen_ratio', 0.1);

        return max(1, (int) round($this->effective_base_hp * $ratio));
    }

    /**
     * Accuracy = akurasi nyerang (offense). Dulu namanya "Agility", di-rename
     * karena "Agility" bikin orang ngira ini evasion (padahal Evasion udah ada
     * stat sendiri).
     */
    public function getEffectiveAccuracyAttribute(): int
    {
        return $this->effective_physical_damage + $this->effective_magic_damage + $this->bonus_accuracy;
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
     * Biaya EXP buat nambah 1 poin ke stat tertentu (dipakai kalau stat_points
     * abis). Formula: (bonus_saat_ini + 1) * 15. Stat critical (persentase,
     * lebih powerful per poin) dikali biaya 25.
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

    /**
     * Stat point GRATIS yang didapat pas naik level (beda dari EXP yang bisa
     * dipotong). +5 per level biasa, +10 kalau level-nya kelipatan 5 (5,10,15,dst).
     * Dipakai buat nambah Bonus Stats tanpa perlu bayar EXP.
     */
    public static function statPointsForLevel(int $level): int
    {
        return $level % 5 === 0 ? 10 : 5;
    }

    /**
     * Total stat point yang didapat dari naik level $fromLevel -> $toLevel
     * (bisa lompat lebih dari 1 level kalau EXP reward-nya gede).
     */
    public function statPointsEarnedBetween(int $fromLevel, int $toLevel): int
    {
        $total = 0;
        for ($lvl = $fromLevel + 1; $lvl <= $toLevel; $lvl++) {
            $total += self::statPointsForLevel($lvl);
        }

        return $total;
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
