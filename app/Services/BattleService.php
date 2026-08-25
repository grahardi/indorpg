<?php

namespace App\Services;

use App\Models\Battle;
use App\Models\BattleParticipant;
use App\Models\BattleSkillCooldown;
use App\Models\Character;
use App\Models\Encounter;
use App\Models\GameSetting;
use App\Models\Monster;
use App\Models\Skill;
use Illuminate\Support\Collection;

class BattleService
{
    private const MAX_ROUNDS = 20; // safety cap biar gak infinite loop (dipakai mode Auto doang)

    // Cap WAKTU ASLI (detik) buat mode Manual - bukan jumlah aksi (lihat bug fix
    // di processManualTurn). 300 detik = 5 menit, cukup panjang buat battle wajar.
    private const MAX_MANUAL_BATTLE_SECONDS = 300;

    /**
     * Mulai battle baru dari sebuah Encounter + karakter yang dipilih (2-3 orang),
     * langsung auto-resolve sampai selesai (semi-auto: player cuma pilih party,
     * pertarungan jalan otomatis).
     */
    public function startBattle(Encounter $encounter, array $characterIds, ?int $frontmanCharacterId = null, string $mode = 'auto'): Battle
    {
        $monster = $encounter->monster;
        $characters = Character::with(['subclass.skills', 'skills', 'items'])->whereIn('id', $characterIds)->get();

        // Level tertinggi PLAYER (bukan NPC) di party - jadi patokan level
        // monster MAUPUN level NPC (NPC gak punya level sendiri yang berarti,
        // ngikutin kekuatan party).
        $playerCharacters = $characters->where('is_npc', false);
        $partyMaxLevel = (int) ($playerCharacters->max('level') ?: 1);

        $encounterLevel = $this->rollMonsterLevel($monster, $partyMaxLevel);
        $scaledStats = $this->scaledMonsterStats($monster, $encounterLevel);

        $battle = Battle::create([
            'encounter_id' => $encounter->id,
            'monster_id' => $monster->id,
            // Cuma valid kalau beneran salah satu karakter yang dipilih di party ini.
            'frontman_character_id' => in_array($frontmanCharacterId, $characterIds) ? $frontmanCharacterId : null,
            'monster_level' => $encounterLevel,
            'monster_stats' => $scaledStats,
            'monster_current_hp' => $scaledStats['hp'],
            'status' => 'ongoing',
            'round_number' => 1,
            'battle_log' => [],
            'mode' => in_array($mode, ['auto', 'manual']) ? $mode : 'auto',
        ]);

        foreach ($characters as $character) {
            $loadout = $this->resolveLoadout($character);
            $loadoutIds = $loadout->pluck('id')->toArray();

            // Ultimate (tier 3) sengaja di-set udah "dipakai" di ronde 0, jadi dari
            // awal battle langsung cooldown - gak bisa langsung ultimate di ronde 1.
            $initialCooldowns = $loadout
                ->where('tier', 3)
                ->mapWithKeys(fn ($skill) => [$skill->id => 0])
                ->toArray();

            // NPC "diset kayak monster": gak punya level/progress permanen, level
            // asli di-roll dinamis tiap battle (level tertinggi PLAYER di party ±
            // variance random, setting admin), stat-nya di-scale pakai rasio
            // admin dari base level 1. Selalu mulai battle full HP/SP/MP (gak
            // numpuk capek/tumbang antar battle kayak karakter pemain).
            $npcLevel = null;
            $npcSnapshot = null;
            if ($character->is_npc) {
                $npcLevel = $character->resolveNpcLevel($partyMaxLevel);
                $npcSnapshot = $this->npcScaledStats($character, $npcLevel);
            }

            $newParticipant = BattleParticipant::create([
                'battle_id' => $battle->id,
                'character_id' => $character->id,
                'current_hp' => $character->is_npc ? $npcSnapshot['base_hp'] : $character->current_hp,
                'current_stamina' => $character->is_npc ? $npcSnapshot['base_sp'] : $character->current_stamina,
                'current_mana' => $character->is_npc ? $npcSnapshot['base_mp'] : $character->current_mana,
                'skill_cooldowns' => $initialCooldowns,
                'loadout_skill_ids' => $loadoutIds,
                'npc_encounter_level' => $npcLevel,
                'npc_stat_snapshot' => $npcSnapshot,
                // BUG FIX: sebelumnya selalu true, jadi karakter pemain yang tumbang
                // (current_hp 0 dari battle sebelumnya) tetap dianggap "hidup" dan
                // ikut nyerang lagi di battle baru. Sekarang dicek dari HP asli.
                // NPC selalu mulai fresh (full HP), jadi selalu true.
                'is_alive' => $character->is_npc ? true : $character->current_hp > 0,
            ]);

            // Seed juga ke tabel cooldown DEDICATED (mode Manual baca dari sini,
            // bukan kolom skill_cooldowns lama lagi - itu cuma dipakai mode Auto).
            // used_at_seconds=0 = "dipakai detik ke-0", jadi dari awal battle
            // ultimate langsung kekunci selama cooldown_seconds penuh.
            foreach (array_keys($initialCooldowns) as $ultiSkillId) {
                $this->recordCooldownUsed($newParticipant, (int) $ultiSkillId, 0.0);
            }
        }

        // Mode auto: sepenuhnya di-resolve server sekarang juga (kayak sebelumnya).
        // Mode manual: battle-nya DIBIARKAN ongoing, player kontrol lewat
        // BattleController::act() satu giliran per request HTTP.
        if ($battle->mode === 'manual') {
            $battle->battle_log = [$this->snapshot($battle, "{$monster->name} (Lv.{$battle->monster_level}) muncul menghadang!")];
            $battle->save();

            return $battle->fresh(['participants.character.subclass', 'monster']);
        }

        return $this->autoResolve($battle);
    }

    /**
     * Level monster buat encounter ini: acak antara level dasar monster (di
     * tabel monsters, sekarang selalu 1) sampai (level tertinggi PLAYER + bonus
     * admin). Kalau level dasar monster udah lebih tinggi dari batas atas itu,
     * ya pakai level dasarnya aja (gak pernah di-downgrade).
     */
    /**
     * BUG FIX: sebelumnya roll dari $monster->level (base, SELALU 1 sekarang)
     * sampai $partyMaxLevel+$bonus - rentangnya kelewat lebar. Party level 16
     * misalnya, roll random_int(1, 19) BISA aja keluar level 3 (trivial banget,
     * "langsung KO" sesuai laporan user) walau party udah tinggi. Fix: range-nya
     * simetris di SEKITAR level party (party-bonus sampai party+bonus), persis
     * kayak pola NPC (partyMaxLevel ± variance) - clamp minimal ke level dasar
     * monster (biasanya 1) biar gak pernah di bawah nol/negatif.
     */
    private function rollMonsterLevel(Monster $monster, int $partyMaxLevel): int
    {
        $bonus = GameSetting::getInt('monster_level_variance', 3);
        $minLevel = max($monster->level, $partyMaxLevel - $bonus);
        $maxLevel = max($monster->level, $partyMaxLevel + $bonus);

        return random_int($minLevel, $maxLevel);
    }

