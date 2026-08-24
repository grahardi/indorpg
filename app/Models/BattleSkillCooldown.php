<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * 1 baris = 1 cooldown skill tertentu buat 1 battle_participant tertentu.
 * Gantiin kolom JSON battle_participants.skill_cooldowns yang lama (bagian
 * 67-68, dicurigai jadi sumber bug "cooldown cuma jalan pertama kali") -
 * sekarang tiap skill independen total, gak ada lagi 1 kolom gabungan yang
 * di-baca-ubah-simpan bareng-bareng.
 */
class BattleSkillCooldown extends Model
{
    protected $fillable = ['battle_participant_id', 'skill_id', 'used_at_seconds'];

    protected $casts = [
        'used_at_seconds' => 'float',
    ];
}
