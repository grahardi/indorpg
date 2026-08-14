# RPG Web-Based — Game Design Doc v1

Stack: Laravel 13 + PostgreSQL + PHP 8.5 + Inertia + React (no build pipeline tambahan selain Vite default Inertia)
Tahap: development/tester, belum ada auth/login.

---

## 1. Resource System

Setiap karakter punya 3 pool:
- **HP** — nyawa
- **Stamina** — dipakai untuk skill fisik (physical skill)
- **Mana** — dipakai untuk magic/skill sihir

Aturan dasar:
- Skill **physical** → konsumsi **Stamina**, scaling dari stat `physical_damage`
- Skill **magic** → konsumsi **Mana**, scaling dari stat `magic_damage`
- Karakter hybrid (Mage Knight, Paladin, dll) pakai kombinasi keduanya sesuai skill yang dipilih di skill tree

Base pool per archetype (level 1, bisa naik lewat stat growth per level):

| Class | HP | Stamina | Mana |
|---|---|---|---|
| Warrior | 120 | 100 | 40 |
| Tanker | 160 | 70 | 60 |
| Mage | 80 | 40 | 110 |
| Saint | 90 | 40 | 100 |

---

## 2. Stat Conversion (kualitatif excel → angka)

Skala dipakai (base value, scaling per level nanti pakai growth rate terpisah):

| Label | Nilai |
|---|---|
| very low | 5 |
| low | 10 |
| mid | 20 |
| high | 30 |
| high/super | 38 |
| super | 45 |

Total "power budget" tiap subclass sengaja saya jaga di kisaran 78–85 supaya gak ada subclass yang jomplang secara kasar (masing-masing kuat di titik berbeda).

---

## 3. Class & Subclass (dengan nama baru)

### WARRIOR — *"melee dealer, damage utama jarak dekat"*

| Subclass baru | (nama lama) | Phys DMG | Phys DEF | Magic DMG | Magic DEF | Konsep |
|---|---|---|---|---|---|---|
| **Berserker** | Monk | 45 | 20 | 10 | 10 | raw power, all-in damage fisik |
| **Blade Knight** | Knight | 30 | 20 | 20 | 10 | all-rounder senjata |
| **Spellblade** | Mage Knight | 20 | 10 | 30 | 20 | hybrid pedang+sihir |
| **Paladin** | Paladin | 10 | 10 | 45 | 20 | warrior tapi damage utama dari sihir suci |

### TANKER — *"shielder, pertahanan utama"*

| Subclass baru | (nama lama) | Phys DMG | Phys DEF | Magic DMG | Magic DEF | Konsep |
|---|---|---|---|---|---|---|
| **Bulwark** | Guardian | 10 | 45 | 10 | 20 | tembok fisik |
| **Warden** | Mage Guardian | 10 | 20 | 10 | 45 | tembok sihir |
| **Sentinel** | Balanced Guardian | 10 | 30 | 10 | 30 | tanker seimbang |

### MAGE — *"ranged attacker, elemental"*

| Subclass baru | (nama lama) | Phys DMG | Phys DEF | Magic DMG | Magic DEF | Kuat vs | Lemah vs |
|---|---|---|---|---|---|---|---|
| **Pyromancer** | Fire | 5 | 10 | 45 | 20 | Wind | Water |
| **Hydromancer** | Water | 5 | 10 | 45 | 20 | Fire | Earth |
| **Geomancer** | Earth | 5 | 10 | 45 | 20 | Water | Wind |
| **Aeromancer** | Wind | 5 | 10 | 45 | 20 | Earth | Fire |

Siklus elemen (diperbaiki dari excel, sekarang 4 arah bersih, tiap elemen kuat vs 1 & lemah vs 1):
`Fire → Wind → Earth → Water → Fire` (searah panah = kuat melawan)
Bonus damage saat counter-element: **+25%**, saat kena counter: **-15%**.

### SAINT — *"support: heal / curse / buff"*