    /**
     * Scale stat monster (hp, damage, defense, exp_reward) dari level dasarnya
     * ke level encounter, pakai rasio LINEAR (bukan kompon berlapis - itu bug
     * kritis yang sempat ada, sama kayak yang ketauan di skill damage, cuma
     * lebih parah: party level 13 + bonus 3 = monster bisa di-roll level 16,
     * exponent 15 -> 1.5^15 ≈ 437x lipat stat! Monster jadi gak seimbang total
     * dibanding player yang growth-nya udah dibikin linear).
     * Agility/accuracy/strong-weak GAK di-scale (persentase/pola combat, bukan power).
     */
    /**
     * Scale stat monster dari level dasarnya ke level encounter - dipisah jadi
     * 2 rasio INDEPENDEN (bukan 1 rasio buat semuanya kayak sebelumnya): HP
     * (+defense+reward, "seberapa tahan/berharga") sama Damage ("seberapa
     * sakit mukulnya"). Alasan dipisah: kalau 1 rasio dipakai bareng, admin
     * gak bisa nyetel HP tinggi tanpa ikut bikin damage-nya juga tinggi (atau
     * sebaliknya) - rasio kecil = monster cepet mati, rasio gede = player
     * kena 1 hit. Sekarang bisa disetel independen.
     */
    public function scaledMonsterStats(Monster $monster, int $targetLevel): array
    {
        $hpRatio = GameSetting::getFloat('monster_hp_growth_ratio', 1.5);
        $damageRatio = GameSetting::getFloat('monster_damage_growth_ratio', 1.5);
        $levelDiff = $targetLevel - $monster->level;
        $hpFactor = 1 + (($hpRatio - 1) * $levelDiff);
        $damageFactor = 1 + (($damageRatio - 1) * $levelDiff);

        return [
            'level' => $targetLevel,
            'hp' => max(1, (int) round($monster->hp * $hpFactor)),
            'physical_damage' => max(1, (int) round($monster->physical_damage * $damageFactor)),
            'physical_defense' => max(0, (int) round($monster->physical_defense * $hpFactor)),
            'magic_damage' => max(1, (int) round($monster->magic_damage * $damageFactor)),
            'magic_defense' => max(0, (int) round($monster->magic_defense * $hpFactor)),
            'exp_reward' => max(1, (int) round($monster->exp_reward * $hpFactor)),
            'gold_reward' => max(1, (int) round($monster->gold_reward * $hpFactor)),
        ];
    }

    /**
     * Level NPC buat battle ini: level tertinggi PLAYER di party, +/- variance
     * random (setting admin, default 2). Minimal 1.
     */
    /**
     * Scale stat NPC dari base level 1 ke level encounter yang di-roll, pakai
     * rasio LINEAR (bukan kompon berlapis, sama alasannya kayak monster di
     * atas - biar konsisten & gak explode di level tinggi). Base HP/SP/MP
     * dihitung ulang dari physical/magic defense+damage yang udah di-scale,
     * regen juga ikut pakai rasio regen yang sama kayak karakter pemain.
     */
    private function npcScaledStats(Character $character, int $encounterLevel): array
    {
        $ratio = GameSetting::getFloat('npc_level_growth_ratio', 1.3);
        $factor = 1 + (($ratio - 1) * ($encounterLevel - 1)); // NPC base level selalu 1

        $physicalDamage = max(1, (int) round($character->leveled_physical_damage * $factor)) + $character->bonus_physical_damage;
        $physicalDefense = max(0, (int) round($character->leveled_physical_defense * $factor)) + $character->bonus_physical_defense;
        $magicDamage = max(1, (int) round($character->leveled_magic_damage * $factor)) + $character->bonus_magic_damage;
        $magicDefense = max(0, (int) round($character->leveled_magic_defense * $factor)) + $character->bonus_magic_defense;

        $baseHp = $physicalDefense + $magicDefense;
        $baseMp = $magicDamage + $magicDefense;
        $baseSp = $physicalDamage + $physicalDefense;
        $regenRatio = GameSetting::getFloat('regen_ratio', 0.1);

        return [
            'level' => $encounterLevel,
            'physical_damage' => $physicalDamage,
            'physical_defense' => $physicalDefense,
            'magic_damage' => $magicDamage,
            'magic_defense' => $magicDefense,
            'base_hp' => $baseHp,
            'base_mp' => $baseMp,
            'base_sp' => $baseSp,
            'hp_regen' => max(1, (int) round($baseHp * $regenRatio)),
            'mana_regen' => max(1, (int) round($baseMp * $regenRatio)),
            'stamina_regen' => max(1, (int) round($baseSp * $regenRatio)),
        ];
    }

    /**
     * Ambil stat combat participant - dari snapshot NPC (kalau ini NPC) atau
     * dari effective_* karakter biasa (kalau player). Nyatuin logic biar gak
     * cabang if/else NPC-vs-player berulang-ulang di autoResolve().
     */
    private function combatStat(BattleParticipant $participant, string $stat): float
    {
        if ($participant->npc_stat_snapshot && array_key_exists($stat, $participant->npc_stat_snapshot)) {
            return (float) $participant->npc_stat_snapshot[$stat];
        }

        $accessor = 'effective_'.$stat;

        return (float) $participant->character->{$accessor};
    }

    /**
     * Loadout tempur = 4 skill tier 1 + 1 skill tier 3 (ultimate). Kalau karakter
     * udah punya loadout manual (via character_skills pivot, diatur di halaman
     * profil), pakai itu. Kalau belum (NPC atau karakter yang belum di-setting),
     * random 4+1 dari skill pool subclass-nya - biar tetap kepake buat level rendah.
     */
    private function resolveLoadout(Character $character): \Illuminate\Support\Collection
    {
        if ($character->skills->count() === 5) {
            return $character->skills;
        }

        $pool = $character->subclass->skills;
        $tier1 = $pool->where('tier', 1)->shuffle()->take(4);
        $tier3 = $pool->where('tier', 3)->shuffle()->take(1);

        return $tier1->concat($tier3);
    }

    /**
     * Poin skill point allocation yang udah diinvest character ini ke skill
     * tertentu (cuma ada kalau skill itu ada di loadout MANUAL-nya, character_skills
     * pivot - skill random per-battle gak punya allocation, dianggap 0).
     */
    private function skillBonusLevel(Character $character, Skill $skill): int
    {
        $pivotSkill = $character->skills->firstWhere('id', $skill->id);

        return $pivotSkill?->pivot?->bonus_level ?? 0;
    }

    /**
     * Stat combat skill yang BENERAN dipakai di battle - base_multiplier skill
     * di-scale OTOMATIS sesuai level karakter (rasio admin, default 1.3) - gak
     * butuh aksi player. Cooldown TIDAK ikut naik dari level, mana/stamina cost
     * juga TETAP di base (lihat catatan di bawah).
     *
     * DI ATAS itu, ada "skill point allocation" (manual, per-skill, lihat
     * skillBonusLevel()): tiap poin nambah +0.1% damage & -0.1% cooldown skill itu
     * (floor cooldown di 20% dari aslinya biar gak jadi instan 0 detik).
     */
    private function skillCombatStats(Character $character, Skill $skill): array
    {
        $levelRatio = GameSetting::getFloat('skill_level_growth_ratio', 1.3);
        // BUG FIX KRITIS: sebelumnya levelFactor = $levelRatio ** (level-1) -
        // KOMPON BERLAPIS EKSPONENSIAL. Contoh yang dikasih dulu (damage 20
        // jadi 26 di level 2) itu match, TAPI begitu naik ke level tinggi,
        // exponential explode - level 13 = 1.3^12 ≈ 23x lipat! Digabung sama
        // offense stat yang udah gede + crit + efektivitas elemen, damage bisa
        // tembus belasan ribu ke monster yang harusnya biasa aja (dilaporkan
        // user: 13372 damage). Fix: growth linear, bukan eksponensial - level 2
        // TETAP persis 1.3x (sesuai contoh awal), tapi level 13 cuma ~4.6x
        // (1 + 0.3*12), bukan 23x. Konsisten juga sama levelGrowth() karakter
        // sendiri yang emang linear dari awal, bukan eksponensial.
        $levelFactor = 1 + (($levelRatio - 1) * ($character->level - 1));

        $bonusLevel = $this->skillBonusLevel($character, $skill);
        $allocFactor = 1 + ($bonusLevel * 0.001);
        $cooldownFactor = max(0.2, 1 - ($bonusLevel * 0.001));

        return [
            'multiplier' => (float) $skill->base_multiplier * $levelFactor * $allocFactor,
            // Mana/stamina cost TETAP di base value skill (gak ikut naik dari
            // level) - kalau ikut discale, biayanya numpuk lebih cepet dari
            // pool MP/SP yang tersedia, karakter jadi gak mampu bayar skill
            // apapun di level tinggi ("skip" terus).
            'mana_cost' => $skill->mana_cost,
            'stamina_cost' => $skill->stamina_cost,
            'cooldown_seconds' => max(1, (int) round($skill->cooldown_seconds * $cooldownFactor)),
        ];
    }

