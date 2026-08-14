<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subclass extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id', 'element_id', 'name', 'slug', 'power_type',
        'description', 'flavor_bonus', 'avatar_path', 'full_body_path',
        'base_physical_damage', 'base_physical_defense',
        'base_magic_damage', 'base_magic_defense',
        'critical_hit_bonus', 'critical_luck',
    ];

    /**
     * Stat "auto" (Base HP/MP/SP, Regen, Agility, Evasion) sengaja gak disimpan
     * sebagai kolom - dihitung langsung dari 4 stat inti (physical/magic
     * damage/defense) yang udah ada, sesuai instruksi "base stats ambil dari
     * char yang sudah kita bikin". $appends biar otomatis ikut ke JSON/props.
     */
    protected $appends = [
        'base_hp', 'base_mp', 'base_sp',
        'mana_regen', 'stamina_regen',
        'agility', 'evasion',
    ];

    public function gameClass(): BelongsTo
    {
        return $this->belongsTo(GameClass::class, 'class_id');
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(Element::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class);
    }

    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    public function getBaseHpAttribute(): int
    {
        return $this->base_physical_defense + $this->base_magic_defense;
    }

    public function getBaseMpAttribute(): int
    {
        return $this->base_magic_damage + $this->base_magic_defense;
    }

    public function getBaseSpAttribute(): int
    {
        return $this->base_physical_damage + $this->base_physical_defense;
    }

    /**
     * Regen per ronde = 10% dari pool terkait (MP/SP), dibulatkan, minimal 1.
     * Angka "10%" ini keputusan saya sendiri biar regen gak langsung ngisi
     * penuh 1 ronde - formula bisa disesuaikan lagi kalau kerasa kurang pas.
     */
    public function getManaRegenAttribute(): int
    {
        return max(1, (int) round($this->base_mp * 0.1));
    }

    public function getStaminaRegenAttribute(): int
    {
        return max(1, (int) round($this->base_sp * 0.1));
    }

    public function getAgilityAttribute(): int
    {
        return $this->base_physical_damage + $this->base_magic_damage;
    }

    public function getEvasionAttribute(): int
    {
        return $this->base_physical_defense + $this->base_magic_defense;
    }
}