| Subclass baru | (nama lama) | Phys DMG | Phys DEF | Magic DMG | Magic DEF | Fokus |
|---|---|---|---|---|---|---|
| **Cleric** | Cleric | 5 | 10 | 25 | 45 | healing |
| **Warlock** | Magus | 5 | 10 | 25 | 45 | curse/DoT ke musuh |
| **Enchanter** | Enchanter | 5 | 10 | 25 | 45 | buff skill/magic party |

---

## 4. Skill Tree (konsep awal, bisa dikembangkan)

Setiap subclass punya 1 skill tree dengan 3 tier:
- **Tier 1 (level 1-10)** — 2-3 skill dasar (langsung kebuka)
- **Tier 2 (level 11-25)** — 3-4 skill, butuh skill point, mulai ada pilihan cabang (misal Berserker: cabang "burst damage" vs cabang "sustain/lifesteal")
- **Tier 3 (level 26+)** — ultimate skill, 1 pilihan besar yang menentukan playstyle akhir

Tiap skill: `stamina_cost` / `mana_cost`, `cooldown`, `damage_multiplier` (dari stat dasar), `element` (nullable, cuma dipakai mage), `scaling_stat` (physical/magic).

Skill tree disimpan sebagai data (bukan hardcode), jadi lo bisa ubah node-nya dari admin/seeder tanpa redeploy code.

---

## 5. Struktur Database (rencana migration)

```
classes            (id, name, description)                      -- warrior/tanker/mage/saint
subclasses         (id, class_id, name, power_type, 
                     base_phys_dmg, base_phys_def, 
                     base_magic_dmg, base_magic_def,
                     base_hp, base_stamina, base_mana)
elements            (id, name)                                    -- fire/water/earth/wind, nullable utk non-mage
element_matchups    (id, attacker_element_id, defender_element_id, multiplier)
characters          (id, name, subclass_id, level, exp,
                     current_hp, current_stamina, current_mana,
                     avatar_path nullable)                        -- avatar upload manual dulu
skills               (id, subclass_id, tier, name, description,
                     scaling_stat, stamina_cost, mana_cost,
                     cooldown_seconds, base_multiplier,
                     element_id nullable, branch nullable)
character_skills    (id, character_id, skill_id, unlocked_at)
```

Ini masih bisa berkembang (inventory, item, quest) tapi untuk fase sekarang cukup fokus di karakter + battle system dulu, biar sejalan sama Arena Tarung yang sudah ada di pokemon.id.

---

## 6. Catatan Balance

- Berserker & Paladin sengaja dibuat "ekstrem" (all-in satu jalur damage) biar punya identitas kuat, sementara Blade Knight & Spellblade jadi opsi hybrid yang lebih fleksibel.
- Tanker sengaja **tidak** dikasih physical/magic damage tinggi sama sekali — biar perannya jelas sebagai damage soak, bukan damage dealer sekunder. Kalau dirasa terlalu lemah pas battle testing, gampang dinaikkan sedikit.
- Mage & Saint sama-sama fragile (def rendah), bedanya Mage burst tinggi tanpa buff/heal, Saint lebih rendah damage tapi support.

---

## 7. Sistem Monster & Battle (v1)

### Pola Combat (Strong/Weak)
Setiap monster punya 1 pola yang dia **kuat lawan** dan 1 pola yang dia **lemah lawan**. Pola = kombinasi cara serang x jenis damage:

| Cara Serang | Jenis Damage |
|---|---|
| Close (jarak dekat) | Physical |
| Range (jarak jauh) | Magic |
| Area (AoE) | |

6 kombinasi: `close_physical`, `range_physical`, `area_physical`, `close_magic`, `range_magic`, `area_magic`.

**Belum diimplementasikan**: skill milik karakter belum punya klasifikasi close/range/area (baru scaling_stat physical/magic). Ini next step biar strong/weak monster bisa dicocokkan otomatis ke skill yang dipakai player pas battle.