    /**
     * Satu participant pakai 1 skill - dipisah jadi method sendiri (dulu inline
     * di loop) biar bisa dipanggil dari 2 tempat: auto-resolve (loop biasa)
     * DAN mode manual (1 aksi per request HTTP dari player). Logic-nya PERSIS
     * sama, gak ada yang berubah - cuma direlokasi biar reusable.
     */
    private function executeParticipantSkill(Battle $battle, BattleParticipant $participant, Skill $skill, array &$log): void
    {
        $monster = $battle->monster;
        $stats = $battle->monster_stats;
        $character = $participant->character;
        $skillStats = $this->skillCombatStats($character, $skill);

        $participant->current_stamina = max(0, $participant->current_stamina - $skillStats['stamina_cost']);
        $participant->current_mana = max(0, $participant->current_mana - $skillStats['mana_cost']);

        // === HEAL: gak nyerang monster sama sekali, nambah HP/MP/SP teman.
        // Basis kekuatan heal = Magic Attack pemberi (sama kayak Buff -
        // itu basis buff/serangan). combat_range='area' -> semua yang hidup
        // ikut disembuhin, bukan cuma 1 target ===
        if ($skill->buff_type === 'heal') {
            $isAreaHeal = $skill->combat_range === 'area';
            $targets = $isAreaHeal
                ? $battle->participants->where('is_alive', true)
                : collect([$this->pickHealTarget($battle, $skill)])->filter();

            if ($targets->isEmpty()) {
                $participant->save();
                $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name}, tapi gak ada yang perlu disembuhin.", $character->id, $skill->id);

                return;
            }

            // Sama kayak damage biasa: multiplier skill CUMA ngefek ke base
            // Magic Attack (subclass+level), bonus stat point/item ditambah
            // flat - biar gak numpuk perkalian sama growth level skill.
            $healPower = $character->is_npc
                ? $this->combatStat($participant, 'magic_damage') * $skillStats['multiplier']
                : ($character->leveled_magic_damage * $skillStats['multiplier']) + $character->bonus_magic_damage + $character->itemBonus('magic_damage');
            $healAmount = max(1, (int) round($healPower));
            $resource = $skill->heal_resource ?? 'hp';
            $resourceLabel = strtoupper($resource);
            $healedNames = [];
            $firstHealTarget = null;
            $firstHealAmount = null;

            foreach ($targets as $target) {
                [$before, $max] = $this->resourceLevel($target, $resource);
                $after = min($max, $before + $healAmount);
                $actualHeal = $after - $before;

                match ($resource) {
                    'mp' => $target->current_mana = $after,
                    'sp' => $target->current_stamina = $after,
                    default => $target->current_hp = $after,
                };
                $target->save();
                $healedNames[] = "{$target->character->name} (+{$actualHeal})";
                if ($firstHealTarget === null) {
                    $firstHealTarget = $target->character_id;
                    $firstHealAmount = $actualHeal;
                }
            }
            if (! $targets->contains('id', $participant->id)) {
                $participant->save();
            }

            $namesText = implode(', ', $healedNames);
            $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name} ke {$namesText} {$resourceLabel}", $character->id, $skill->id, false, [
                'type' => 'heal',
                'value' => $firstHealAmount,
                'target' => $firstHealTarget,
            ]);

            return;
        }

        // === BUFF: nambah daya serang ally buat serangan BERIKUTNYA
        // (one-shot, dikonsumsi pas dia nyerang, abis itu reset). Basis
        // kekuatan = Magic Attack pemberi buff (45 magic attack = +45%
        // damage, biar Magic Attack ada gunanya buat karakter support
        // juga, gak cuma buat nyerang langsung). combat_range='area' ->
        // semua yang hidup kebagian buff. ===
        if ($skill->buff_type === 'buff') {
            $buffStat = $skill->buff_stat ?? 'attack';
            $isAreaBuff = $skill->combat_range === 'area';
            $alive = $battle->participants->where('is_alive', true);

            if ($isAreaBuff) {
                $targets = $alive;
            } elseif ($buffStat === 'defense') {
                // Buff defense single-target: prioritas ke yang HP-nya
                // paling kepotong (paling butuh perlindungan).
                $targets = collect([$this->pickHealTarget($battle, $skill)])->filter();
            } else {
                // Buff attack single-target: kasih ke attacker terkuat di party.
                $targets = collect([$alive->sortByDesc(fn ($p) => $this->combatStat($p, 'physical_damage') + $this->combatStat($p, 'magic_damage'))->first()])->filter();
            }

            // Sama kayak damage/heal: multiplier skill CUMA ngefek ke base
            // Magic Attack, bonus stat point/item ditambah flat.
            $bonusPercent = $character->is_npc
                ? $this->combatStat($participant, 'magic_damage') * $skillStats['multiplier']
                : ($character->leveled_magic_damage * $skillStats['multiplier']) + $character->bonus_magic_damage + $character->itemBonus('magic_damage');
            $buffMultiplier = 1 + ($bonusPercent / 100);
            $bonusRounded = round($bonusPercent);
            $buffedNames = [];

            foreach ($targets as $target) {
                $target->buff_multiplier = $buffMultiplier;
                $target->buff_stat = $buffStat;
                $target->save();
                $buffedNames[] = $target->character->name;
            }
            if (! $targets->contains('id', $participant->id)) {
                $participant->save();
            }

            $namesText = implode(', ', $buffedNames);
            $verb = $buffStat === 'defense' ? 'defense-nya naik' : 'serangan berikutnya';
            $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name} ke {$namesText}: {$verb} +{$bonusRounded}%!", $character->id, $skill->id);

            return;
        }

        // === NERF: gak nyerang langsung, cuma nge-debuff monster (hit
        // BERIKUTNYA ke monster, siapapun yang mukul, kena dikali multiplier
        // skill ini - one-shot, abis dipakai sekali langsung reset) ===
        if ($skill->buff_type === 'nerf') {
            $participant->save();
            $battle->monster_debuff_multiplier = $skillStats['multiplier'];
            $log[] = $this->snapshot($battle, "{$character->name} pakai {$skill->name}: serangan berikutnya ke {$monster->name} jadi {$skillStats['multiplier']}x damage!", $character->id, $skill->id);

            return;
        }

        // === SERANGAN BIASA (buff_type = 'none', default) ===
        // Cek Accuracy (ofensif) vs evasion bawaan monster - bisa meleset total.
        // Accuracy/critical GAK di-scale NPC (sama kayak monster: cuma power
        // stat yang naik, bukan akurasi/crit).
        $hitChance = max(50, min(99, 100 + $character->effective_accuracy - 90 - $monster->agility));
        $roll = random_int(1, 100);
        if ($roll > $hitChance) {
            $participant->save();
            // DIAGNOSTIK SEMENTARA: tampilin angka mentahnya di log (roll, hit
            // chance, accuracy, agility monster) - biar kelihatan JELAS ini
            // emang sial normal (roll dikit di atas hitChance yang wajar) atau
            // beneran bug kalkulasi (misal hitChance ke-itung absurd rendah).
            $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: MELESET! (roll {$roll} vs {$hitChance}% | ACC {$character->effective_accuracy} vs AGI monster {$monster->agility})", $character->id, $skill->id, false, ['type' => 'miss', 'target' => 'monster']);

            return;
        }

        // Rasio campuran physical/magic (0-100) - kalau skill belum di-set
        // physical_ratio manual, fallback ke scaling_stat lama (100%
        // physical ATAU 100% magic, biar backward compatible).
        $physicalRatio = $skill->resolvedPhysicalRatio() / 100;
        $defenseStat = ($stats['physical_defense'] * $physicalRatio) + ($stats['magic_defense'] * (1 - $physicalRatio));

        // BUG FIX PENTING: sebelumnya SELURUH offense stat (base + bonus
        // stat point + bonus item) ikut dikaliin sama skillStats['multiplier']
        // (yang levelnya sendiri udah naik dari level karakter). Efeknya 2
        // sistem growth NUMPUK SECARA PERKALIAN (bukan cuma dijumlah) - kalau
        // karakter udah invest banyak stat point + item (misal +44+68=112 dari
        // total 175 Physical Attack), bonus segede itu ikut kelipatgandain sama
        // skill multiplier juga, hasilnya damage meledak jauh di atas wajar.
        // Fix: skill multiplier CUMA ngefek ke base stat (subclass + level
        // growth doang), bonus stat point/item/elemental ditambah FLAT di luar
        // perkalian - biar investasi ke stat point/item kerasa proporsional,
        // gak ikut "digandakan" sama pertumbuhan level skill.
        if ($participant->npc_stat_snapshot) {
            // NPC snapshot udah nilai final (NPC gak pernah punya stat point/item
            // ekstra by design), jadi tetap dikaliin utuh apa adanya.
            $offenseStat = ($this->combatStat($participant, 'physical_damage') * $physicalRatio)
                + ($this->combatStat($participant, 'magic_damage') * (1 - $physicalRatio));
            $raw = $offenseStat * $skillStats['multiplier'];
        } else {
            $baseStat = ($character->leveled_physical_damage * $physicalRatio) + ($character->leveled_magic_damage * (1 - $physicalRatio));
            $bonusStat = (($character->bonus_physical_damage + $character->itemBonus('physical_damage')) * $physicalRatio)
                + (($character->bonus_magic_damage + $character->itemBonus('magic_damage')) * (1 - $physicalRatio));
            $raw = ($baseStat * $skillStats['multiplier']) + $bonusStat;
        }

        // Item elemental (misal "+fire damage") - juga FLAT, gak ikut dikali
        // multiplier skill (sama alasannya kayak bonus stat point/item di atas).
        $raw += $character->elementalDamageBonus($skill->element_id);

        $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);

        $note = '';
        $matchupMultiplier = $monster->matchupMultiplier($skill->combat_range, $skill->element_id);
        if ($matchupMultiplier > 1) {
            $mitigated *= $matchupMultiplier;
            $note = ' (Efektif!)';
        } elseif ($matchupMultiplier < 1) {
            $mitigated *= $matchupMultiplier;
            $note = ' (Kurang efektif...)';
        }

        // Roll critical hit.
        $isCrit = random_int(1, 100) <= $character->effective_critical_luck;
        if ($isCrit) {
            $mitigated *= (1 + $character->effective_critical_hit / 100);
            $note .= ' CRITICAL!';
        }

        // Buff dari skill support sebelumnya (kalau ada) - one-shot,
        // konsumsi begitu karakter ini nyerang, abis itu reset. Cuma
        // buff tipe 'attack' yang kekonsumsi di sini (buff 'defense'
        // dikonsumsi pas KENA serangan, bukan pas nyerang).
        if ($participant->buff_multiplier && $participant->buff_stat !== 'defense') {
            $mitigated *= (float) $participant->buff_multiplier;
            $note .= ' (Buff!)';
            $participant->buff_multiplier = null;
            $participant->buff_stat = null;
        }

        // Debuff dari skill nerf sebelumnya (kalau ada) - one-shot, konsumsi
        // langsung abis dipakai di sini, siapapun yang mukul duluan.
        if ($battle->monster_debuff_multiplier) {
            $mitigated *= (float) $battle->monster_debuff_multiplier;
            $note .= ' (Lemah!)';
            $battle->monster_debuff_multiplier = null;
        }

        $damage = max(1, (int) round($mitigated));
        $battle->monster_current_hp = max(0, $battle->monster_current_hp - $damage);

        // Stun - EVENT TERPISAH dari critical hit (roll sendiri, dice beda),
        // cuma persentase peluangnya kebetulan sama (Critical Luck). Jadi bisa
        // crit doang, stun doang, keduanya, atau gak dua-duanya - independen.
        if ($skill->can_stun && $battle->monster_current_hp > 0) {
            $isStun = random_int(1, 100) <= $character->effective_critical_luck;
            if ($isStun) {
                $battle->monster_stunned = true;
                $note .= ' STUN!';
            }
        }

        $participant->save();

        $log[] = $this->snapshot($battle, "{$participant->character->name} pakai {$skill->name}: {$damage} damage ke {$monster->name}{$note}", $character->id, $skill->id, false, [
            'type' => 'damage',
            'value' => $damage,
            'target' => 'monster',
            'is_critical' => $isCrit,
            'is_ultimate' => $skill->tier === 3,
        ]);

        if ($battle->monster_current_hp <= 0) {
            $log[] = $this->snapshot($battle, "{$monster->name} kalah!");
        }
    }

    /**
     * Giliran monster nyerang - dipisah jadi method sendiri (dulu inline di
     * loop), sama persis logic-nya, cuma direlokasi biar reusable dari mode
     * manual juga.
     */
    private function executeMonsterTurn(Battle $battle, array &$log): void
    {
        $monster = $battle->monster;
        $stats = $battle->monster_stats;

        if ($battle->monster_stunned) {
            // Kena stun dari skill player ronde ini -> skip nyerang balik.
            $log[] = $this->snapshot($battle, "{$monster->name} kena stun, skip giliran!", null, null, true);
            $battle->monster_stunned = false;

            return;
        }

        // BUG FIX PENTING: sebelumnya pakai participants()->where(...)->get()
        // yang query FRESH ke database, hasilnya instance PHP BEDA dari yang
        // udah di-cache di $battle->participants. Fix: filter collection yang
        // UDAH di-load (instance sama), bukan query baru.
        $alive = $battle->participants->where('is_alive', true);

        if ($alive->isEmpty()) {
            return;
        }

        // Monster SELALU nyerang lewat skill (config admin: nama, damage_ratio,
        // effect single/area, can_stun, physical_ratio, usage_ratio - chance
        // dipilih tiap giliran). Semua monster dijamin punya minimal 1 skill
        // (seeder MonsterDefaultSkillSeeder) - gak ada lagi "serangan generik"
        // yang ambigu physical/magic-nya kayak dulu.
        $monsterSkill = $this->pickMonsterSkill($monster);
        $isArea = ($monsterSkill['effect'] ?? null) === 'area';
        $targets = $isArea ? $alive : collect([$this->pickWeightedTarget($alive, $battle->frontman_character_id)]);
        $skillName = $monsterSkill['name'] ?? null;
        $damageRatio = $monsterSkill ? (float) ($monsterSkill['damage_ratio'] ?? 100) : 100;
        $skillCanStun = (bool) ($monsterSkill['can_stun'] ?? false);
        // Dulu dideteksi otomatis (magic > physical), sekarang EKSPLISIT
        // dari config skill-nya - jelas tau ini serangan physical, magic,
        // atau campuran keduanya (0-100, biar gak ambigu lagi).
        $physicalRatio = ($monsterSkill ? (float) ($monsterSkill['physical_ratio'] ?? 100) : 100) / 100;
        $verb = $skillName ? "pakai {$skillName} ke" : 'menyerang';

        foreach ($targets as $target) {
            $character = $target->character;

            // Cek akurasi monster vs Evasion (defensif) karakter.
            $hitChance = max(50, min(99, 100 + $monster->accuracy - 90 - $character->effective_evasion));
            if (random_int(1, 100) > $hitChance) {
                $log[] = $this->snapshot($battle, "{$monster->name} {$verb} {$target->character->name}: MELESET!", null, null, true, ['type' => 'miss', 'target' => $target->character_id]);

                continue;
            }

            $offenseStat = ($stats['physical_damage'] * $physicalRatio) + ($stats['magic_damage'] * (1 - $physicalRatio));
            $defenseStat = ($this->combatStat($target, 'physical_defense') * $physicalRatio) + ($this->combatStat($target, 'magic_defense') * (1 - $physicalRatio));

            $raw = $offenseStat * ($damageRatio / 100);
            $mitigated = max($raw - ($defenseStat * 0.5), $raw * 0.1);

            // Buff defense (kalau ada) - one-shot, konsumsi pas KENA
            // serangan ini, ngurangin damage yang masuk.
            $defenseBuffNote = '';
            if ($target->buff_multiplier && $target->buff_stat === 'defense') {
                $mitigated /= (float) $target->buff_multiplier;
                $defenseBuffNote = ' (Terlindungi!)';
                $target->buff_multiplier = null;
                $target->buff_stat = null;
            }

            $damage = max(1, (int) round($mitigated));

            $target->current_hp = max(0, $target->current_hp - $damage);
            $justFainted = false;
            if ($target->current_hp <= 0) {
                $target->is_alive = false;
                $justFainted = true;
            } elseif ($skillCanStun) {
                $target->is_stunned = true;
            }
            $target->save();

            $msg = "{$monster->name} {$verb} {$target->character->name}: {$damage} damage{$defenseBuffNote}.";
            if ($skillCanStun && ! $justFainted) {
                $msg .= " {$target->character->name} kena stun!";
            }
            if ($justFainted) {
                $msg .= " {$target->character->name} tumbang!";
            }
            $log[] = $this->snapshot($battle, $msg, null, null, true, ['type' => 'damage', 'value' => $damage, 'target' => $target->character_id, 'is_critical' => false, 'is_ultimate' => false, 'skill_name' => $skillName]);

            if (! $this->anyAlive($battle)) {
                break;
            }
        }
    }

    /**
     * Jalankan seluruh battle otomatis dari awal sampai menang/kalah (mode
     * AUTO). Tiap step dicatat sebagai snapshot biar frontend bisa "putar
     * ulang" secara animasi. GAK BERBASIS RONDE SINKRON lagi secara konsep -
     * "ronde" di sini cuma satuan waktu internal (dikontrol skill_action_delay
     * admin), siapa aja bisa gerak begitu skill-nya gak cooldown, gak nunggu
     * "giliran".
     */
    public function autoResolve(Battle $battle): Battle
    {
        $battle->load(['participants.character.subclass.gameClass', 'participants.character.subclass.skills', 'participants.character.skills', 'participants.character.items', 'monster']);
        $monster = $battle->monster;

        $log = [];
        $log[] = $this->snapshot($battle, "{$monster->name} (Lv.{$battle->monster_level}) muncul menghadang!");

        $tick = 1;

        while ($battle->monster_current_hp > 0 && $this->anyAlive($battle) && $tick <= self::MAX_ROUNDS) {
            // Regen HP/stamina/mana tiap awal tick, dibatasi pool max (snapshot
            // NPC kalau NPC, effective_* karakter kalau player).
            foreach ($battle->participants as $participant) {
                if (! $participant->is_alive) {
                    continue;
                }

                $participant->current_hp = min($this->combatStat($participant, 'base_hp'), $participant->current_hp + $this->combatStat($participant, 'hp_regen'));
                $participant->current_stamina = min($this->combatStat($participant, 'base_sp'), $participant->current_stamina + $this->combatStat($participant, 'stamina_regen'));
                $participant->current_mana = min($this->combatStat($participant, 'base_mp'), $participant->current_mana + $this->combatStat($participant, 'mana_regen'));
            }

            // BUG FIX: sebelumnya urutan giliran SELALU sama tiap ronde (karakter
            // pemain duluan, NPC belakangan - ngikutin urutan party dari Guild).
            // Efeknya: kalau serangan karaktermu udah cukup buat ngalahin monster,
            // loop LANGSUNG berhenti (monster_current_hp <= 0) SEBELUM giliran NPC
            // - kelihatan kayak "NPC gak pernah nyerang" padahal cuma emang gak
            // pernah kebagian giliran. Fix: acak urutan tiap ronde, biar NPC juga
            // adil kesempatan gerak duluan.
            foreach ($battle->participants->shuffle() as $participant) {
                if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                    continue;
                }

                // Kena stun dari skill monster sebelumnya -> skip giliran, efek abis dipakai sekali.
                if ($participant->is_stunned) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} kena stun, skip giliran!", $participant->character_id);
                    $participant->is_stunned = false;
                    $participant->save();
                    continue;
                }

                $skill = $this->autoPickSkill($battle, $participant, $tick);
                if (! $skill) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} belum ada skill siap pakai, cuma bertahan.");
                    continue;
                }

                $this->executeParticipantSkill($battle, $participant, $skill, $log);

                if ($battle->monster_current_hp <= 0) {
                    break;
                }
            }

            if ($battle->monster_current_hp > 0) {
                $this->executeMonsterTurn($battle, $log);
            }

            $tick++;
            $battle->round_number = $tick;
        }

        $this->finalizeBattle($battle, $log);

        return $battle->fresh(['participants.character.subclass', 'monster']);
    }

    /**
     * Selesain battle - cek menang/kalah/timeout, kasih reward, full-heal
     * party. Dipisah dari autoResolve() biar bisa dipanggil dari mode manual
     * juga (pas battle berakhir di tengah proses manual).
     */
    private function finalizeBattle(Battle $battle, array &$log): void
    {
        if ($battle->monster_current_hp <= 0) {
            $battle->status = 'won';
            $this->onVictory($battle, $log);
        } elseif (! $this->anyAlive($battle)) {
            $battle->status = 'lost';
            $log[] = $this->snapshot($battle, 'Seluruh party tumbang. Kalah...');
        } else {
            // Kena cap max tick tanpa hasil -> anggap seri/kabur biar gak nge-hang.
            $battle->status = 'fled';
            $log[] = $this->snapshot($battle, 'Pertarungan terlalu lama, party mundur.');
        }

        $battle->battle_log = $log;
        $battle->save();

        // Abis battle selesai, party PULIH FULL (HP/SP/MP kembali penuh) - baik
        // yang tumbang maupun yang cuma kepotong sebagian, gak perlu recovery
        // manual di luar battle. NPC gak disentuh (mereka emang selalu fresh
        // tiap battle sendiri, gak nyimpen state apapun - "diset kayak monster").
        foreach ($battle->participants as $participant) {
            $character = $participant->character;
            if ($character->is_npc) {
                continue;
            }
            $character->update([
                'current_hp' => $character->effective_base_hp,
                'current_stamina' => $character->effective_base_sp,
                'current_mana' => $character->effective_base_mp,
            ]);
        }
    }

    /**
     * MODE MANUAL: 1 giliran/aksi yang di-trigger player lewat HTTP request
     * (klik tombol skill atau tekan keyboard). Player kontrol karakternya
     * SENDIRI (skillId null = "nunggu", gak pakai skill apapun giliran ini),
     * NPC teman party & monster tetap AUTO (autoPickSkill/pickMonsterSkill).
     * Return log DELTA aja (bukan seluruh log dari awal) biar frontend bisa
     * nge-append tanpa render ulang semuanya.
     */
    /**
     * Timpa kolom skill_cooldowns tiap participant (yang lama, kolom JSON,
     * gak dipakai buat logic mode Manual lagi) dengan data SEGAR dari tabel
     * dedicated - biar response JSON ke frontend tetap punya bentuk yang
     * sama (`participant.skill_cooldowns`), ManualSkillBar gak perlu diubah
     * sama sekali. Dipanggil controller sebelum render/response.
     */
    public function attachCooldownsToParticipants(Battle $battle): void
    {
        foreach ($battle->participants as $participant) {
            $participant->skill_cooldowns = $this->cooldownsMapFor($participant);
        }
    }

    /**
     * Tulis 1 baris diagnostik ke file terpisah (storage/logs/skill-debug.log),
     * BUKAN ke battle log yang keliatan player - biar gak ganggu pengalaman
     * main tapi tetap ada jejak lengkap. Diakses lewat /admin/skill-debug-log
     * (lihat AdminDebugLogController) atau langsung via SSH/file manager.
     */
    private function debugLog(string $message): void
    {
        $line = '['.now()->format('Y-m-d H:i:s').'] '.$message.PHP_EOL;
        @file_put_contents(storage_path('logs/skill-debug.log'), $line, FILE_APPEND | LOCK_EX);
    }

    public function processManualTurn(Battle $battle, Character $actingCharacter, ?int $skillId): array
    {
        $battle->load(['participants.character.subclass.gameClass', 'participants.character.subclass.skills', 'participants.character.skills', 'participants.character.items', 'monster']);

        $log = [];
        $monster = $battle->monster;

        // Regen dulu tiap giliran, sama kayak mode auto.
        foreach ($battle->participants as $p) {
            if (! $p->is_alive) {
                continue;
            }
            $p->current_hp = min($this->combatStat($p, 'base_hp'), $p->current_hp + $this->combatStat($p, 'hp_regen'));
            $p->current_stamina = min($this->combatStat($p, 'base_sp'), $p->current_stamina + $this->combatStat($p, 'stamina_regen'));
            $p->current_mana = min($this->combatStat($p, 'base_mp'), $p->current_mana + $this->combatStat($p, 'mana_regen'));
        }

        $playerParticipant = $battle->participants->firstWhere('character_id', $actingCharacter->id);
        // Waktu ASLI (detik) sejak battle dibuat - dipakai buat cooldown SEMUA
        // actor (player+NPC), tapi masing-masing tetap independen (storage-nya
        // per-participant, cuma REFERENSI jamnya yang sama-sama "jam dinding").
        $nowSeconds = (float) now()->diffInSeconds($battle->created_at);

        // Urutan giliran diacak juga (sama alasannya kayak mode Auto) - biar NPC
        // gak selalu kebagian giliran belakangan.
        foreach ($battle->participants->shuffle() as $participant) {
            if (! $participant->is_alive || $battle->monster_current_hp <= 0) {
                continue;
            }

            if ($participant->is_stunned) {
                $log[] = $this->snapshot($battle, "{$participant->character->name} kena stun, skip giliran!", $participant->character_id);
                $participant->is_stunned = false;
                $participant->save();

                continue;
            }

            // Karakter yang dikontrol player: pakai skill yang DIPILIH player
            // (bukan AI). NPC teman & karakter lain: tetap AI (autoPickSkillRealtime).
            if ($playerParticipant && $participant->id === $playerParticipant->id) {
                if (! $skillId) {
                    continue; // player pilih "nunggu" / belum kirim aksi - ini normal (auto-poll)
                }

                $skill = $participant->character->subclass->skills->firstWhere('id', $skillId);
                if (! $skill || ! in_array($skillId, $participant->loadout_skill_ids ?? [])) {
                    $this->debugLog("Skill ID {$skillId} ditolak: gak ketemu di subclass atau gak ada di loadout. participant_id={$participant->id}, loadout=".json_encode($participant->loadout_skill_ids ?? []));

                    continue;
                }

                $scaled = $this->skillCombatStats($participant->character, $skill);
                // REWORK TOTAL: baca dari tabel dedicated (battle_skill_cooldowns),
                // BUKAN kolom JSON gabungan lagi. User laporan "cuma skill pertama
                // yang cooldown-nya jalan" - dicoba dicari bug spesifiknya di logic
                // array JSON berkali-kali gak ketemu, jadi diganti total ke
                // pendekatan yang lebih auditable: 1 baris tabel = 1 skill = 1
                // participant, upsert independen, gak ada lagi mekanisme "baca-
                // ubah-simpan 1 kolom gabungan" yang bisa numpuk masalah.
                $lastUsed = $this->cooldownUsedAt($participant, $skill->id);

                $onCooldown = $lastUsed !== null && ($nowSeconds - $lastUsed) < $scaled['cooldown_seconds'];
                $affordable = $scaled['stamina_cost'] <= $participant->current_stamina && $scaled['mana_cost'] <= $participant->current_mana;

                // DIAGNOSTIK: dicatat ke file (storage/logs/skill-debug.log), BUKAN
                // ke battle log yang keliatan player - biar gak ganggu pengalaman
                // main, tapi tetap ada jejak lengkap buat dianalisis. Dicatat SETIAP
                // kali (bukan cuma pas ditolak) biar kelihatan histori penuhnya.
                $this->debugLog(sprintf(
                    'participant_id=%d skill_id=%d(%s) lastUsed=%s nowSeconds=%s cooldownNeeded=%s onCooldown=%s affordable=%s manaCost=%s/mana=%s staminaCost=%s/stamina=%s',
                    $participant->id,
                    $skill->id,
                    $skill->name,
                    $lastUsed === null ? 'null' : round($lastUsed, 2),
                    round($nowSeconds, 2),
                    $scaled['cooldown_seconds'],
                    $onCooldown ? 'YES' : 'no',
                    $affordable ? 'yes' : 'NO',
                    $scaled['mana_cost'],
                    $participant->current_mana,
                    $scaled['stamina_cost'],
                    $participant->current_stamina,
                ));

                if ($onCooldown || ! $affordable) {
                    continue;
                }

                $this->recordCooldownUsed($participant, $skill->id, $nowSeconds);
            } else {
                $skill = $this->autoPickSkillRealtime($battle, $participant, $nowSeconds);
                if (! $skill) {
                    $log[] = $this->snapshot($battle, "{$participant->character->name} belum ada skill siap pakai, cuma bertahan.");

                    continue;
                }
            }

            $this->executeParticipantSkill($battle, $participant, $skill, $log);

            if ($battle->monster_current_hp <= 0) {
                break;
            }
        }

        if ($battle->monster_current_hp > 0 && $this->anyAlive($battle)) {
            $this->executeMonsterTurn($battle, $log);
        }

        $battle->round_number += 1;

        // BUG FIX PENTING: sebelumnya cap "battle kelamaan" pakai round_number
        // (naik 1 SETIAP KALI /act dipanggil - termasuk dari klik cepat!). Kalau
        // player spam klik skill, round_number bisa ngelewatin MAX_ROUNDS (20)
        // cuma dalam hitungan DETIK (bukan karena battle beneran lama), bikin
        // battle di-force-end premature ("Pertarungan terlalu lama") padahal
        // baru jalan sebentar. Fix: mode Manual pakai cap WAKTU ASLI (5 menit),
        // bukan jumlah aksi - konsisten sama konsep mode ini yang emang
        // berbasis waktu, bukan giliran/ronde.
        $tooLong = $nowSeconds > self::MAX_MANUAL_BATTLE_SECONDS;

        if ($battle->monster_current_hp <= 0 || ! $this->anyAlive($battle) || $tooLong) {
            $this->finalizeBattle($battle, $log);
        } else {
            $battle->battle_log = array_merge($battle->battle_log ?? [], $log);
            $battle->save();
        }

        return $log;
    }

    /**
     * AI: pilih skill ber-multiplier tertinggi yang affordable DAN gak lagi cooldown.
     * cooldown_seconds ditranslate ke "berapa tick terkunci" pakai skill_action_delay
     * (setting admin, default 2 detik/tick) - bukan hardcode 2.5 lagi.
     */
    /**
     * Versi REALTIME dari autoPickSkill() - khusus mode MANUAL. Bedanya: pakai
     * detik ASLI (elapsed sejak battle dibuat) buat ngukur cooldown, bukan
     * "tick" bersama kayak autoPickSkill() (yang dipakai mode Auto doang).
     *
     * BUG FIX PENTING: sebelumnya delay-nya ke-itung pakai battle.round_number
     * (counter GLOBAL yang sama buat semua participant), jadi walau storage
     * cooldown_seconds-nya per-participant, REFERENSI WAKTU-nya nyampur -
     * kesannya "delay ketauan dari aksi siapa aja yang jalan", padahal
     * mestinya tiap karakter/NPC punya cooldown independen sendiri-sendiri.
     * Fix: pakai now()->diffInSeconds($battle->created_at) - waktu ASLI yang
     * jalan terus gak peduli siapa yang barusan gerak, dibandingin LANGSUNG ke
     * skill->cooldown_seconds (gak perlu bulat-bulatin ke satuan tick lagi,
     * jadi presisinya juga lebih akurat).
     */
    /**
     * Kapan skill ini TERAKHIR dipakai participant ini (detik elapsed sejak
     * battle dibuat) - null kalau belum pernah dipakai sama sekali. Baca dari
     * tabel dedicated (battle_skill_cooldowns), BUKAN kolom JSON gabungan
     * lagi - 1 query per skill, independen total dari skill lain.
     */
    private function cooldownUsedAt(BattleParticipant $participant, int $skillId): ?float
    {
        $value = BattleSkillCooldown::where('battle_participant_id', $participant->id)
            ->where('skill_id', $skillId)
            ->value('used_at_seconds');

        return $value !== null ? (float) $value : null;
    }

    /**
     * Catat skill ini baru aja dipakai - upsert (updateOrInsert) di tabel
     * dedicated, gak numpuk sama cooldown skill LAIN sama sekali (beda baris
     * tabel), gak ada risiko race/kesalahan mutasi array gabungan.
     */
    private function recordCooldownUsed(BattleParticipant $participant, int $skillId, float $nowSeconds): void
    {
        BattleSkillCooldown::updateOrCreate(
            ['battle_participant_id' => $participant->id, 'skill_id' => $skillId],
            ['used_at_seconds' => $nowSeconds]
        );
    }

    /**
     * Semua cooldown skill participant ini, format [skill_id => used_at_seconds]
     * - dipakai buat nge-attach balik ke response JSON (frontend butuh bentuk
     * ini biar kompatibel sama ManualSkillBar yang udah ada).
     */
    private function cooldownsMapFor(BattleParticipant $participant): array
    {
        return BattleSkillCooldown::where('battle_participant_id', $participant->id)
            ->pluck('used_at_seconds', 'skill_id')
            ->map(fn ($v) => (float) $v)
            ->toArray();
    }

    private function autoPickSkillRealtime(Battle $battle, BattleParticipant $participant, float $nowSeconds): ?Skill
    {
        $loadoutIds = $participant->loadout_skill_ids ?? [];
        $skills = $participant->character->subclass->skills->whereIn('id', $loadoutIds);
        $character = $participant->character;

        $usable = $skills->filter(function (Skill $skill) use ($battle, $participant, $nowSeconds, $character) {
            $scaled = $this->skillCombatStats($character, $skill);

            $affordable = $scaled['stamina_cost'] <= $participant->current_stamina
                && $scaled['mana_cost'] <= $participant->current_mana;

            if (! $affordable) {
                return false;
            }

            if ($skill->buff_type === 'heal' && ! $this->healTargetNeeded($battle, $skill)) {
                return false;
            }

            // REWORK: cooldown dibaca dari tabel dedicated (battle_skill_cooldowns),
            // BUKAN kolom JSON gabungan lagi - independen per skill, gak ada
            // lagi risiko 1 skill "numpuk"/ketimpa skill lain.
            $lastUsedSeconds = $this->cooldownUsedAt($participant, $skill->id);
            if ($lastUsedSeconds === null) {
                return true;
            }

            return ($nowSeconds - $lastUsedSeconds) >= $scaled['cooldown_seconds'];
        });

        if ($usable->isEmpty()) {
            return null;
        }

        $chosen = $usable->sortByDesc(fn (Skill $s) => $this->skillCombatStats($character, $s)['multiplier'])->first();

        $this->recordCooldownUsed($participant, $chosen->id, $nowSeconds);

        return $chosen;
    }

    private function autoPickSkill(Battle $battle, BattleParticipant $participant, int $currentTick): ?Skill
    {
        $loadoutIds = $participant->loadout_skill_ids ?? [];
        $skills = $participant->character->subclass->skills->whereIn('id', $loadoutIds);
        $cooldowns = $participant->skill_cooldowns ?? [];
        $character = $participant->character;
        $delay = GameSetting::getFloat('skill_action_delay', 2);

        $usable = $skills->filter(function (Skill $skill) use ($battle, $participant, $cooldowns, $currentTick, $character, $delay) {
            $scaled = $this->skillCombatStats($character, $skill);

            $affordable = $scaled['stamina_cost'] <= $participant->current_stamina
                && $scaled['mana_cost'] <= $participant->current_mana;

            if (! $affordable) {
                return false;
            }

            // Skill heal cuma dianggap "usable" kalau emang ada yang butuh
            // disembuhin (di bawah 90% resource) - biar AI gak spam heal
            // padahal party full HP/MP/SP.
            if ($skill->buff_type === 'heal' && ! $this->healTargetNeeded($battle, $skill)) {
                return false;
            }

            $lastUsedTick = $cooldowns[$skill->id] ?? null;
            if ($lastUsedTick === null) {
                return true;
            }

            $ticksLocked = max(1, (int) ceil($scaled['cooldown_seconds'] / $delay));

            return ($currentTick - $lastUsedTick) >= $ticksLocked;
        });

        if ($usable->isEmpty()) {
            return null;
        }

        $chosen = $usable->sortByDesc(fn (Skill $s) => $this->skillCombatStats($character, $s)['multiplier'])->first();

        $cooldowns[$chosen->id] = $currentTick;
        $participant->skill_cooldowns = $cooldowns;

        return $chosen;
    }

    /**
     * Roll skill monster (dari skills_config yang diatur admin) yang dipakai
     * ronde ini, berdasarkan usage_ratio tiap skill (persentase peluang per
     * ronde, dicek berurutan). Null kalau gak ada yang ke-roll -> fallback
     * ke serangan dasar (single target, damage_ratio 100%).
     */
    private function pickMonsterSkill(Monster $monster): ?array
    {
        foreach ($monster->skills_config ?? [] as $skillConfig) {
            $usageRatio = (float) ($skillConfig['usage_ratio'] ?? 0);
            if ($usageRatio > 0 && random_int(1, 100) <= $usageRatio) {
                return $skillConfig;
            }
        }

        return null;
    }

    /**
     * Resource (current, max) yang relevan buat heal_resource skill ('hp' default).
     */
    private function resourceLevel(BattleParticipant $p, string $resource): array
    {
        return match ($resource) {
            'mp' => [$p->current_mana, $this->combatStat($p, 'base_mp')],
            'sp' => [$p->current_stamina, $this->combatStat($p, 'base_sp')],
            default => [$p->current_hp, $this->combatStat($p, 'base_hp')],
        };
    }

    /**
     * Ada gak participant hidup yang resource-nya di bawah 90% (butuh disembuhin)?
     * Kalau gak ada, skill heal ini gak usable ronde ini (biar AI gak spam heal
     * pas semua orang udah full).
     */
    private function healTargetNeeded(Battle $battle, Skill $skill): bool
    {
        $resource = $skill->heal_resource ?? 'hp';

        foreach ($battle->participants->where('is_alive', true) as $p) {
            [$current, $max] = $this->resourceLevel($p, $resource);
            if ($max > 0 && ($current / $max) < 0.9) {
                return true;
            }
        }

        return false;
    }

    /**
     * Pilih target heal: participant hidup dengan persentase resource TERENDAH
     * (paling butuh), termasuk diri sendiri.
     */
    private function pickHealTarget(Battle $battle, Skill $skill): ?BattleParticipant
    {
        $resource = $skill->heal_resource ?? 'hp';

        return $battle->participants->where('is_alive', true)
            ->sortBy(function (BattleParticipant $p) use ($resource) {
                [$current, $max] = $this->resourceLevel($p, $resource);

                return $max > 0 ? $current / $max : 1;
            })
            ->first();
    }

    /**
     * Pilih target monster - kalau ada frontman, dia dapet bobot 2x (jadi
     * ~50% kena kalau party 3 orang: frontman 50%, 2 lainnya 25%/25%. Kalau
     * party 2 orang: frontman ~67%, yang lain ~33%). Gak ada frontman -> random
     * biasa (bobot rata semua).
     */
    private function pickWeightedTarget(\Illuminate\Support\Collection $alive, ?int $frontmanCharacterId): BattleParticipant
    {
        if (! $frontmanCharacterId) {
            return $alive->random();
        }

        $weighted = [];
        foreach ($alive as $p) {
            $weight = $p->character_id === $frontmanCharacterId ? 2 : 1;
            for ($i = 0; $i < $weight; $i++) {
                $weighted[] = $p;
            }
        }

        return $weighted[array_rand($weighted)];
    }

    private function anyAlive(Battle $battle): bool
    {
        return $battle->participants->contains('is_alive', true);
    }

    /**
     * Tambah field 'effect' terstruktur (bukan cuma teks) - dipakai frontend
     * buat nampilin damage number/ikon meleset/heal floating di atas sprite,
     * gantiin battle log teks yang dihapus total. $effect: null (gak ada efek
     * visual, misal cuma "belum ada skill siap pakai") atau array
     * ['type' => 'damage'|'miss'|'heal'|'crit', 'value' => int|null,
     * 'target' => 'monster'|int (character_id), 'is_ultimate' => bool].
     */
    private function snapshot(Battle $battle, string $text, ?int $actorCharacterId = null, ?int $skillId = null, bool $isMonsterActor = false, ?array $effect = null): array
    {
        return [
            'text' => $text,
            'monster_hp' => $battle->monster_current_hp,
            'actor_character_id' => $actorCharacterId,
            'skill_id' => $skillId,
            'is_monster_actor' => $isMonsterActor,
            'effect' => $effect,
            'participants' => $battle->participants->mapWithKeys(fn ($p) => [
                $p->character_id => ['hp' => $p->current_hp, 'stamina' => $p->current_stamina, 'mana' => $p->current_mana, 'is_alive' => $p->is_alive],
            ])->toArray(),
        ];
    }

    private function onVictory(Battle $battle, array &$log): void
    {
        $battle->encounter->update(['status' => 'won']);
        $battle->encounter->spawnPoint->update(['last_defeated_at' => now()]);

        $expReward = $battle->monster_stats['exp_reward'];
        $goldReward = $battle->monster_stats['gold_reward'];

        foreach ($battle->participants as $participant) {
            $character = $participant->character;

            // NPC gak numpuk EXP/level/gold/item permanen - "diset kayak monster",
            // cuma player yang beneran progress dari battle ke battle.
            if ($character->is_npc) {
                continue;
            }

            $character->increment('exp', $expReward);
            $character->increment('total_exp', $expReward);
            $character->increment('gold', $goldReward);
            $character->refresh();

            $oldLevel = $character->level;
            if ($character->syncLevel()) {
                $points = $character->statPointsEarnedBetween($oldLevel, $character->level);
                $character->stat_points += $points;
                $character->save();
                $log[] = $this->snapshot($battle, "{$character->name} naik ke Level {$character->level}! (+{$points} stat point)");
            }

            $droppedItem = $this->rollItemDrop();
            if ($droppedItem && $character->items()->count() < 50) {
                $character->items()->attach($droppedItem->id, ['obtained_at' => now()]);
                $rarityLabel = \App\Models\Item::RARITY_LABELS[$droppedItem->rarity] ?? $droppedItem->rarity;
                $log[] = $this->snapshot($battle, "{$character->name} dapat item [{$rarityLabel}] {$droppedItem->name}!");
            }
        }

        $log[] = $this->snapshot($battle, "Party dapat {$expReward} EXP + {$goldReward} Gold masing-masing karakter!");
    }

    /**
     * Roll drop item - tiap item di database punya drop_rate sendiri (persen),
     * dicek satu-satu (urutan acak) sampai ada yang kena. Null kalau gak ada
     * yang ke-roll (kemungkinan besar, biar item tetap berharga).
     */
    private function rollItemDrop(): ?\App\Models\Item
    {
        $items = \App\Models\Item::inRandomOrder()->get();
        foreach ($items as $item) {
            if ($item->drop_rate > 0 && random_int(1, 10000) <= $item->drop_rate * 100) {
                return $item;
            }
        }

        return null;
    }

    public function flee(Battle $battle): Battle
    {
        $battle->status = 'fled';
        $log = $battle->battle_log ?? [];
        $log[] = $this->snapshot($battle, 'Party kabur dari pertarungan.');
        $battle->battle_log = $log;
        $battle->save();

        return $battle;
    }

    /**
     * Cari SPESIES monster yang cocok buat "Misi Cepat" - level dasarnya
     * mendekati rata-rata level party. Level ENCOUNTER-nya sendiri baru
     * di-roll pas startBattle() (bisa lebih tinggi dari level dasar ini).
     */
    public function findQuickMissionMonster(Collection $characters): ?Monster
    {
        $avgLevel = (int) round($characters->avg('level'));

        $candidates = Monster::where('min_party_level', '<=', max(1, $avgLevel + 1))
            ->orderByRaw('ABS(level - ?)', [$avgLevel])
            ->limit(5)
            ->get();

        return $candidates->isNotEmpty() ? $candidates->random() : Monster::inRandomOrder()->first();
    }
}