### Struktur Monster
- name, level, type (Slime/Beast/Undead/Humanoid/Insect/Spirit/Elemental/Construct, dst — bebas nambah tipe baru)
- element (opsional, reuse tabel `elements` yang sama dengan Mage subclass — Fire/Water/Earth/Wind, null kalau non-elemental)
- strong_against / weak_against (pola combat)
- stat: hp, physical_damage, physical_defense, magic_damage, magic_defense
- exp_reward
- min_party_level (rekomendasi level minimum party buat lawan monster ini)
- special_skill (nama + deskripsi, contoh: regen HP per giliran, poison, buff diri sendiri, dst — flavor text dulu, belum ada logic battle beneran)

### Roster Awal (12 monster, level 1-6)
Slime Api, Slime Air, Tikus Raksasa, Kelelawar Gua, Bandit Pemula, Laba-laba Beracun, Serigala Hutan, Zombie Reyot, Peri Air, Elemental Api Kecil, Golem Batu Kecil, Harpy Muda.

### Battle System (konsep, belum diimplementasikan)
- Round-based mirip Pokemon/FF klasik.
- Player pilih 2-3 karakter (dari roster `characters`) buat masuk party lawan 1 monster.
- Requirement lawan monster tertentu: level party, mungkin nanti juga tipe/elemen tertentu.
- **Belum ada**: battle engine (turn order, damage calculation, UI battle screen). Ini scope besar terpisah, next milestone setelah skill tree tier 2 & assign skill ke karakter selesai.

---

## 8. Sistem Map & Spawn Point (v1)

### Struktur
- `maps`: area petualangan (Hutan Awal, Reruntuhan Kuno, dst), punya level range.
- `spawn_points`: titik lokasi di dalam map (misal "Gua Kelelawar"), posisi (pos_x, pos_y dalam persen buat markering di atas background map), respawn_seconds, last_defeated_at.
- `spawn_point_monster`: pivot weighted — monster apa aja yang bisa muncul di titik itu + bobotnya.
- `encounters`: histori tiap kali monster berhasil di-roll dari suatu spawn point (status pending/won/lost/fled).

### Algoritma Roll Monster (`SpawnPoint::rollMonster()`)
1. Cek cooldown: `last_defeated_at + respawn_seconds > now()` → kalau masih cooldown, return null (monster belum muncul).
2. Ambil pool monster spawn point + weight masing-masing.
3. Total-in semua weight, `random_int(1, total)`, jalan kumulatif sampai ketemu monster yang kena roll (standar weighted random / loot table).
4. Return monster terpilih, dibungkus jadi record `Encounter` (status pending).
5. Nanti setelah battle system jadi: menang → set `last_defeated_at = now()` di spawn point (mulai cooldown), kasih EXP ke party, update status encounter jadi won/lost/fled.

### Roster Awal
**Hutan Awal** (level 1-3): Tepi Hutan, Gua Kelelawar, Jalan Setapak, Kolam Tenang.
**Reruntuhan Kuno** (level 3-6): Gerbang Reruntuhan, Sarang Laba-laba, Kuil Terendam, Puncak Menara.

### Yang belum diimplementasikan
- Background art peta (sekarang masih placeholder gradient, marker spawn point posisinya persentase jadi siap dipasangi gambar peta beneran kapan aja tanpa ubah data).
- Battle system beneran — `explore()` sekarang cuma nge-roll monster dan nampilin hasilnya, belum lempar ke battle screen.
- EXP/reward belum kepotong ke karakter (karena battle belum ada).
- Level scaling: monster levelnya masih fix dari seeder, belum random dalam suatu range.

---

## 9. Battle Engine (v1)

### Alur
1. `spawn_point.explore()` roll monster (sistem lama) -> bikin `Encounter` (status pending).
2. Player buka `/encounters/{id}/select` -> pilih 2-3 karakter dari roster.
3. `BattleService::startBattle()` -> bikin `Battle` + snapshot `BattleParticipant` per karakter
   (HP/stamina/mana disalin dari karakter saat battle dimulai, biar battle gak ganggu state
   asli karakter kalau di-refresh/reload).
4. Layar battle (`/battles/{id}`): tiap karakter hidup pilih 1 skill dari skill pool subclass-nya,
   klik "Jalankan Ronde" -> submit semua aksi sekaligus.
5. `BattleService::resolveRound()`:
   - Tiap karakter hidup (urut) pakai skill -> hitung damage -> potong HP monster.
   - Kalau monster masih hidup setelah semua karakter jalan -> monster balas 1 karakter hidup
     acak dengan physical/magic attack (pilih yang stat-nya lebih tinggi).
   - Cek menang (monster HP 0) / kalah (semua karakter is_alive=false) / lanjut ronde berikutnya.
   - Menang -> `spawn_point.last_defeated_at` di-set (mulai cooldown), `encounter` jadi won,
     tiap karakter dapat full `exp_reward` dari monster.

### Damage Formula
```
raw = offense_stat * skill.base_multiplier
mitigated = max(raw - defense_stat * 0.5, raw * 0.1)   // minimal 10% chip damage tetap masuk
pattern = "{skill.combat_range}_{skill.scaling_stat}"    // e.g. close_physical
if pattern == monster.weak_against:   mitigated *= 1.5   // "(Efektif!)"
if pattern == monster.strong_against: mitigated *= 0.5   // "(Kurang efektif...)"
damage = round(mitigated), minimal 1
```
Monster nyerang balik pakai formula yang sama tapi tanpa skill (base stat monster vs defense stat subclass karakter), gak ada pattern matching (monster gak "strong/weak lawan" pola serangan player, cuma sebaliknya).

### combat_range di Skill
Kolom baru `skills.combat_range` (close/range/area) di-backfill otomatis dari nama skill pakai keyword matching (`CombatRangeSeeder`) — bukan diklasifikasi manual satu-satu. Kalau ada yang salah klasifikasi, tinggal edit langsung row-nya atau tambah keyword baru di seeder lalu re-run.

### Simplifikasi v1 (belum akurat/lengkap)
- **Skill pool per battle** = seluruh skill subclass karakter (bukan 3 skill+1 ultimate yang "dipilih" sesuai konsep awal) — karena fitur assign/pilih loadout ke karakter belum dibangun.
- **Special skill monster** (regen HP, poison, dst) belum ada efeknya sama sekali di battle — kolom `special_skill_name/description` masih flavor text doang.
- **Stamina/mana** dipotong tapi gak ada validasi cukup/enggak — kalau minus, di-clamp ke 0, skill tetap jalan tanpa penalti.
- **EXP** dikasih full ke semua karakter yang ikut battle (bukan dibagi), belum ada level-up logic (exp numpuk doang di kolom `characters.exp`, belum ada threshold naik level).
- **Turn order** simplistic: semua karakter jalan duluan tiap ronde (gak ada speed stat), baru monster.
- **Party bisa "Kabur"** kapan aja tanpa penalti apapun.

---

## 10. Semi-Auto Battle & Guild Adventure (v2)

### Perubahan dari v1
Battle v1 butuh player pilih skill manual tiap ronde (banyak klik). Sekarang jadi **semi-auto**: player cuma pilih party (2-3 karakter) sekali di awal, battle langsung di-resolve penuh di server (`BattleService::autoResolve()`), lalu frontend "memutar ulang" battle log secara animasi ~15-30 detik biar tetap kerasa kayak nonton pertarungan, bukan cuma hasil instan.

### Guild Adventure (hub baru)
Halaman `/guild` jadi entry point utama:
1. Pilih 2-3 karakter (party).
2. Pilih salah satu:
   - **Misi Cepat** — sistem otomatis carikan monster yang levelnya paling dekat sama rata-rata level party (`BattleService::findQuickMissionMonster()`), langsung mulai battle.
   - **Jelajahi Peta** — party yang udah dipilih disimpan di session, lempar ke `/maps` biar player pilih spawn point sendiri (party gak perlu dipilih ulang di step berikutnya).

### AI Auto-Pick Skill (`BattleService::autoPickSkill()`)
Tiap giliran, karakter otomatis pakai skill dengan `base_multiplier` tertinggi yang **masih affordable** (stamina/mana cukup). Kalau semua skill gak affordable, giliran itu di-skip (cuma bertahan). Belum ada AI yang lebih pintar (misal prioritaskan skill sesuai weak_against monster) — itu next step kalau battle udah kerasa terlalu random.

### Structured Battle Log
`battle_log` sekarang bukan array of string, tapi array of **snapshot**:
```json
{ "text": "...", "monster_hp": 32, "participants": { "5": {"hp": 80, "stamina": 40, "mana": 20, "is_alive": true} } }
```
Ini yang bikin frontend bisa animasikan HP bar turun sinkron sama log yang muncul, bukan cuma teks doang.

### Battle Show — Layout Kolom
- Panel monster di atas (avatar + HP bar).
- Kolom party (2-3, responsive col-md-4) — tiap kolom: avatar, HP/SP/MP bar, daftar skill pool (referensi, bukan interaktif lagi karena udah auto).
- Battle log di bawah, muncul progresif ngikutin animasi step-by-step. Ada tombol "Lewati" buat skip langsung ke hasil akhir.

### Yang belum diimplementasikan
- "Ambil Misi" masih sebatas "Misi Cepat" (random monster level-matched) — belum ada sistem misi terstruktur (objektif, reward khusus, dll).
- Level matching masih berbasis level karakter individual, belum ada konsep "level pemain/akun" karena belum ada auth.
- Endpoint battle manual per-ronde (`action()`) udah dihapus dari controller — kalau nanti mau balikin mode manual (misal buat player yang mau kontrol penuh), perlu dibangun ulang terpisah dari alur auto ini.

### Update v2.1: Cooldown skill sekarang beneran dicek
Ditemukan pas audit kesesuaian skill vs gamestyle baru — `cooldown_seconds` di tabel skills dulu **gak pernah dicek** di `autoPickSkill()`, jadi karakter bisa spam Ultimate tiap ronde selama resource cukup, bikin 4 dari 8 skill tiap subclass nyaris gak pernah kepake. Sekarang:
- `battle_participants.skill_cooldowns` (json, `{skill_id: ronde_terakhir_dipakai}`) nge-track kapan tiap skill terakhir dipakai.
- `cooldown_seconds` ditranslate ke "berapa ronde terkunci" pakai asumsi ~2.5 detik/ronde (`ceil(cooldown_seconds / 2.5)`), sesuai pacing animasi playback di frontend.
- Efeknya: Ultimate (cooldown 30 detik ≈ 12 ronde) sekarang beneran jarang kepake, skill tier 1 lain jadi ikut kepake pas Ultimate lagi cooldown.

### Update v2.2: Ultimate mulai battle dalam kondisi cooldown
Sebelumnya Ultimate baru kena cooldown SETELAH dipakai pertama kali, jadi masih bisa langsung dipakai di ronde 1. Sekarang tiap `BattleParticipant` dibuat dengan Ultimate (tier 3) langsung di-set "udah dipakai di ronde 0" — jadi dari awal battle Ultimate udah cooldown, gak bisa langsung nge-ultimate di ronde pertama. Selaras juga sama cost mana/stamina Ultimate yang emang udah didesain besar (contoh: Murka Tanpa Ampun butuh 40 mana — persis pool penuh Warrior — jadi natural cuma sekali pakai per battle pun tanpa cooldown).

### Masih belum diselesaikan (butuh keputusan desain, sengaja belum saya ubah sepihak)
- **Resource gak regen antar ronde** — sekali stamina/mana abis, karakter kejebak pakai skill termurah/gratis doang sampe battle selesai. Bisa ditambah regen kecil per-ronde kalau battle mulai kerasa monoton di late-game.
- **2 pilihan Ultimate (fisik & magic) per subclass jadi gak ada bedanya secara build** — karena AI cuma pilih skill ber-multiplier tertinggi yang usable, bukan player yang milih sesuai gaya main. Kalau mau balikin makna "pilihan build", butuh salah satu dari: (a) UI buat player pre-set loadout 3 skill+1 ultimate sebelum battle (baru AI pilih dari situ aja, bukan dari 8 skill penuh), atau (b) AI dikasih preferensi/personality biar konsisten pilih 1 ultimate tertentu per karakter.

---

## 11. Secondary Stats (v2.3) — Regen, Evasion, Accuracy, Critical

Ditambah biar battle lebih "smooth" dan gak cuma damage-race lurus. Semua di level **subclass** (karakter) dan **monster**.

### Stat baru per subclass
| Stat | Fungsi |
|---|---|
| `mana_regen` | MP pulih tiap awal ronde (dibatasi max pool dari GameClass) |
| `stamina_regen` | SP pulih tiap awal ronde |
| `agility` | % evasion — makin tinggi, makin sering musuh meleset nyerang karakter ini |
| `accuracy` | % akurasi dasar nyerang — dikurangi `agility` musuh buat nentuin hit chance |
| `critical_hit_bonus` | % bonus damage pas critical hit kena |
| `critical_luck` | % chance critical hit kejadian tiap serangan |

Baseline per class (Warrior/Tanker/Mage/Saint), dengan beberapa override flavor (Berserker crit_luck lebih tinggi, Aeromancer agility lebih tinggi karena elemen angin, Cleric mana_regen lebih tinggi, dst) — liat `SecondaryStatsSeeder`.

### Stat baru per monster
`agility` dan `accuracy` — sama fungsinya, dipakai buat hit-chance monster nyerang balik. Nilai per monster disesuaikan flavor (Kelelawar Gua/Harpy Muda gesit tinggi agility, Zombie Reyot/Golem Batu Kecil lambat rendah agility).

### Formula Hit Chance
```
hitChance = clamp(100 + attacker.accuracy - 90 - defender.agility, 50, 99)
roll 1-100 > hitChance => MELESET (0 damage)
```
Base accuracy 90 dipakai sebagai titik nol biar subclass/monster dengan accuracy persis 90 dan lawan agility 0 itu ~100% hit — makin tinggi agility lawan, makin gede kemungkinan meleset. Di-clamp 50-99% biar gak pernah "pasti kena" atau "pasti meleset" total.

### Critical Hit
Cuma berlaku buat **serangan karakter ke monster** (monster gak crit, biar gak berasa gak adil buat player). Roll `critical_luck`%, kalau kena, damage dikali `(1 + critical_hit_bonus/100)`.

### Regen
Dijalankan di **awal tiap ronde**, sebelum siapapun bertindak — HP gak regen (cuma lewat item/skill heal nanti), SP & MP aja.

---

## 12. Base Stats jadi "Computed" dari 4 Stat Inti (v2.4)

Perombakan besar — hampir semua secondary stat sekarang **dihitung otomatis** dari `base_physical_damage`, `base_physical_defense`, `base_magic_damage`, `base_magic_defense` yang udah ada di tiap subclass, bukan angka manual baru. Prinsipnya: "base stats ambil dari char yang udah kita bikin", gak nambah data baru yang gak nyambung ke apa yang udah ada.

### Formula (`Subclass` model, computed accessor via `$appends`)
| Stat | Formula | Catatan |
|---|---|---|
| Base HP | Physical Defense + Magic Defense | Gantiin `GameClass.base_hp` yang lama |
| Base MP | Magic Attack + Magic Defense | Gantiin `GameClass.base_mana` |
| Base SP | Physical Attack + Physical Defense | Gantiin `GameClass.base_stamina` |
| Mana Regeneration | 10% dari Base MP (dibulatkan, min 1) | Angka 10% keputusan saya sendiri, belum ada instruksi pasti — gampang diubah di `Subclass::getManaRegenAttribute()` |
| Stamina Regeneration | 10% dari Base SP (dibulatkan, min 1) | Sama, lihat `getStaminaRegenAttribute()` |
| Agility | Physical Attack + Magic Attack | Sisi **ofensif** — dipakai pas karakter nyerang monster |
| Evasion | Physical Defense + Magic Defense | Sisi **defensif** — dipakai pas monster nyerang karakter. Kebetulan formulanya sama kayak Base HP, jadi 2 stat ini akan selalu senilai per subclass |
| Critical Hit | flat 20% semua subclass | Kolom asli (bukan computed), disamain semua ke 20% |
| Critical Luck | flat 10% semua subclass | Kolom asli, disamain semua ke 10% |

`GameClass.base_hp/base_stamina/base_mana` **udah gak dipakai lagi** buat pool resource (jadi vestigial/gak berfungsi) — semua yang dulu baca dari situ (character creation, battle regen cap, display bar) sekarang baca dari `Subclass::base_hp/base_mp/base_sp`. Kolomnya sengaja gak saya hapus (masih ada di tabel `classes`), cuma udah gak dipakai di logic manapun.

### Battle formula update
- Karakter nyerang monster: hit chance pakai **Agility** karakter vs **agility** (evasion) monster.
- Monster nyerang karakter: hit chance pakai **accuracy** monster vs **Evasion** karakter.
- Monster tetap pakai kolom `agility`/`accuracy` yang lama (gak ikut berubah, itu udah jalan baik).

### "Bisa ditambah exp" — belum diimplementasikan
Semua stat di tabel yang "bisa ditambah exp" itu baru **niat desain**, belum ada sistem level-up/spend-exp buat nambah stat. `character.exp` sekarang cuma numpuk angka doang dari menang battle, belum ngefek ke stat manapun. Ini next milestone kalau mau bikin progression system beneran.

### UI: Characters/Show — model "FIFA stat bar"
Base Stats section dipindah **langsung di bawah Resource** (bukan section terpisah jauh), dan model tampilannya diganti dari kartu kotak jadi **bar horizontal** (label kiri, bar isi warna, angka kanan) — mirip tampilan stat pemain di game FIFA. HP/SP/MP di Resource juga masing-masing dikasih warna beda (merah/oranye/ungu) dengan progress bar sendiri, font diperbesar, dan line-spacing dirapiin.

---

## 13. Sistem Login Sederhana (v3.0)

Login akhirnya masuk — dipicu kebutuhan: party battle harus punya minimal 1 karakter beneran punya player, bukan cuma NPC. Sengaja dibuat **sesimpel mungkin**:

### Yang dipakai
- **Username + password aja**, gak pakai email (kolom email di tabel `users` dijadiin nullable, `username` baru ditambah unik).
- Auth pakai fitur bawaan Laravel (`Auth` facade, `Hash` via cast `'hashed'` di model `User`) — **gak nambah composer package baru** sama sekali, biar gak kejadian masalah `composer.lock` lagi kayak sebelumnya.
- Session-based (standard Laravel web auth), bukan token/API.

### Yang butuh login
- Bikin karakter (`/characters/create`)
- Guild Adventure (pilih party, misi cepat, explore)
- Battle (pilih party dari encounter, lihat battle)

### Yang TETAP publik (gak perlu login)
- Codex (class/subclass/skill), Bestiary (monster), Peta (liat doang), Roster karakter (liat doang)

### Aturan party
`ValidatesPartyOwnership` trait — dipakai di `GuildController` dan `BattleController`. Party (2-3 karakter) harus punya **minimal 1 karakter dengan `user_id` = user yang login**. NPC (user_id null) boleh diajak asal ada minimal 1 karakter beneran punya sendiri di situ. Divalidasi server-side, badge "Milikmu" ditampilkan di UI biar player tau mana yang kehitung.

### Migrasi data lama
Karakter yang udah ada sebelum fitur ini (termasuk 14 NPC yang di-seed sebelumnya) otomatis `user_id = null` — NPC memang sengaja gitu selamanya, tapi kalau ada karakter player lama dari sebelum sistem login ada, mereka juga jadi "tak bertuan" karena gak ada cara tau siapa yang bikin. Practically di tahap ini gak masalah karena baru mulai testing.

---

## 14. Layar Kemenangan (VS) & Efek Suara Battle (v3.1)

### Layar VS ala pokemon.id
Pas battle menang, sekarang muncul tampilan **karakter utama vs monster** side-by-side:
- Karakter utama = karakter di party yang `user_id`-nya sama dengan user yang login (fallback ke participant pertama kalau gak ketemu, misal liat battle orang lain).
- Full body karakter (dari subclass) ditampilkan normal, warna sesuai palet participant-nya.
- Full body monster ditampilkan **grayscale + gelap** (`filter: grayscale(1) brightness(0.55)`) dengan label **"K.O."** miring di atasnya, biar keliatan jelas monsternya udah kalah.
- Kalau monster/karakter belum punya art (`full_body_path` null), fallback ke hex badge inisial.

### Efek Suara (synthesized, bukan file audio)
`resources/js/battleAudio.js` — semua suara **digenerate langsung di browser pakai Web Audio API** (oscillator beep, bukan file `.mp3`/`.wav`). Alasannya: gak perlu sourcing/lisensi aset suara, ukuran bundle tetap kecil, dan gampang di-tweak (tinggal ubah frekuensi/durasi).

| Suara | Trigger | Karakteristik |
|---|---|---|
| `hit` | Baris log mengandung "damage" | Square wave turun (220→90Hz) |
| `critical` | Baris log mengandung "CRITICAL" | Sawtooth + square susul, lebih tebal |
| `miss` | Baris log mengandung "MELESET" | Sine naik (600→950Hz), ringan |
| `cast` | Monster pertama kali muncul | Triangle naik, kesan "start" |
| `victory` | Battle selesai status won | 4 nada naik (fanfare sederhana) |
| `defeat` | Battle selesai status lost | 4 nada turun (sawtooth) |

Ada tombol toggle 🔊/🔇 di pojok kanan atas layar battle buat matiin suara. Browser autoplay policy ditangani defensif (AudioContext di-resume on-demand, gagal = diem aja, gak nge-crash).

---

## 15. Upgrade Stat Pakai EXP + Layar Battle End yang Lebih Lengkap (v3.2)

### Upgrade Stat (akhirnya "bisa ditambah exp" beneran jalan)
Kolom baru di `characters`: `bonus_physical_damage`, `bonus_physical_defense`, `bonus_magic_damage`, `bonus_magic_defense`, `bonus_agility`, `bonus_evasion`, `bonus_critical_hit`, `bonus_critical_luck` — masing-masing mulai dari 0, naik tiap kali di-upgrade pakai EXP.

**Effective stat** = base subclass + bonus karakter. Contoh: `effective_physical_damage = subclass.base_physical_damage + character.bonus_physical_damage`. Base HP/MP/SP/Regen ikut kehitung ulang dari effective stat (bukan base subclass mentah lagi), jadi upgrade Physical/Magic Defense otomatis nambah Base HP juga (sesuai formula lama).

**Biaya upgrade**: `(bonus_saat_ini + 1) × 15 EXP` buat stat biasa, `× 25 EXP` buat Critical Hit/Critical Luck (karena efeknya lebih besar per poin). Beban naik makin mahal tiap kali di-upgrade — poin pertama 15 EXP, kedua 30, ketiga 45, dst.

**Endpoint**: `POST /characters/{id}/upgrade` (body: `stat`), cuma bisa dipanggil sama pemilik karakter (`character.user_id === auth()->id()`), validasi EXP cukup di server. Tombol "+" muncul di tiap stat yang upgradable di halaman detail karakter — cuma keliatan kalau kamu yang login adalah pemilik karakter itu.

**Battle sekarang pakai effective stat**, bukan base subclass mentah — jadi upgrade beneran ngefek ke damage/defense/hit-chance/crit di pertarungan.

### Layar Battle End — 3 kondisi beda
- **Menang**: karakter utama normal vs monster grayscale + label "K.O." (sudah ada dari v3.1)
- **Kalah**: dibalik — karakter utama grayscale + label "TUMBANG", monster normal warna
- **Mundur (kena limit ronde)**: layar lebih sederhana, ikon bendera putih 🏳️ + teks "Party Menyerah"

### Auto-redirect ke Guild
Begitu battle selesai (menang/kalah/mundur), muncul countdown "Kembali ke Guild otomatis dalam Xs..." (5 detik) sebelum auto-navigate ke `/guild`. Player masih bisa klik "Kembali ke Guild" atau "Peta" manual buat skip nunggu. Ini nyelesain masalah "kejebak di layar battle lama" kalau reopen app/browser — sekarang battle yang udah selesai gak nge-gantung nunggu aksi manual.
