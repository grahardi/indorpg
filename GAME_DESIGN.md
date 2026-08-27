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

---

## 16. Battle URL Token & Anti-Replay History (v3.3)

### URL battle gak lagi pakai ID urut
Sebelumnya `/battles/1`, `/battles/2` — gampang ditebak/di-enumerate orang lain. Sekarang:
- Kolom `battles.token` (random 14 karakter, unik, di-generate otomatis pas battle dibuat via `Battle::booted()`).
- `Battle::getRouteKeyName()` di-override return `'token'` — semua route yang pakai `{battle}` (implicit model binding) otomatis pakai token, bukan `id`, tanpa perlu ubah sintaks route sama sekali.
- Controller yang redirect ke battle sekarang pass **model instance** (`redirect()->route('battles.show', $battle)`), bukan `$battle->id` — Laravel otomatis resolve ke token lewat `getRouteKeyName()`.

### Anti-"replay" via browser history
Battle di sistem kita **auto-resolve penuh** sebelum halaman show pernah dirender — jadi begitu battle page pertama kali kebuka, statusnya udah final (won/lost/fled), bukan 'ongoing'. Ini bikin gak bisa asal cek `status !== ongoing` buat nge-block, karena itu juga true di kunjungan PERTAMA yang sah.

Solusinya: kolom `battles.viewed_at` (nullable timestamp).
- Kunjungan pertama: `viewed_at` masih null -> ditampilkan normal, langsung di-set `now()`.
- Kunjungan kedua dst (misal user pencet Back di browser ke battle yang udah kelar): `viewed_at` udah keisi -> redirect ke `/guild` dengan pesan "Battle ini udah pernah selesai dan dilihat sebelumnya", gak ditampilkan ulang.

Battle jadi murni **log/history sekali-lihat**, bukan halaman yang bisa "dibuka ulang jadi hidup lagi".

---

## 17. Loadout Battle (4 skill + 1 ultimate) & Layout Battle Compact (v3.4)

### Loadout, bukan pool penuh 8 skill
Sebelumnya battle pakai SEMUA skill subclass (6 tier1 + 2 tier3). Sekarang tiap battle cuma pakai **4 skill biasa + 1 ultimate**:
- Kalau karakter **udah punya loadout manual** (diatur di halaman profil, tersimpan di pivot `character_skills`) — pakai itu.
- Kalau **belum diatur** (NPC atau karakter baru) — random 4 tier1 + 1 tier3 dari subclass pool tiap battle dimulai (`BattleService::resolveLoadout()`).
- Loadout final battle disimpan di `battle_participants.loadout_skill_ids` — `autoPickSkill()` cuma milih dari 5 skill ini, bukan 8.

### Pilih Loadout Manual (halaman profil karakter)
Section baru "Loadout Battle" di `/characters/{id}` — cuma muncul editable buat pemilik karakter:
- Skill tier 1 & tier 3 ditampilkan terpisah, klik buat pilih/batalkan (maksimal 4 tier1 + 1 tier3).
- Tombol "Simpan Loadout" aktif kalau pas 4+1, POST ke `/characters/{id}/loadout`, di-validasi server-side (harus dari subclass yang sama, persis 4+1).
- Kalau bukan pemilik atau belum login, cuma liat read-only (atau pesan "belum diatur, random dipakai").

### Layout Battle — Monster Selalu Kelihatan
Panel monster sekarang **sticky** (nempel di atas layar, di bawah nav) selama scroll — gak akan ilang dari pandangan pas scroll ke party/skill/log, di PC maupun mobile. Semua card di battle (party, monster) dibikin lebih compact (avatar lebih kecil, padding dikurangi, font-size diperkecil) biar muat rapi di layar sempit tanpa perlu scroll horizontal.

---

## 18. Filter Karakter, NPC "On Mission", & Sistem Level-Up (v3.5)

### Filter visibilitas karakter
- **Roster (`/characters`)**: sekarang cuma nampilin karakter **milik sendiri** (query `where('user_id', auth()->id())`). Halaman ini juga dipindah ke grup `auth` — gak masuk akal diakses kalau belum login karena isinya personal.
- **Guild & Battle Select**: nampilin karakter **milik sendiri + semua NPC**, karakter milik pemain lain **disembunyikan sementara** (`where('user_id', auth()->id())->orWhere('is_npc', true)`).

### NPC "On Mission" (random unavailable) — **DIMATIKAN SEMENTARA (bug)**
~~Kolom baru `characters.busy_until` (nullable timestamp). Tiap buka Guild/Battle Select, NPC yang lagi gak busy punya **25% kemungkinan** ke-roll jadi "on mission" selama 3-15 menit acak.~~

**Update**: fitur ini dimatiin sementara setelah kejadian di produksi — semua 14 NPC ke-mark "Sedang Misi" bersamaan, bikin party gak bisa dibentuk sama sekali. Kemungkinan besar penyebabnya: reload halaman berkali-kali numpuk banyak roll 25% independen dalam window waktu yang sama, jadi lama-lama semua NPC kena. Kolom `busy_until`, trait `RollsNpcAvailability`, dan validasi `ensureNoBusyNpcInParty()` semua **masih ada di kode**, cuma pemanggilannya di-comment di `GuildController`/`BattleController`. Migration baru nge-reset semua NPC yang kejebak (`busy_until = null`).

**Next step kalau mau diaktifkan lagi**: perbaiki logic-nya biar gak numpuk — misal cache/session-based cooldown per-request, atau reset roll cuma sekali per beberapa menit pakai scheduled job, bukan re-roll independen tiap page load.

### Sistem Level-Up (akhirnya beneran naik level)
Sebelumnya `character.level` statis dari awal bikin karakter, gak pernah naik walau EXP numpuk. Sekarang:
- Kolom baru `characters.total_exp` — akumulasi EXP **seumur hidup**, gak pernah berkurang (beda dari `exp` yang bisa dipotong buat upgrade stat).
- Formula: `totalExpRequiredForLevel(level) = round(100 * (level-1)^1.6)`. Level 2 = 100 XP, Level 3 = ~303 XP, Level 4 = ~580 XP, Level 5 = ~919 XP — **naik makin curam tiap level**, sesuai instruksi "semakin tinggi semakin susah".
- Tiap menang battle: `exp` DAN `total_exp` sama-sama nambah dari `monster.exp_reward`. Abis itu `Character::syncLevel()` ngecek apakah `total_exp` udah lewatin threshold level berikutnya — kalau iya, level naik (bisa lompat lebih dari 1 level kalau EXP reward-nya gede banget), dicatat di battle log ("X naik ke Level Y!").
- Monster level tinggi udah otomatis kasih EXP lebih banyak dari desain awal (Slime Api lv1 = 15 EXP, Golem Batu Kecil lv5 = 50 EXP, Harpy Muda lv6 = 60 EXP) — jadi "monster tingkat tinggi EXP gain banyak" udah otomatis kepenuhi dari data yang udah ada, gak perlu tuning tambahan.
- Halaman karakter (`/characters/{id}`) sekarang nampilin progress bar "Menuju Level X" (total_exp saat ini vs threshold level berikutnya).

---

## 19. Halaman Cara Bermain/FAQ & Restrukturisasi Stat 3-Layer (v3.6)

### Halaman Cara Bermain (`/guide`, publik)
Panduan singkat 6 bagian (Bikin Karakter → Loadout → Guild → Misi Cepat/Peta → Battle → EXP/Level/Upgrade) plus 5 FAQ. Diakses dari nav "Cara Main", gak perlu login.

### Stat sekarang 3 layer
Sebelumnya cuma 2 layer (`subclass base` + `character bonus`). Sekarang:

```
Effective Stat = Leveled Base (subclass base + pertumbuhan level) + Bonus (upgrade EXP)
```

**Base Stats** (Physical Attack, Physical Defense, Magic Attack, Magic Defense) — **GAK BISA di-upgrade manual lagi**, naik OTOMATIS tiap level:
```
levelGrowth(stat) = floor(subclass.base_{stat} * 10% * (level - 1))
```
Level 1 = 0 pertumbuhan. Formula ini elegan karena **otomatis ngikutin profil excel yang udah ada** tanpa perlu tabel growth baru per subclass — stat yang base-nya udah TINGGI (misal Physical Attack Berserker = 45) naik CEPAT tiap level (4-5 poin/level), sedangkan stat yang RENDAH (misal Magic Attack Berserker = 10) naik SANGAT LAMBAT (~1 poin/level). Persis sesuai instruksi "yang tinggi cepat, yang rendah lambat, sesuai excel kemarin".

**Bonus Stats** (Bonus Physical Attack, Bonus Physical Defense, Bonus Magic Attack, Bonus Magic Defense, Bonus Agility, Bonus Evasion, Bonus Critical Hit, Bonus Critical Luck) — ini yang **masih bisa di-upgrade pakai EXP** (tombol +), mulai dari 0. Formula biaya upgrade gak berubah dari sebelumnya.

### UI Characters/Show
Dipisah jadi 2 card terpisah: **"Base Stats"** (nampilin `leveled_*`, gak ada tombol +, note "naik otomatis tiap level sesuai profil subclass") dan **"Bonus Stats"** (nampilin `bonus_*` mentah + tombol upgrade, dengan hint kecil "Total: X" nunjukkin hasil gabungan base+bonus yang beneran dipakai di battle).

### Battle gak perlu diubah
`BattleService` udah dari awal pakai `character->effective_*` (bukan `subclass->base_*` langsung), jadi otomatis dapet manfaat level growth begitu model-nya diupdate — gak ada perubahan kode battle sama sekali.

---

## 20. Rename Agility → Accuracy + Stat Point Gratis dari Level (v3.7)

### Rename: Agility → Accuracy
"Agility" karakter dari awal fungsinya emang akurasi nyerang (dipakai attacker buat ngelawan evasion monster), bukan evasion diri sendiri (itu udah ada stat terpisah: **Evasion**). Nama "Agility" bikin bingung — di-rename jadi **Accuracy** biar jelas kenapa "sering MELESET" kalau stat ini rendah. Monster tetap pakai nama `agility` (fungsinya beneran evasion buat monster, gak diubah).

Migration: `characters.bonus_agility` → `bonus_accuracy` (rename kolom via `ALTER TABLE ... RENAME COLUMN`, bukan drop+recreate, jadi data lama gak ilang).

### Stat Point Gratis dari Naik Level
Sebelumnya cuma ada 1 cara nambah Bonus Stats: potong EXP (makin mahal tiap kali). Sekarang ada jalur ke-2 yang **gratis**:
- Tiap naik level dapat **+5 stat point**.
- Level kelipatan 5 (5, 10, 15, dst) dapat **+10** (bukan +5).
- Stat point ini disimpan di kolom baru `characters.stat_points`, terpisah dari `exp` dan `total_exp`.
- Tombol "+" di tiap Bonus Stat **prioritas pakai stat_points dulu** (gratis, gak motong apa-apa) — baru kalau `stat_points` abis, fallback ke potong EXP kayak sebelumnya.
- UI nunjukkin "Stat Point Gratis: X" di section Resource, dan tooltip tombol + berubah jadi "gratis, pakai stat point" kalau lagi ada stat point nganggur.

Formula EXP-buat-level makin curam (100, ~303, ~580, ~919...) jadi total stat point gratis yang kekumpul juga proporsional sama effort — misal sampe level 5 total dapat 5+5+5+5+10=30 stat point gratis, sepadan sama ~919 total EXP yang harus dikumpulin buat nyampe situ.

---

## 21. Redesign Layar Battle (mobile-first, sesuai sketsa v2) + hapus display EXP redundan (v3.8)

### Characters/Show.jsx
Baris "EXP (bisa dipakai upgrade): X" dihapus dari tampilan — sekarang stat point gratis dari level jadi sorotan utama. **Catatan**: EXP masih tetap dipakai di backend sebagai fallback upgrade kalau stat_points abis (gak dihapus fungsinya, cuma gak ditonjolkan lagi di UI).

### Battle Screen — redesign total (layar sedang berjalan)
User kasih 2 sketsa layout, pilih yang lebih mobile-friendly (desain #2 — Main Player dipisah dari party lain). Diadaptasi jadi flex-wrap centered (bukan grid kaku) biar reflow natural di layar sempit:

- **Monster**: full body image (bukan avatar bulat lagi) di paling atas, card kecil center, HP bar pendek (~130px, bukan full-width).
- **Party**: full body image tiap karakter (ukuran kecil ~46x92px), card compact (~108px lebar), HP/SP/MP masing-masing bar pendek (~80px, bukan stretch full width).
- **Main Player** (karakter yang login) dikasih badge emas "KAMU" di atas card-nya, biar kebeda dari party member lain.
- **Skill Pool/Loadout dihapus total** dari layar battle — sesuai instruksi "gak perlu tampilin jurus kedepannya".
- Monster+Party masih satu blok sticky bareng (dari v3.4), battle log di bawahnya gak berubah.

Prinsip desain: bar pendek & fixed-width (bukan `flex-grow` full-width) di semua tempat, biar keliatan rapi baik di HP kecil maupun desktop tanpa perlu breakpoint khusus.

---

## 22. Battle Arena Scene — background asli + monster dikroyok party (v4.0)

Perubahan besar: battle screen bukan lagi kartu-kartu stat, tapi **scene arena beneran** — background asli, monster gede di belakang, party di depan "ngeroyok" dari bawah, cuma 1 bar (HP) per karakter/monster (bukan HP+SP+MP tiga-tiganya).

### Background per tema map + varian boss
4 background disiapkan (`public/images/battle-backgrounds/`): `forest-regular.jpg`, `forest-boss.jpg`, `ruins-regular.jpg`, `ruins-boss.jpg`. Ditentukan otomatis lewat `Monster::battleBackgroundPath()`:
- **Tema**: dari map tempat monster itu muncul (relasi `spawnPoints->map`, sama pola kayak background avatar monster sebelumnya) — nama map mengandung "Reruntuhan" → tema ruins, selain itu → forest.
- **Varian**: kalau `monster.level >= map.max_level` (monster paling kuat di map itu) → pakai varian **boss** (lebih gelap/dramatis), selain itu → **regular**.

### Layout Arena
- Container `position: relative`, `aspect-ratio: 1024/571` (rasio asli background), `background-size: cover`.
- **Monster**: `position: absolute`, di atas-tengah (`top: 6%`), lebar **42%** dari arena (jauh lebih besar dari party), HP bar tipis + nama di atasnya, `drop-shadow` biar nyatu sama scene.
- **Party (2-3 orang)**: `position: absolute` di bawah, tersebar merata horizontal (`left` dihitung otomatis dari jumlah party: `(index+1)/(jumlah+1) * 100%`), lebar **24%** masing-masing (jauh lebih kecil dari monster) — visual "dikroyok dari depan".
- Karakter yang login (KAMU) dikasih badge kecil di atas gambarnya.
- Semua full body (karakter & monster) transparent PNG, jadi nempel natural di atas background tanpa kotak/border yang keliatan.

### Simplifikasi tampilan stat
Sebelumnya tiap karakter nampilin HP+SP+MP (3 bar). Sekarang di scene arena **cuma HP** yang ditampilin (paling penting buat "sekilas liat siapa kritis"). SP/MP tetap dipakai penuh di balik layar buat kalkulasi battle (`BattleService` gak berubah sama sekali), cuma gak ditampilin di UI arena ini.

### Yang belum diimplementasikan
- Background buat map selain Hutan Awal & Reruntuhan Kuno (kalau nanti nambah map baru, perlu background baru + update `battleBackgroundPath()`).
- Animasi gerak (serang maju-mundur, efek partikel pas hit/crit) — sekarang statis, cuma HP bar & battle log yang update per step.

---

## 23. Animasi GIF per Skill (v4.1)

### Aset
8 GIF moveset Blade Knight (8-16 frame per animasi) disimpan di `public/images/skills/animations/blade-knight-{slug-skill}.gif`, dipasang urut sesuai `SkillAnimationSeeder`:
Tebasan Baja, Serangan Berantai, Hantam Perisai, Tebasan Berputar, Pedang Elemental, Gelombang Kejut (tier 1), Badai Bilah, Murka Ksatria (ultimate/tier 3).

Kolom baru `skills.animation_path` — subclass lain masih `null` sampai ada asetnya nanti (tinggal tambah entry baru di `SkillAnimationSeeder`, gak perlu ubah kode lain).

### Battle log sekarang "tau" skill & pelaku, bukan cuma teks
`BattleService::snapshot()` sebelumnya cuma nyimpen teks + HP semua orang per step. Sekarang ditambah 3 field: `actor_character_id`, `skill_id`, `is_monster_actor` — dicatat tiap kali ada aksi pakai skill (hit maupun MELESET). Ini yang bikin frontend bisa presisi tau "step ini karakter mana pakai skill apa", **tanpa perlu nebak dari teks log** (lebih robust daripada parsing string).

### Overlay animasi di Arena
`Battle/Show.jsx`: tiap `step` berubah, dihitung `activeAnimation` — cari skill yang dipakai di step itu, cek `animation_path`-nya ada apa enggak. Kalau ada, GIF **gantiin** pose idle karakter (bukan numpuk di atasnya) selama step itu berlangsung, otomatis balik ke pose idle pas step ganti.

### Pose Idle khusus arena (`battle_idle_path`)
Full body yang dipakai di halaman lain (roster, profil karakter) kanvasnya beda (512×1024, portrait tinggi) dari kanvas GIF skill (364×360). Kalau dipaksa pakai `full_body_path` yang sama buat idle di arena, karakter bakal "lompat" ukuran/posisi tiap kali animasi GIF mulai/berhenti.

Solusinya: kolom baru `subclasses.battle_idle_path` — pose idle **khusus arena**, di-resize ke kanvas 364×360 (persis sama kayak GIF-nya) biar transisi idle↔animasi mulus, gak ada lompatan ukuran/posisi. Kalau subclass belum punya `battle_idle_path`, fallback ke `full_body_path` biasa (kemungkinan masih agak "lompat" dikit, tapi tetap ada gambar daripada kosong).

Blade Knight udah punya (`blade-knight-idle.png`), subclass lain nyusul kalau ada asetnya.

### Belum ada
- Animasi buat monster nyerang (`is_monster_actor` udah dicatat, tapi belum ada aset GIF/logic overlay-nya).
- Subclass lain selain Blade Knight belum ada animasi atau idle pose khusus arena.

---

## 24. Admin Panel: Settings, Monster Editor, Skill Editor (v4.2, bagian 2)

### Akses admin
Kolom baru `users.is_admin` (default false, sengaja GAK di fillable biar gak bisa di-mass-assign lewat form manapun). Cara jadi admin:
```bash
php artisan user:make-admin {username}
```
Middleware `admin` (alias `EnsureIsAdmin`) proteksi semua route `/admin/*` — 403 kalau bukan admin. Link "Admin" di nav cuma keliatan buat user yang `is_admin=true`.

### `/admin/settings` — atur rasio power monster
Form sederhana buat edit `game_settings` (key-value, di-cache 60 detik biar gak query berkali-kali tiap battle). Dua setting default:
- `monster_level_growth_ratio` (1.5) — rasio kenaikan stat monster tiap level
- `monster_max_level_bonus` (3) — level monster maksimum = level tertinggi party + angka ini

Ini yang dipakai buat "adjustment kalau monster OP" — tinggal turunin rasio dari halaman ini, gak perlu ubah kode/deploy ulang.

### `/admin/monsters` — CRUD monster lengkap
List + create + edit + delete. Form isi semua stat DASAR (level 1 baseline — stat aktual pas battle di-scale otomatis pakai rasio di atas, dijelasin di catatan form). **Peringatan delete**: relasi `monsters` ke `battles`/`encounters` pakai `cascadeOnDelete`, jadi hapus monster ikut ngehapus SEMUA battle history yang pernah lawan monster itu — dikasih warning jelas di dialog konfirmasi.

### `/admin/skills` — edit skill (semua subclass)
List semua skill (filter by subclass), edit tier/scaling_stat/combat_range/cost/cooldown/multiplier/required_level/deskripsi. **Belum ada create/delete skill** dari admin panel (skill baru masih lewat seeder) — scope dibatasi ke "adjustment" skill yang udah ada dulu, biar gak bikin data skill_id yang direferensikan di banyak tempat (character_skills, battle_participants.loadout_skill_ids) jadi berantakan.

---

## 25. Fix Bug Tumbang + HP Regen per Ronde (v4.3)

### Bug: karakter tumbang tetap bisa main lagi
**Root cause ganda**:
1. `BattleParticipant::create()` selalu `is_alive => true` regardless kondisi HP asli karakter.
2. `character.current_hp` **gak pernah disimpan balik** setelah battle selesai — jadi battle berikutnya selalu baca HP dari kondisi awal (biasanya full), gak peduli abis babak belur di battle sebelumnya.

**Fix**:
- `is_alive` sekarang dicek dari `character.current_hp > 0` beneran, bukan hardcode.
- Abis `autoResolve()` selesai, HP/SP/MP akhir tiap participant di-simpen balik ke `characters` (sebelumnya gak pernah ke-update sama sekali).
- Karakter dengan `current_hp <= 0` sekarang **gak bisa dipilih** buat party baru — badge "Tumbang" (abu-abu) di Guild & Battle Select, mirip pola "Sedang Misi", divalidasi juga di server (`ensureNoFaintedCharacterInParty`).

### Party pulih full HP/SP/MP abis battle (bukan bawa luka)
Awalnya (v4.3) HP/SP/MP akhir battle disimpan apa adanya ke karakter — jadi yang tumbang tetap 0 HP sampai ada fitur recovery (yang belum dibangun). User minta diubah: **abis battle selesai, party otomatis pulih FULL** (baik yang tumbang maupun yang cuma kepotong sebagian), gak perlu nunggu recovery manual. Battle jadi murni "one-shot encounter" — hasilnya (menang/kalah/EXP) tetap kesimpen, tapi kondisi fisik party di-reset bersih tiap kali balik dari battle.

`ensureNoFaintedCharacterInParty()` (validasi party gak boleh ada yang HP 0) tetap dibiarin ada — jadi gak akan pernah ke-trigger lagi di alur normal (karakter selalu balik full abis battle), tapi tetap jadi pengaman kalau suatu saat ada mekanisme lain yang bisa nurunin HP di luar battle.

### HP Regen per Ronde (baru — sebelumnya HP gak pernah pulih sendiri di battle)
Formula: `HP regen/ronde = ratio × (Physical Defense + Magic Defense)` — karena `Base HP` udah dihitung dari 2 stat itu, jadi sederhananya `HP regen = ratio × Base HP`, konsisten sama pola SP/MP regen yang udah ada.

Setting baru `regen_ratio` (default `0.1` = 10%) di `/admin/settings`, **dipakai bareng buat HP, SP, MAupun MP regen** (sebelumnya SP/MP regen hardcode 10% di kode, sekarang keduanya juga ikut baca dari setting ini). Contoh dari instruksi: Physical Defense 30 + Magic Defense 30 = 60, ratio 10% → HP regen 6/ronde — persis sesuai.

Karakter/`Characters/Show.jsx` sekarang nampilin "HP Regeneration" juga (sebelumnya cuma Mana & Stamina Regeneration).

---

## 26. Sistem Kelas Monster (E-S) — ganti tampilan Level statis (v4.4)

Level monster yang statis (di tabel `monsters`) sekarang cuma dipakai sebagai patokan random (lihat bagian 22), jadi nampilin "Lv.1" di Bestiary/preview sebelum battle **menyesatkan** — battle beneran bisa jauh lebih tinggi levelnya.

### `Monster::level_rank` (accessor baru, otomatis ke-append di semua response)
```php
S: level >= 17    A: level >= 12    B: level >= 8
C: level >= 5     D: level >= 3     E: default (1-2)
```

### Dipakai di (level statis diganti Kelas huruf)
- `Monsters/Index.jsx` (Bestiary list)
- `Monsters/Show.jsx` (Bestiary detail) — plus kalimat penjelasan "Kelas nunjukkin perkiraan kekuatan secara umum, level & stat asli baru kelihatan pas battle beneran dimulai"
- `Battle/Select.jsx` (preview monster sebelum pilih party) — HP statis juga dihilangkan dari preview ini (sama-sama misleading kayak level)
- `Maps/Show.jsx` (hasil explore ketemu monster)

### TETAP numerik (sengaja, karena datanya akurat di situ)
- **Di dalam battle** (`Battle/Show.jsx`) — `battle.monster_level` di situ udah hasil roll SEBENARNYA buat battle itu, bukan template statis, jadi angka pasti justru lebih informatif.
- **Admin panel** (`/admin/monsters`) — admin butuh presisi buat editing, bukan narasi kelas.
- **Level karakter** (player/NPC) — ini gak random, tetap ditampilin numerik di mana-mana seperti biasa.

---

## 27. Rework Total: Kelas Monster Manual, Weak/Strong 2-Slot, Skill Attribute, Map+SpawnPoint Editor, Gerbang Level (v5.0)

### Kelas Monster jadi kolom manual (bukan dihitung dari level lagi)
`Monster::class_rank` (F/E/D/C/B/A/S) sekarang kolom asli yang diisi admin manual, bukan accessor `getLevelRankAttribute()` yang dihitung dari level (dihapus total). `MonsterRankSeeder` isi 12 monster existing sesuai tabel yang diminta:
```
F: Tikus Raksasa, Slime Api, Slime Air
E: Kelelawar Gua, Bandit Pemula, Serigala Hutan, Zombie Reyot
D: Laba-laba Beracun, Peri Air, Elemental Api Kecil
C: Golem Batu Kecil, Harpy Muda
```
Semua frontend yang sebelumnya baca `monster.level_rank` diganti `monster.class_rank`.

### Weak/Strong jadi 2 slot per kategori (bukan 1 pola string lagi)
Kolom lama `weak_against`/`strong_against` (1 string pola "range_scaling") **gak dipakai lagi buat kalkulasi** (kolom fisiknya masih ada, cuma legacy). Diganti `weak_matchups`/`strong_matchups` (JSON array, 2 slot masing-masing), tiap slot: `combat_range` (close/range/area) + `element_id` (opsional, null = elemen apapun) + `ratio` (multiplier).

`Monster::matchupMultiplier($combatRange, $skillElementId)`:
- Weak slot cocok → damage × ratio (misal ratio 2 = 2x damage)
- Strong slot cocok → damage × (1/ratio) (misal ratio 2 = setengah damage)
- Slot dengan `combat_range` kosong dianggap gak aktif (belum diisi)

`BattleService` diganti total dari cek `pattern === monster->weak_against` (string exact-match) jadi manggil `matchupMultiplier()`.

### Skill Editor: tambah Attribute (element)
`Admin\SkillController` sekarang include `element_id` di validasi + form — field ini sebenarnya udah ada dari awal di kolom `skills.element_id`, cuma belum pernah dipasang di form admin sebelumnya.

### `/admin/maps` — Map Editor + upload background
CRUD lengkap (index/create/edit/delete) + `uploadBackground()` (resize ke 1200×675, pola sama kayak upload avatar/full body yang udah ada — `ImageResizer` + `public_path()`, bukan Storage disk).

### `/admin/maps/{map}/spawn-points` — Spawn Point Editor
CRUD lengkap per map: nama, deskripsi, posisi (pos_x/pos_y %), **`min_monster_level`** (baru), respawn_seconds, dan pilih monster + bobot (weighted pool, checkbox + input angka per monster).

### Gerbang Level (`min_monster_level`)
Kolom baru `spawn_points.min_monster_level` (default 1 = semua level boleh masuk). Dicek di `MapController::explore()` DAN `MapController::show()` (buat nampilin status terkunci di peta):
```
level tertinggi karakter (milik user, bukan NPC) + monster_max_level_bonus (setting admin, default +3) >= min_monster_level
```
Kalau gak lolos, explore ditolak dengan pesan jelas ("Level kamu belum cukup..."), dan spawn point ditandai 🔒 terkunci di peta (marker abu-abu + kartu disabled) SEBELUM sempat diklik.

### Level dasar SEMUA monster disamain ke 1
Awalnya level dasar tiap monster beda-beda (1-6), padahal sekarang `class_rank` yang mewakili kekuatan relatif ke player. Ini bikin inkonsistensi: monster base level rendah (misal Slime, level 1) butuh **lebih banyak kompon growth** buat nyampe target level yang sama dibanding monster base level tinggi (misal Golem, level 5) — jadi di encounter level yang sama, monster yang "harusnya lemah" malah ke-buff lebih agresif secara proporsional.

Fix: `MonsterRankSeeder` sekarang nyamain **level dasar SEMUA monster ke 1**. Base stat (HP/ATK/DEF, yang emang udah beda-beda per monster) tetap jadi sumber utama perbedaan kekuatan relatif — bukan level lagi. `battleBackgroundPath()` (nentuin background "boss" vs biasa) juga diupdate, dari cek `level >= map.max_level` (rusak kalau semua level 1) jadi cek `class_rank` (C ke atas = tier boss). Urutan tampil di Bestiary & admin list juga diganti dari `orderBy('level')` (percuma kalau semua sama) jadi urut sesuai kekuatan class_rank (F→S).

**Catatan guest**: `maps.show` itu route publik (guest bisa liat), jadi kalau belum login, `playerMaxLevel` di-default ke 1 (bukan query characters dengan user_id null yang malah nyangkut ke NPC).

---

## 28. NPC "Diset Kayak Monster" — Level Dinamis, Bukan Progress Permanen (v5.1)

### Keputusan desain: NPC tetap pakai tabel `characters`, bukan tabel terpisah
User awalnya minta "NPC buat database sendiri kayak bot" (tabel/model terpisah dari player). Saya pilih pendekatan yang lebih ringan: **tetap pakai tabel `characters`** (kolom `is_npc` yang udah ada), tapi ubah total **mekanisme level/stat-nya** biar berperilaku kayak monster. Alasan: bikin tabel/model NPC yang bener-bener terpisah butuh nulis ulang Guild, Battle Select, validasi party, sistem loadout dari nol (semuanya sekarang asumsi "Character" seragam buat player maupun NPC) — effort-nya gak sepadan sama manfaatnya, karena hasil akhirnya (NPC level dinamis + rasio bisa diatur admin) bisa dicapai tanpa perombakan struktural sebesar itu.

### NPC gak numpuk level/EXP permanen lagi
- `characters.level` NPC **selalu 1** (kolom dasar di database), gak pernah naik dari EXP kayak player.
- `BattleService::onVictory()` **skip NPC** — mereka gak dapet EXP/total_exp/stat_points.
- NPC juga **gak nyimpen HP/SP/MP antar battle** (beda dari player) — selalu mulai battle full HP, gak numpuk capek/tumbang kayak karakter pemain.
- `NpcResetSeeder` reset NPC yang mungkin sempat naik level dari sistem lama, balik ke level 1 bersih.

### Level & stat NPC di-roll dinamis tiap battle (persis kayak monster)
Di `BattleService::startBattle()`, buat tiap NPC di party:
```
NPC level battle ini = level tertinggi PLAYER (bukan NPC) di party ± variance random
```
Setting admin baru: `npc_level_variance` (default 2, artinya -2 s/d +2) dan `npc_level_growth_ratio` (default 1.3, beda dari rasio monster karena NPC "temenan" bukan ancaman).

`BattleService::npcScaledStats()` — physical/magic damage & defense NPC di-scale dari base level 1 pakai rasio itu (`stat = leveled_stat * ratio^(level-1)`), base HP/SP/MP dan regen dihitung ulang dari situ. Disimpen sebagai snapshot JSON di `battle_participants.npc_stat_snapshot` + `npc_encounter_level` (kolom baru), biar tiap battle instance konsisten.

### `combatStat()` helper — nyatuin logic NPC vs player
Semua tempat di `autoResolve()` yang sebelumnya baca `$character->effective_X` langsung, sekarang lewat `combatStat($participant, $stat)` — otomatis baca dari snapshot NPC kalau ini NPC, atau `effective_X` biasa kalau player. Yang **GAK** ikut di-scale (sama kayak monster): Accuracy, Evasion, Critical Hit, Critical Luck — cuma power stat (HP/ATK/DEF) yang naik ngikutin level.

### Tampilan
Arena battle nampilin level NPC yang dinamis ("Danu Ksatriya Lv.7") di sebelah nama, beda-beda tiap battle tergantung level party.

---

## 29. Command Reset Level Karakter

```bash
php artisan characters:reset-level              # reset SEMUA karakter (pemain + NPC)
php artisan characters:reset-level --npc-only   # cuma NPC
php artisan characters:reset-level --force      # skip konfirmasi (misal buat script otomatis)
```

Reset ke level 1, EXP/total_exp/stat_points/semua bonus stat ke 0, HP/SP/MP di-full-in lagi sesuai pool level 1. Ada konfirmasi y/n dulu sebelum eksekusi (kecuali pakai `--force`), soalnya ini gak bisa di-undo.

---

## 30. Skill Auto-Scale per Level + Skill Point Allocation (ganti stat point otomatis) (v5.2)

### Stat point otomatis (v5.2: dihapus keliru, v6.0: dibalikin)
Sebelumnya tiap level-up dapat +5/+10 stat point otomatis (dipakai buat upgrade Bonus Stats karakter). Di v5.2 ini sempat **dihapus** karena user ngira "dapat 1 poin tiap battle" itu bug. Setelah dicek, itu SEBENERNYA bukan bug — level rendah emang butuh sedikit EXP buat naik, jadi kerasa sering dapat poin. Di v6.0 user klarifikasi mereka emang MAU fitur ini, jadi **dipasang lagi** di `BattleService::onVictory()` — method `statPointsForLevel()`/`statPointsEarnedBetween()` di `Character` model gak pernah dihapus dari awal, cuma pemanggilannya yang sempat ilang.

### Skill auto-scale per level karakter (baru, otomatis - gak perlu aksi apapun)
Damage & mana/stamina cost skill sekarang **naik otomatis** ngikutin level karakter yang makai, pakai rasio admin-tunable (`skill_level_growth_ratio`, default **1.3**, kompon berlapis dari level 1):
```
damage efektif = base_multiplier × 1.3^(level-1)
mana/stamina cost efektif = base_cost × 1.3^(level-1)
```
Contoh: damage dasar 20 → level 2: 26 (20×1.3). **Cooldown TIDAK ikut naik** (tetap sesuai `cooldown_seconds` di skill). Ini berlaku ke SEMUA skill otomatis, gak perlu setting per-skill manual.

### Skill Point Allocation (baru — pengganti destinasi stat point lama)
Sistem baru buat invest EXP ke **skill spesifik** (bukan stat karakter generik lagi): tiap poin = **+1% damage & -1% cooldown** skill itu doang (cooldown di-floor 20% dari aslinya, biar gak pernah jadi instan 0 detik).

- Cuma bisa buat skill yang ada di **loadout manual** karakter (character_skills pivot) — skill yang dipilih random per-battle gak punya slot allocation (gak ada tempat nyimpen progress-nya).
- Kolom baru `character_skills.bonus_level` (per pasangan karakter-skill).
- Biaya: `(bonus_level_saat_ini + 1) × 10 EXP` per poin — lebih murah dari upgrade stat karakter (15-25 EXP) karena scope-nya lebih sempit (1 skill doang, bukan efek ke semua battle).
- UI baru di halaman detail karakter: section "Skill Point Allocation" (muncul kalau loadout udah diset 5 skill), tombol "+ Allocate (X EXP)" per skill, cuma keliatan buat pemilik karakter.

### Kenapa desain ini (bukan literasi ke "kenapa dapat 1 poin tiap battle")
User awalnya nanya kenapa stat point kayak dikasih tiap battle — root cause-nya BUKAN bug (kode udah bener cuma ngasih poin pas level beneran naik), tapi karena early-level EXP requirement kecil + monster EXP reward ikut ke-scale naik bareng level party, jadi level-up (dan dapat poin) emang KERASA sering banget di level rendah. Daripada cuma jelasin, saya redesign sesuai arah yang diminta: stat point otomatis dihapus, diganti sistem skill-specific yang lebih niche dan intentional.

---

## 31. Fix Bug Kritis: Karakter Tumbang Masih Nyerang + Sistem Stun + Skill Monster (v5.3)

### BUG KRITIS: karakter tumbang masih ikut ronde
**Root cause**: `$battle->participants()->where('is_alive', true)->get()` — pakai tanda kurung `()`, ini manggil RELATION METHOD yang query FRESH ke database, hasilnya **instance PHP yang beda** dari yang udah di-cache di `$battle->participants` (tanpa kurung, si collection yang di-load sekali di awal `autoResolve()`). Jadi pas monster nyerang dan nge-set `$target->is_alive = false` di instance "asing" hasil query fresh itu, perubahannya kesimpen ke database tapi **collection utama yang dipakai di ronde-ronde berikutnya (dan `anyAlive()`, dan snapshot) tetap "basi"** — masih nganggep karakter itu hidup. Efeknya persis yang dilaporkan: karakter tumbang masih ikut nyerang ronde berikutnya, DAN HP-nya ikut ke-regen balik ke atas 0 (soalnya regen loop juga baca dari collection basi yang sama).

**Fix**: ganti jadi `$battle->participants->where('is_alive', true)` (Collection method, tanpa kurung setelah `participants`) — filter collection yang UDAH di-load, instance objeknya sama persis kayak yang dipakai di tempat lain. Sekarang perubahan `is_alive` konsisten di seluruh proses battle.

### Nama abu-abu kalau tumbang
Sebelumnya cuma opacity card yang berkurang; sekarang nama karakter juga eksplisit ganti warna jadi abu-abu (`#5b6178`) kalau `is_alive` false, biar lebih jelas kelihatan siapa yang udah tumbang.

### Sistem Stun (dua arah)
- **Skill player bisa stun monster**: kolom baru `skills.can_stun` (checkbox di admin skill editor). Kalau skill yang stun-able KENA, ada **roll TERPISAH** (dice sendiri, bukan nempel ke roll critical hit) yang pakai persentase **sama kayak Critical Luck** karakter. Jadi hasilnya independen — bisa crit doang, stun doang, keduanya, atau gak dua-duanya, di ronde yang sama. Kalau stun-nya kena: `battles.monster_stunned = true` — ronde berikutnya monster **skip nyerang** (log: "X kena stun, skip ronde!"), flag di-reset abis dipakai sekali.
- **Skill monster bisa stun karakter**: lihat "Skill Monster" di bawah — kalau skill itu kena (udah lolos hit-chance normal), stun-nya **deterministik** (bukan roll probabilitas terpisah kayak player, karena monster gak punya stat setara Critical Luck) — kontrolnya cukup lewat "Skill Ratio" (peluang skill itu ke-pilih tiap ronde). `battle_participants.is_stunned = true` — karakter itu **skip giliran** ronde berikutnya.
- **Efek visual**: ikon ⚡ muncul di atas karakter/monster yang lagi kena stun, dideteksi dari teks battle log step itu (`current.text.includes(nama) && includes('kena stun')`).

### Skill Monster (baru — monster sekarang bisa punya skill sendiri, bukan cuma serangan generik)
Kolom baru `monsters.skills_config` (JSON array), diatur admin di halaman edit monster — bisa **tambah/edit/hapus** dinamis, tiap skill:
- **Nama** (flavor text, muncul di log: "X pakai [nama] ke Y")
- **Damage (% stat)** — 0-100, persentase dari physical/magic damage monster yang dipakai (bukan base_multiplier kayak skill player, langsung persentase simpel). Misal diisi 89 → 89% dari stat damage monster.
- **Effect**: Single (1 target random) atau **Area** (kena SEMUA karakter yang masih hidup)
- **Stun**: checkbox, kalau ya dan skill ini kena → target(s) kena stun
- **Skill Ratio (%/ronde)** — peluang skill ini dipilih ronde itu, dicek berurutan tiap skill di list; kalau gak ada yang ke-roll, fallback ke serangan dasar (single target, 100% damage, kayak sebelumnya)

`BattleService::pickMonsterSkill()` yang nge-roll ini tiap ronde monster mau nyerang (kecuali lagi kena stun, langsung skip).

---

## 32. Tampilan Level NPC di Luar Battle (v5.4)

**Pertanyaan user**: "char udah level 3-4, tapi NPC view masih level 1 semua — perlu tabel dipisah?"

**Jawaban: gak perlu dipisah tabelnya.** Ini murni soal tampilan — level ASLI NPC baru di-generate pas battle beneran mulai (`BattleService::rollNpcEncounterLevel()`, disimpan di `battle_participants.npc_encounter_level`, BUKAN di `characters.level` yang emang sengaja selalu 1 buat NPC). Di LUAR battle (Guild, Battle Select), belum ada battle yang berjalan, jadi belum ada angka "asli" buat ditampilin — sebelumnya cuma nunjukkin `characters.level` mentah (selalu 1), makanya kelihatan gak nyambung sama progress player.

**Fix**: `GuildController::index()` & `BattleController::select()` sekarang ngitung **rentang perkiraan** (bukan angka pasti) buat tiap NPC yang ditampilin — `[levelTertinggiKarakterSendiri - variance, levelTertinggiKarakterSendiri + variance]` (variance dari setting admin `npc_level_variance`, default 2). Ditampilin sebagai `Lv.2-6` misalnya, bukan angka tunggal random yang bakal beda tiap refresh (yang bisa bingungin — "kok levelnya berubah-ubah padahal gak battle").

Angka PASTI-nya baru muncul di dalam battle beneran (`Lv.7` misalnya, di arena) — sesuai desain yang udah dibangun sebelumnya di bagian 28.

---

## 33. Level NPC Di-cache 300 Detik — Angka Pasti, Konsisten Preview↔Battle (v5.5)

User kasih 2 ide: (1) level NPC keliatan pasti pas milih di Guild (biar bisa milih yang "pas", gak kegedean/kekecilan), atau (2) sistem timer 300 detik. Digabung jadi satu solusi:

### `Character::resolveNpcLevel()` — cache dengan timer
Kolom baru `characters.npc_cached_level` + `npc_level_refreshed_at`. Tiap kali level NPC dibutuhkan (baik buat preview di Guild/Battle Select MAUPUN buat battle beneran):
1. Cek cache: kalau `npc_level_refreshed_at` masih dalam `npc_level_cache_seconds` detik terakhir (setting admin, default **300**), pakai angka yang udah ada.
2. Kalau kadaluarsa/belum pernah: roll baru (`playerMaxLevel ± npc_level_variance`), simpen sebagai cache baru dengan timestamp sekarang.

### Konsisten preview ↔ battle beneran
Sebelumnya: preview di Guild kasih RENTANG (`Lv.2-6`), battle beneran roll ULANG independen (`BattleService::rollNpcEncounterLevel()`) — jadi angka yang keliatan pas milih BEDA sama yang beneran dipakai di battle. Sekarang **dipakai fungsi yang sama** (`resolveNpcLevel()`) di kedua tempat:
- `GuildController::index()` / `BattleController::select()`: attach `npc_display_level` (angka PASTI, bukan rentang lagi) ke tiap NPC yang ditampilin
- `BattleService::startBattle()`: manggil `$character->resolveNpcLevel($partyMaxLevel)` yang SAMA — kalau masih dalam window 300 detik dari waktu preview, dapet angka yang PERSIS SAMA kayak yang keliatan pas milih tadi

Jadi sekarang player beneran bisa "milih NPC yang levelnya pas" — angka yang keliatan di Guild itu yang beneran dipakai di battle, bukan janji palsu yang berubah pas battle mulai.

---

## 34. Menu Nav jadi Dropdown (v5.6)

`Layout.jsx` — nav sebelumnya flat (Guild, Codex, Karakter, Monster, Peta, Cara Main semua sejajar), sekarang dikelompokkan jadi 2 dropdown:

- **Bermain** (klik teks = ke home/Codex, klik panah ▼ = buka dropdown) → Guild, Monster, Peta, Cara Main
- **Karakter** (cuma muncul kalau login; klik teks = ke Roster, panah ▼ = dropdown) → Karaktermu, + Buat Karakter Baru, Admin (kalau `is_admin`)
- **Logout** tetap tombol langsung (gak di-dropdown)
- Guest (belum login): Login/Daftar tetap tampil sebagai link biasa, gak ada dropdown Karakter

`NavDropdown` component baru (dipakai 2x) — pure React state (`useState` open/close + `useRef`+`useEffect` buat close-on-outside-click), sengaja gak pakai Bootstrap JS dropdown biar gak gantung sama bundle JS Bootstrap yang mungkin gak ke-load.

---

## 35. Fix Nav Dropdown + Fitur Lineup & Frontman (v5.7)

### Fix nav dropdown
Sebelumnya label & panah dropdown terpisah (klik teks = ke halaman, klik panah kecil ▼ = buka menu) — panahnya kekecilan, susah diklik. Sekarang: **seluruh tombol** (teks + panah) jadi satu trigger, klik DI MANA AJA buka/tutup dropdown. Ditambah **hover** (mouse mendekat) buat desktop — `onMouseEnter` buka langsung, `onMouseLeave` tutup dengan delay 150ms (biar gak keburu nutup pas mouse pindah dari label ke item menu). "Depan" (ke halaman utama/Codex) sekarang jadi **item pertama di dalam** dropdown "Bermain", bukan link terpisah lagi.

### Lineup & Frontman (baru)
Sebelum battle mulai, sekarang ada layar **"Lineup"** — nampilin full body semua karakter yang dipilih + monster berjejer dramatis (kayak poster tim), dan bisa pilih satu jadi **Frontman**.

**Mekanisme**: Frontman dapet bobot target 2x dibanding yang lain:
- Party 3 orang: Frontman ~50%, 2 lainnya ~25%/25%
- Party 2 orang: Frontman ~67%, yang lain ~33%
- Gak pilih Frontman: balik ke random rata (kayak sebelumnya)

Ini bikin karakter tanky (HP/DEF tinggi) berguna buat "nutupin" teman yang lebih rapuh — taruh di depan biar lebih sering kena, sisanya lebih aman nyerang/heal dari belakang.

**Implementasi**:
- `battles.frontman_character_id` (nullable FK ke characters) — divalidasi harus salah satu dari party yang dipilih
- `BattleService::pickWeightedTarget()` — frontman masuk pool target 2x lipat (bukan exact 50%, tapi mendekati tergantung ukuran party)
- **Kedua jalur battle** (Misi Cepat di Guild MAUPUN explore-pilih-di-Peta) sekarang **konvergen** ke halaman `Battle/Select.jsx` yang sama — sebelumnya Misi Cepat langsung mulai battle tanpa layar konfirmasi, sekarang keduanya lewat Lineup dulu
- Arena battle nampilin badge "🛡 Frontman" di karakter yang kepilih, biar kelihatan jelas pas nonton animasinya

---

## 36. Buff Type ke-4: "Buff" + Fix Formula Heal + Area buat Heal/Buff (v5.8)

### Buff Type "Buff" (baru)
Nambah daya serang **ally** buat serangan **berikutnya** (one-shot, dikonsumsi pas dia nyerang beneran, abis itu reset). Basis kekuatan = **Magic Attack** pemberi buff (biar Magic Attack ada gunanya juga buat karakter support, gak cuma buat nyerang langsung):
```
bonus% = Magic Attack pemberi × Base Multiplier skill
```
Contoh: 45 Magic Attack, Base Multiplier 100% (1.0) → target dapet **+45% damage** di serangan berikutnya.

`battle_participants.buff_multiplier` (kolom baru) — disimpen di target, dikonsumsi (dikali ke damage, terus di-reset null) pas si target beneran nyerang monster (skill `buff_type='none'`).

### Formula Heal: dari Magic Attack (sama basisnya kayak Buff)
```
heal amount = Magic Attack pemberi × Base Multiplier skill
```
Heal dan Buff sama-sama pakai Magic Attack sebagai basis kekuatan (user koreksi — awalnya sempat dicoba Magic Defense buat Heal, tapi dibalikin ke Magic Attack).

### Combat Range "Area" berlaku juga buat Heal & Buff
Sebelumnya "Area" cuma dipakai buat serangan biasa (kena semua kalau monster area attack). Sekarang **Heal** dan **Buff** juga baca `skill->combat_range`:
- `combat_range = 'area'` → efek kena SEMUA karakter yang masih hidup (bukan cuma 1 target)
- Selain itu (close/range) → tetap 1 target (heal pilih yang paling butuh, buff pilih attacker terkuat di party)

### Skill Point Allocation otomatis ikut ke Heal/Buff/Nerf juga
Gak perlu logic tambahan — `skillCombatStats()['multiplier']` (yang udah termasuk level-scaling + allocation bonus per poin) dipakai SAMA di semua buff_type (heal/buff/nerf/none), jadi invest EXP ke skill heal/buff/nerf otomatis nambah kekuatannya juga, konsisten sama skill serangan biasa.

---

## 37. Rework Total 112 Skill (v5.9)

`SkillReworkSeeder` — pass 2 (data), setelah infrastruktur `buff_stat` selesai (bagian 36). Semua 112 skill (14 subclass × 8) diklasifikasi ulang `buff_type`/`buff_stat`/`heal_resource`/`can_stun`/`combat_range` berdasarkan nama & deskripsi yang UDAH ADA di `SkillSeeder` (gak ngarang nama baru, cuma nge-set field yang belum pernah diisi).

### Aturan minimum per subclass (tervalidasi semua 14 lolos)
- **Minimal 1 skill `can_stun=true`** — biasanya nempel di skill tier-1 yang "berat" (hantaman/tebasan besar/ledakan)
- **Minimal 1 skill `buff_type='none'`** (serangan biasa) — bahkan buat subclass paling support-heavy (Cleric cuma 1: "Pukulan Ringan", tapi tetap ada)

### Saint (Cleric/Warlock/Enchanter) — porsi sesuai konsep karakter
- **Cleric**: 7 dari 8 skill jadi `heal` (HP) — bener-bener condong penyembuh, cuma "Pukulan Ringan" yang attack biasa (+stun)
- **Warlock**: 5 dari 8 skill jadi `nerf` (Tanda Kutukan, Sentuhan Layu, Rantai Kutukan, Bisikan Teror, Wabah Kutukan) — condong debuff, 3 sisanya attack
- **Enchanter**: 5 dari 8 skill jadi `buff` (3 attack-buff, 2 defense-buff) + 1 `heal` (Not Penyemangat, resource MP) — condong support party, 2 sisanya attack

### Contoh eksplisit dari instruksi: Warden "Gelombang Pelindung"
> "Aura sihir yang menaikkan magic defense tim" → `buff_type='buff'`, `buff_stat='defense'`, `combat_range='area'` — persis kena SEMUA party, basis kekuatan dari Magic Attack pemberi (formula sama kayak buff/heal lain).

### Subclass lain (Warrior/Tanker/Mage)
Mayoritas tetap serangan biasa (`none`), tapi disisipin 1-2 skill support yang FLAVOR-nya emang udah ngarah ke situ dari deskripsi asli — misal Paladin "Cahaya Penyembuh" jadi heal, Bulwark/Warden/Sentinel/Spellblade/Geomancer punya 1 skill "perisai/tembok/kulit batu" jadi buff defense (self), Pyromancer/Hydromancer punya 1 skill "melemahkan/memperlambat musuh" jadi nerf.

`combat_range` juga dipasang eksplisit di semua 112 skill di seeder ini (sebelumnya kolom itu gak pernah diisi eksplisit di `SkillSeeder` awal).

---

## 38. Fitur Item Bagian 2 (Frontend): Shop, Inventory, Admin Editor (v6.1)

### `/shop` — halaman beli item
Pilih karakter dulu (dropdown, nunjukkin gold masing-masing), list item urut rarity (Common→Legendary), tombol Beli disabled kalau gold gak cukup. Beli langsung masuk inventory karakter (belum ke-equip otomatis).

### Inventory di halaman karakter (`Characters/Show.jsx`)
Section baru "Inventory (X/4 ke-equip)" — list semua item yang dimiliki, tombol Equip/Lepas per item (cuma keliatan buat pemilik). Card item yang belum ke-equip agak transparan (opacity 0.7) biar kebeda visual dari yang aktif. Link cepat ke Shop kalau belum ada item.

Gold karakter juga ditampilin di section Resource, sejajar sama EXP/Stat Point.

### `/admin/items` — CRUD item lengkap
List + create + edit + delete, sama pola kayak Monster/Skill editor. Form isi: nama, deskripsi, rarity, harga, stat yang ditambah, jumlah bonus, drop rate (%). Delete dikasih warning (item yang udah dimiliki/di-equip karakter ikut kehapus, cascade).

### Nav
"Shop" ditambahin ke dropdown "Bermain" (antara Guild dan Monster). Link "Item" ditambahin ke cross-nav semua halaman admin (Settings/Monster/Skill/Map).

---

## 39. Inventory Bag UI + Gambar Item dari game-icons.net (v6.2)

### Gambar item (open-source, dari GitHub)
Ikon item diambil dari **game-icons.net** (github.com/game-icons/icons — repo publik CC BY 3.0, ribuan SVG fantasy/RPG gratis), didownload lewat `codeload.github.com` (ada di allowlist network). Tiap ikon diproses: background SVG-nya diwarnain sesuai **rarity item** (abu-abu buat Common, teal buat Rare, ungu buat SR, emas buat UR, merah buat Legendary), di-convert ke PNG 256×256 pakai `cairosvg`.

10 item awal (`public/images/items/*.png`):
| Item | Ikon sumber |
|---|---|
| Black Dagger | `lorc/plain-dagger.svg` |
| Iron Bracer | `delapouite/bracer.svg` |
| Arcane Ring | `delapouite/ring.svg` |
| Guardian Amulet | `lorc/gem-pendant.svg` |
| Hawk's Eye Lens | `lorc/crystal-eye.svg` |
| Shadowstep Boots | `lorc/steeltoe-boots.svg` |
| Dragon's Fang | `lorc/saber-tooth.svg` |
| Fortune Coin | `lorc/crown-coin.svg` |
| Excalibur Shard | `lorc/shard-sword.svg` |
| Phoenix Heart | `delapouite/heart-shield.svg` |

Plus `placeholder.png` (ikon peti harta karun) buat item yang belum punya `icon_path` diisi.

### Inventory Bag — grid 3×3, 9 slot/halaman, kapasitas 50
`InventorySection` di `Characters/Show.jsx` dirombak total dari list kartu jadi model **bag ala game RPG klasik**:
- **Grid 3×3** (9 slot per halaman), tombol ← / → buat pindah halaman kalau item lebih dari 9
- Slot kosong di halaman terakhir ditandai kotak putus-putus (biar grid tetap penuh 3×3)
- **Klik slot** → masuk ke tampilan detail (gambar besar, rarity badge, nama, deskripsi, efek stat) + tombol **Equip/Lepas**
- Tombol **"← Kembali ke Bag"** di layar detail buat balik ke grid
- Kapasitas maksimal **50 item** per karakter (`characters:count() >= 50` dicek di `ShopController::buy()` DAN `BattleService`'s item drop logic — kalau bag penuh, drop di-skip diam-diam biar gak error pas battle)

---

## 40. Generate 60 Item Standar: 40 Common, 15 Rare, 5 SR (v6.3)

`BulkItemSeeder` — 60 item baru dengan variasi lengkap sesuai instruksi:

### Distribusi rarity (pas sesuai permintaan)
- **40 Common**: harga 30-100 Gold, bonus stat 6-16, drop rate 15-28%
- **15 Rare**: harga 180-380 Gold, bonus stat 22-42, drop rate 5-12%
- **5 SR**: harga 550-950 Gold, bonus stat 40-60, drop rate 1.5-3.5%

Nilai tiap item di-interpolasi dalam range rarity-nya (pakai `crc32(nama) % 100` sebagai seed) — jadi gak semua item se-tier nilainya SAMA PERSIS, ada variasi kecil natural.

### Variasi stat (16 kategori)
Physical/Magic Damage & Defense, Accuracy, Evasion, Critical Hit, Critical Luck, **HP**, **HP/MP/SP Regen** (baru dari bagian 39), dan **Elemental Damage** (Fire/Water/Earth/Wind — juga baru dari bagian 39).

### Ikon: kategori, bukan per-item
60 gambar unik gak sepadan effort-nya — jadi ikon dikelompokkin **per kategori stat** (16 ikon dari game-icons.net, sama sumbernya kayak bagian 39): pedang buat physical damage, perisai buat physical defense, tongkat sihir buat magic damage, jimat buat magic defense, mata-target buat accuracy, sepatu buat evasion, crosshair buat critical hit, dadu buat critical luck, hati buat HP, botol ramuan buat HP regen, ramuan sihir buat MP regen, otot buat SP regen, dan api/tetes air/tumpukan batu/tornado buat 4 elemen. Item dengan stat yang sama otomatis share ikon yang sama (visual konsisten per kategori).

---

## 41. Fix Bug Shop + Inventory Compact + Bar Item di Stats (v6.4)

### Fix bug: "Attempt to read property base_physical_damage on null" di Shop
Root cause: `ShopController::index()` ambil karakter pakai `->get(['id', 'name', 'gold'])` — gak include `subclass_id`. Character model punya banyak accessor di `$appends` (`effective_physical_damage` dst) yang OTOMATIS keitung pas model di-serialize ke JSON buat Inertia, dan accessor itu baca `$this->subclass->base_physical_damage`. Karena `subclass_id` gak ke-select, relasi `subclass()` gagal (null), langsung crash. Fix: eager-load `subclass` beneran, jangan restrict `select()`.

### Inventory jadi compact by default
Sebelumnya bag langsung tampil grid 3×3 full di halaman karakter (makan tempat). Sekarang default-nya **compact**: cuma nunjukkin ikon kecil item yang lagi ke-equip (48×48px, border warna rarity, hover buat liat nama+efek), plus tombol **"Buka Inventory"** yang nunjukkin jumlah total (`X/50`). Klik tombol itu baru muncul grid 3×3 penuh (bagian 39). Ada tombol **"Tutup Inventory"** buat balik ke compact lagi.

### Bar item di Stats (segmen ke-3, beda warna)
Tiap `StatBar` sekarang bisa nampilin 3 segmen: **base** (warna stat), **bonus stat point/EXP** (emas), **bonus item ter-equip** (hijau `#4a9960`, baru). `itemBonusFor(character, statKey)` — helper JS yang jumlahin `effect_value` dari semua item ter-equip yang match `effect_stat`-nya, dihitung di frontend (data item + pivot udah ada di `character.items`). Berlaku di semua row yang relevan: Physical/Magic Attack & Defense, Accuracy, Evasion, Critical Hit/Luck, Base HP, HP/Mana/Stamina Regen. Item elemental (`elemental_damage`) sengaja GAK masuk bar manapun (efeknya kondisional per-skill, gak representatif ditampilin sebagai angka stat statis) — ada catatan kecil di bawah card kalau karakter punya item elemental ter-equip.

---

## 42. Icon Picker di Admin Item Manager — 40 Ikon Pool Belum Terpakai (v6.5)

### 40 ikon baru di `public/images/items/pool/`
Sama sumbernya (game-icons.net via GitHub) tapi latar netral (`#2e3140`, bukan tinted rarity) — karena ikon ini belum terikat rarity/item spesifik. Variasi: senjata (pedang/kapak/palu/busur), armor (helm/gauntlet/celana perang), aksesoris (mahkota/cincin/medali), dan item sihir (buku/orb/scroll).

### Picker di form admin (create & edit item)
`Admin\ItemController::availableIcons()` — scan folder `pool/`, filter yang **belum ke-assign** ke item manapun di database (`Item::pluck('icon_path')`). List sisanya dikirim ke form.

Form (`Admin/Items/Form.jsx`) nampilin grid ikon yang tersedia (klik buat pilih, klik lagi buat batal — balik ke ikon kategori default). Pas edit item yang UDAH punya `icon_path` dari pool, ikon itu tetap muncul di picker (biar keliatan/bisa diganti), walau secara teknis udah "terpakai".

Setelah satu ikon dipilih dan item disimpan, ikon itu otomatis HILANG dari picker item lain (karena sekarang statusnya "terpakai") — jadi admin gak akan sengaja pilih ikon yang sama buat 2 item beda.

---

## 43. Town Hub — Home Page Interaktif (v6.6, khusus user login)

Gambar desa (`public/images/ui/town-hub.jpg`, di-generate AI, dikompres ke JPEG ~276KB dari PNG asli 2.4MB) jadi **home page interaktif** buat user yang udah login — klik bangunan langsung ke menu terkait, gak perlu teks menu biasa.

### Mapping bangunan → fitur
- **Bangunan tengah besar (pura kayu)** → Adventure Guild (`guild.index`)
- **Lapak pojok kiri bawah** → Shop (`shop.index`)
- **Gerbang belakang (2 menara)** → Pergi Adventure / Peta (`maps.index`)
- **Bangunan kiri berdiri sendiri** → Penginapan = atur karakter/roster (`characters.index`)
- **Bangunan kanan depan (2 lantai)** → Guild Party — **fitur belum dibangun** (nanti: bikin party TETAP + auto-adventure/skip), sementara link ke Guild aja, label hover-nya jelasin ini "segera hadir"

### Implementasi
- `GameDataController::index()`: cek `auth()->check()` — kalau login, render `Home/TownHub` (bukan Codex lagi). Guest tetap liat Codex kayak biasa.
- **Codex jadi punya route sendiri** (`/codex`, `classes.codex`) — soalnya `/` sekarang beda isi tergantung status login, user yang login masih perlu cara akses Codex, ditambahin ke dropdown nav "Bermain"
- `Home/TownHub.jsx`: hotspot posisinya dalam **persen** (bukan pixel absolut) relatif ke gambar 1376×768, jadi tetap presisi walau gambar responsive resize di layar beda-beda. Posisi divalidasi visual (generate overlay kotak warna-warni di atas gambar asli, dicek manual sebelum finalize)
- Hover di hotspot: border emas + label nama+deskripsi muncul di atas bangunan. Ada juga daftar link teks kecil di bawah gambar (fallback buat aksesibilitas/kalau hotspot susah diklik di HP)

---

## 44. Rework Alur Party: Guild (pisah Pemain/NPC) → Frontman (halaman sendiri) (v6.7)

Sebelumnya: Guild nampilin karakter pemain+NPC dicampur jadi 1 list checkbox, terus Battle/Select nampilin picker YANG SAMA lagi (redundan) + Lineup/Frontman digabung di halaman itu juga.

### Guild (`Guild/Index.jsx`) — dua section terpisah
- **"Karaktermu"** (atas): karakter pemain sendiri. Kalau cuma punya **1 karakter, otomatis "pass" langsung** (gak perlu diklik, cuma ditampilin dengan badge "Otomatis Ikut"). Kalau punya lebih dari 1, jadi **single-select** (radio-style, bukan checkbox) — pilih SATU yang mau dibawa, default-nya karakter pertama.
- **"Ajak NPC"** (bawah): checkbox multi-select, maksimal 2 NPC (total party = 1 karakter kamu + sampai 2 NPC = maks 3).
- `GuildController::index()` sekarang kirim 2 array terpisah (`playerCharacters`, `npcCharacters`), bukan 1 array campuran kayak sebelumnya.

### Frontman — halaman sendiri (`Battle/Select.jsx`, tapi isinya beda total)
Party udah FIX begitu keluar dari Guild (disimpen di session `guild_party`). Halaman ini **cuma nampilin party vs monster + pilih Frontman** — gak ada checkbox pilih karakter lagi sama sekali.

`BattleController::select()` baca party dari `session('guild_party')` (bukan nampilin semua karakter+NPC buat dipilih ulang). Kalau session party kosong (misal user nyasar akses langsung tanpa lewat Guild), di-redirect balik ke Guild dengan pesan error.

**Kedua jalur battle** (Misi Cepat di Guild maupun Explore lewat Peta) sama-sama udah nentuin party di Guild dulu sebelum sampai sini — jadi halaman Frontman ini konsisten selalu nampilin party yang FIX, gak pernah kosong/perlu dipilih ulang.

---

## 45. Stat Bar Skala Dinamis (v6.8)

Sebelumnya tiap `StatBar` punya `max` fixed (80 buat Physical/Magic Attack&Defense/Accuracy/Evasion, 150 buat Base HP/MP/SP, 60 buat Critical Hit/Luck, 20 buat Regen) — begitu total stat (base+bonus+item) ngelewatin angka itu, bar-nya overflow/kelihatan gak imbang (kepotong/gak proporsional).

**Fix**: skala bar sekarang **dinamis**, dihitung dari total stat itu sendiri:
```
max = 100, dobel terus (100 → 200 → 400 → 800 → ...) sampai >= total
```
Jadi kalau total 45 → skala tetap 100 (bar keliatan ~45% penuh). Total 120 → skala naik ke 200 (bar ~60% penuh). Total 250 → skala naik ke 400 (bar ~62% penuh, "setengahnya" sesuai instruksi). Bar SELALU proporsional gak peduli seberapa gede stat-nya (dari growth level + stat point + item), gak pernah overflow.

Semua prop `max={...}` yang dulu di-pass manual ke `<StatBar>` udah dihapus (gak dipakai lagi) — `Bar`/`ResourceRow` (buat HP/SP/MP resource pool) TETAP pakai max eksplisit seperti biasa (gak berubah, itu representasi current/max yang beda konsepnya).

---

## 46. Shop: Pagination + Filter Rarity (v6.9)

`Shop/Index.jsx` — sebelumnya nampilin semua item (70 biji) dalam 1 grid panjang. Sekarang:
- **Filter rarity** (tombol: Semua/Common/Rare/SR/UR/Legendary) di atas grid, klik buat filter, otomatis balik ke halaman 1
- **Pagination 10 item/halaman**, tombol ← / →, indikator "Halaman X / Y (Z item)"
- Pesan "Gak ada item di rarity ini" kalau filter hasilnya kosong

Semua client-side (filter + slice di JS), gak perlu request baru ke server tiap ganti halaman/filter — item list-nya dikirim sekali di awal (masih ringan, 70 item bukan angka besar).

---

## 47. 100 Ikon Colorful Baru + Upload Manual di Item Editor (v7.0)

### 100 ikon baru, palet colorful (bukan netral/gray lagi)
Sama sumbernya (game-icons.net via GitHub), tapi kali ini tiap ikon dikasih kombinasi **warna background + warna icon vivid** dari 10 palet berbeda (merah, biru, hijau, oranye, ungu, magenta, teal, kuning tua, indigo, merah bata) — beda total dari batch sebelumnya yang netral/gray. Distribusi kategori: senjata (20), armor (18), aksesoris (15), potion (9), gem/kristal (15), scroll/buku (11), elemental/tematik (12).

**Quality pass**: batch pertama sempat ke-generate beberapa ikon gak nyambung tema RPG (kartu remi, badge polisi, dasi kupu-kupu, helm American football, simbol zodiak Gemini, mangkuk makan anjing) — hasil false-positive dari pencarian keyword luas. Semua itu di-cek visual (generate contact sheet, dicek manual) dan diganti sama ikon yang lebih sesuai (compass, lentera kertas, dll) sebelum di-commit final. Total pool sekarang **140 ikon** (40 batch pertama + 100 batch ini).

### Upload gambar manual di Admin Item Editor
Selain milih dari pool, admin sekarang bisa **upload gambar sendiri** langsung di form item (create maupun edit):
- `Admin\ItemController::uploadIcon()` — endpoint standalone (gak butuh item sudah ada, karena item BARU belum punya ID), resize ke 256×256 (`ImageResizer`, pola sama kayak upload avatar lain), simpen ke `public/images/items/uploads/{uuid}.png`
- Dipanggil pakai `fetch()` langsung dari form (bukan Inertia visit) — biar gak reload halaman/ilangin isian field lain yang udah diisi
- Ada tombol "Hapus Gambar" buat reset balik ke ikon kategori default

---

## 48. Semua Ikon Item Diproses Ulang jadi Transparan + Warna Latar Sesuai Rarity (v7.1)

### Ikon transparan, bukan background dibakar ke gambar lagi
Sebelumnya tiap PNG punya background solid (tinted rarity atau vivid colorful) yang dibakar permanen ke gambar. Sekarang **semua 165 ikon** (27 unik+kategori + 138 pool) diproses ulang: background dibuang total (transparan), icon shape dinormalisasi jadi **putih polos**. Warna sekarang dipasang lewat CSS `background` di elemen pembungkus `<img>`, bukan bagian dari file gambar — jadi 1 ikon bisa dipakai ulang buat rarity manapun tanpa perlu generate ulang gambar.

### Skema warna rarity (dipasang dinamis)
```
common: grey (#8f96a3)   rare: purple (#8b5cf6)   sr: blue (#4a90e2)
ur: yellow (#e8c547)     legendary: light red (#ef7d6f)
```
Diterapkan konsisten di semua tempat item ditampilkan: Shop, Inventory Bag (grid & compact-equipped & detail view), dan preview di Admin Item Form (ngikutin rarity yang lagi dipilih di dropdown, real-time).

### 2 ikon dibuang (gak bisa diproses transparan)
`badges/ice.svg` dan `badges/moon.svg` punya struktur SVG beda dari pola standar game-icons.net (bukan cuma background rect + 1 shape path) — dicoba diproses otomatis GAGAL, jadi sesuai instruksi ("hilangkan icon yang tidak bisa transparent"), keduanya langsung dibuang dari pool (gak pernah kepakai item manapun juga, aman dihapus).

**Catatan**: kalau nanti mau upload icon pack sendiri (disebut user), tinggal pakai fitur "Upload Gambar Sendiri" yang udah ada di Admin Item Form (bagian 47) — asalkan gambarnya emang transparan (PNG dengan alpha channel), bakal otomatis kena warna rarity yang sama kayak ikon pool.

---

## 49. Fix Bug Kritis: Karakter Terus "Skip" Battle (mana/stamina cost naik eksponensial) + Tampilan Cost/CD (v7.2)

### Root cause: mana/stamina cost skill ikut naik level (harusnya cuma damage)
`skillCombatStats()` (bagian 30, auto-scale skill per level) sebelumnya nge-scale **mana_cost DAN stamina_cost** pakai `levelFactor` yang SAMA kayak damage (`ratio^(level-1)`, default 1.3). Ini bikin biaya skill naik **eksponensial** seiring level (level 8 → cost naik ~6.3x dari base!), sementara pool MP/SP karakter naiknya jauh lebih lambat (linear-ish dari level growth stat). Efeknya: makin tinggi level, karakter makin sering **gak mampu bayar skill apapun** → battle log kebanyakan "belum ada skill siap pakai, cuma bertahan" (skip terus).

**Fix**: `mana_cost`/`stamina_cost` sekarang **TETAP di base value skill** (gak ikut naik level) — cuma **damage** yang naik seiring level (sesuai desain awal, "skill auto-scale" itu emang niatnya buat damage doang). Cooldown & skill point allocation tetap kerja seperti biasa.

**Konfirmasi**: mekanisme "full heal HP/SP/MP abis battle" (bagian 32) **udah bener dari awal, gak ada masalah di situ** — dicek ulang tetap utuh, root cause murni dari cost-scaling yang salah.

### Tampilan CD/Mana/Stamina cost di halaman karakter
User minta ditambahin biar transparan — sekarang tiap `SkillCard` (Loadout Battle) dan card di Skill Point Allocation nampilin baris kecil: **MP X · SP Y · CD Zs** langsung di bawah deskripsi skill. Di section allocation, CD-nya udah disesuaikan sama pengurangan dari poin yang udah diinvest (`cooldown × (1 - bonus%)`).

---

## 49. Fix Bug Kritis: Damage Skill Meledak di Level Tinggi (13.372 damage!) (v7.2)

User laporkan: karakter level 13 nge-damage **13.372** ke monster level 2 pakai skill tier-1 biasa — jelas gak wajar.

### Root cause: exponential compounding, bukan linear
`skillCombatStats()` (bagian 30) pakai `levelFactor = $levelRatio ** ($character->level - 1)` — KOMPON BERLAPIS EKSPONENSIAL. Contoh awal yang dikasih waktu itu ("damage 20 jadi 26 di level 2") emang cocok (`1.3^1 = 1.3`), TAPI begitu levelnya naik jauh, angkanya meledak:
```
Level 2:  1.3^1  = 1.3x
Level 13: 1.3^12 = ~23.3x  <- INI YANG BIKIN MASALAH
Level 20: 1.3^19 = ~146x
```
Digabung sama offense stat yang emang udah tinggi (dari level growth + stat point + item), plus critical hit, plus efektivitas elemen — hasil akhirnya bisa nembus belasan ribu damage ke monster yang harusnya biasa aja.

### Fix: linear growth, bukan eksponensial
```php
$levelFactor = 1 + (($levelRatio - 1) * ($character->level - 1));
```
Level 2 tetap PERSIS sama kayak contoh awal (`1 + 0.3*1 = 1.3x`), tapi level 13 cuma `1 + 0.3*12 = 4.6x` — jauh lebih masuk akal, BUKAN `23x`. Ini juga sekalian menyamakan konsistensi sama `Character::levelGrowth()` (pertumbuhan stat dasar karakter dari level) yang emang dari awal udah linear, bukan eksponensial — jadi sekarang seluruh sistem growth konsisten pakai model yang sama.

Setting `skill_level_growth_ratio` di admin tetap nama & default value-nya sama (1.3), cuma CARA PAKAINYA yang diperbaiki — deskripsinya di `/admin/settings` juga udah diupdate biar akurat.

---

## 50. Fix Bug Kritis Lanjutan: Monster & NPC JUGA Kena Pola Eksponensial (v7.3)

User nanya "apakah rumus di monster dan NPC juga aman?" setelah fix bug damage skill (bagian 49) — jawabannya **TIDAK**, pola bug yang sama (`ratio ** exponent`, kompon berlapis) ternyata ada di 2 tempat lain juga, dan **monster malah jauh lebih parah**:

### Monster — paling parah
```php
$factor = $ratio ** ($targetLevel - $monster->level);
```
Party level 13 + bonus admin +3 = monster bisa di-roll sampai level 16, exponent = 15. Dengan ratio default 1.5: **`1.5^15 ≈ 437x`** lipat HP/damage/defense/reward! Monster di level segitu bisa jadi tembok HP raksasa yang gak kebunuh, ATAU kalau si player ketemu monster paling lemah dari rentang roll, malah kebalikannya jadi trivial banget — random-nya jadi liar gak terkontrol.

### NPC — sama pola, sedikit lebih ringan
```php
$factor = $ratio ** ($encounterLevel - 1);
```
Party level 13 ± variance 2 = NPC bisa level 15, exponent 14. Dengan ratio default 1.3: **`1.3^14 ≈ 39x`** lipat.

### Fix: linear, konsisten sama fix skill sebelumnya
```php
$factor = 1 + (($ratio - 1) * ($targetLevel - $monster->level));  // monster
$factor = 1 + (($ratio - 1) * ($encounterLevel - 1));              // NPC
```
Sekarang **ketiga sistem growth** (skill damage, monster stat, NPC stat) konsisten pakai model linear yang sama — gak ada lagi kompon berlapis eksponensial di manapun. Dicek juga gak ada formula `**` lain yang kelewat di `BattleService`/`Character`/`Monster`.

Setting `monster_level_growth_ratio` (default 1.5) dan `npc_level_growth_ratio` (default 1.3) nama & default value-nya TETAP SAMA — cuma cara pakainya yang diperbaiki. Deskripsi di `/admin/settings` juga diupdate.

---

## 51. Fix Bug OP Lanjutan: Bonus Stat Point/Item Ikut Kelipatgandain Skill Multiplier (v7.4)

User cek ulang setelah fix eksponensial (bagian 49-50), masih ngerasa player OP. Analisa lebih dalam: formula damage lama ngaliin **SELURUH** offense stat (base + bonus stat point + bonus item) sama `skillStats['multiplier']` yang levelnya sendiri udah naik dari level karakter. Efeknya **2 sistem growth numpuk secara PERKALIAN** (bukan cuma dijumlah) — kalau karakter udah investasi banyak stat point + item (contoh nyata dari user: Physical Attack 175 = base 63 + stat point 44 + item 68, jadi **64% dari total stat itu BONUS**), bonus segede itu ikut kelipatgandain sama skill multiplier juga.

### Fix: skill multiplier cuma ngefek base stat, bonus ditambah FLAT
```
raw = (base_stat × skill_multiplier) + bonus_stat_point + bonus_item + bonus_elemental
```
Bukan lagi:
```
raw = (base_stat + bonus_stat_point + bonus_item) × skill_multiplier   ← LAMA, salah
```

`base_stat` = `Character::leveled_physical_damage`/`leveled_magic_damage` (subclass + level growth doang). `bonus_stat_point` (dari upgrade EXP/stat point gratis), `bonus_item` (dari equipped item), dan `elementalDamageBonus` (item "+fire damage" dst) semuanya jadi **penjumlahan flat** di luar perkalian.

Diterapkan konsisten di 3 tempat: **serangan biasa**, **heal** (Magic Attack jadi basis kekuatan heal), dan **buff** (basis persentase bonus). NPC dikecualikan dari split ini (tetap dikaliin utuh apa adanya) — karena NPC by design gak pernah punya stat point/item ekstra, jadi splitnya gak relevan buat mereka.

**Efek**: investasi ke stat point/item tetap berguna (proporsional linear ke damage), tapi gak lagi "ikut dilipatgandain" sama pertumbuhan level skill — biang OP utama sekarang ilang.

---

## 52. Rasio HP Monster Dipisah dari Rasio Damage Monster (v7.5)

User laporkan: 1 rasio (`monster_level_growth_ratio`) dipakai buat SEMUA stat monster (HP, damage, defense, reward) bikin gak fleksibel — set rendah, monster cepet mati (HP kurang); set tinggi, player malah kena 1 hit (damage monster ikut naik juga). Gak bisa disetel independen.

### Fix: 2 setting terpisah
- **`monster_hp_growth_ratio`** (default 1.5) — HP + Physical/Magic Defense + EXP/Gold reward ("seberapa tahan & berharga" monster itu)
- **`monster_damage_growth_ratio`** (default 1.5) — Physical/Magic Damage doang ("seberapa sakit mukulnya")

Sekarang bisa disetel independen di `/admin/settings`: mau monster jadi tembok HP yang mukulnya pelan (naikkan HP ratio, turunkan damage ratio), atau glass cannon yang gampang mati tapi mukul keras (kebalikannya) — bebas dikombinasi.

Setting lama `monster_level_growth_ratio` otomatis dibuang dari database pas `php artisan db:seed` (biar gak nyangkut jadi row mati/gak kepakai di admin panel).

---

## 53. Tampilan Damage Final di Kartu Skill — Bantu Debug OP (sementara) (v7.6)

User set `skill_level_growth_ratio` ke 1 tapi masih ngerasa OP, minta cara buat lihat angka final biar bisa di-cek bareng.

### `estimateSkillDamage()` — replikasi PERSIS formula battle
Ditambahin di semua kartu skill (halaman detail karakter): Skill Point Allocation (skill yang beneran ke-loadout), picker Skill Biasa/Ultimate. Formula-nya sama persis kayak yang dipakai di `BattleService::skillCombatStats()` + damage calc (base/bonus split, linear level growth, allocation bonus) — **BEDA-nya**, ini gak termasuk defense musuh/critical hit/efektivitas elemen (itu baru keitung pas lawan monster beneran, beda-beda tiap battle). Jadi ini "damage dasar sebelum mitigasi", ditandai ikon ⚔️, label-nya nyesuain buff_type skill (Damage/Heal/Bonus %/Debuff x).

`CharacterController::show()` sekarang kirim `skillLevelGrowthRatio` (dari GameSetting) ke frontend biar kalkulasinya akurat ngikutin setting admin yang lagi aktif, bukan angka hardcode.

**Catatan**: ini fitur sementara buat bantu debug — kalau udah ketemu sumber OP-nya dan rasa balance-nya udah pas, bisa dipertimbangkan disederhanain lagi (atau dibiarin, karena info-nya emang berguna buat player ngerti kekuatan skill-nya sebelum battle).

---

## 54. Fix: Skill Point Allocation Rate 1% → 0.1% per Poin (v7.7)

User ketemu satu lagi sumber OP: Skill Point Allocation (invest EXP ke skill spesifik) ngasih **+1% damage / -1% cooldown per poin** — kegedean, seharusnya **+0.1% / -0.1%** per poin.

Diperbaiki konsisten di semua tempat yang pakai angka ini (backend & frontend WAJIB sinkron, karena frontend nge-estimasi angka yang bakal keluar di battle beneran):
- `BattleService::skillCombatStats()` — `allocFactor`/`cooldownFactor` (rumus battle asli)
- `Characters/Show.jsx` — `estimateSkillDamage()` (estimasi damage di kartu skill, bagian 53), badge "+X% dmg/-X% cd", tampilan CD ter-reduksi, teks penjelasan

Biaya EXP per poin (`(bonus_level+1) × 10`) **gak berubah** — cuma efek per poinnya yang dikecilin, jadi sekarang butuh 10x lebih banyak investasi buat dapet efek yang sama kayak sebelumnya (lebih gradual, gak gampang numpuk jadi OP).

---

## 55. Fix: Pool HP/MP/SP Kegedean karena Ikut Kebawa Bonus Stat Lain (v7.8)

User ketemu lagi: **SP/Stamina kegedean**. Root cause: `getEffectiveBaseHpAttribute()`/`Mp`/`Sp` dihitung dari `effective_physical_damage`/`effective_physical_defense`/`effective_magic_damage`/`effective_magic_defense` — yang UDAH TERMASUK bonus stat point + item dari stat itu sendiri. Jadi kalau invest stat point/item ke **Physical Attack**, pool **SP** ikut kegedean juga (padahal SP itu turunan dari Physical Attack+Defense, gak ada hubungan langsung sama "seberapa banyak stat point yang di-invest ke Physical Attack").

### Fix: pakai base murni (`leveled_X`), bukan `effective_X`
```php
base_hp = leveled_physical_defense + leveled_magic_defense + itemBonus('hp')
base_mp = leveled_magic_damage + leveled_magic_defense
base_sp = leveled_physical_damage + leveled_physical_defense
```
`leveled_X` = subclass base + level growth **doang**, TANPA bonus stat point atau item dari stat itu. Sekarang pool HP/MP/SP cuma naik dari **level**, gak ikut kebawa investasi ke stat combat lain. Item dengan `effect_stat='hp'` spesifik (dari bagian 39-40) **tetap** nambah HP langsung — itu emang tujuan dedicated-nya, beda dari efek tidak langsung yang barusan dihapus.

Gak ada tempat lain di codebase yang pakai pola formula sama (dicek grep), jadi fix ini cukup di 1 titik.

---

## 56. Fix Bug Kritis: Rentang Roll Level Monster Gak Simetris (v7.9)

User laporkan: party level 16, monster keluar level 3 — instan KO, padahal setting-nya "-3/+3".

### Root cause
`rollMonsterLevel()` roll dari `$monster->level` (base, SELALU 1 sekarang) sampai `$partyMaxLevel + $bonus` — rentangnya **kelewat lebar ke bawah**. Party level 16 + bonus 3 = `random_int(1, 19)`, yang artinya monster BISA aja ke-roll level 3 (atau bahkan level 1) walau party udah tinggi banget, karena batas bawahnya gak pernah ngikutin level party sama sekali.

### Fix: rentang simetris di sekitar level party
```php
$minLevel = max($monster->level, $partyMaxLevel - $bonus);
$maxLevel = max($monster->level, $partyMaxLevel + $bonus);
return random_int($minLevel, $maxLevel);
```
Party level 16, bonus 3 → sekarang roll `random_int(13, 19)` — persis di sekitar level party, gak pernah jauh ke bawah lagi. Pola ini disamain sama cara NPC ngatur levelnya (`partyMaxLevel ± variance`, udah bener dari awal).

### Setting di-rename biar akurat
`monster_max_level_bonus` → **`monster_level_variance`** (nama lama nyiratin "cuma nambah batas atas", padahal sekarang dipakai simetris buat batas atas MAUPUN bawah). Dipakai di 2 tempat: roll level monster (`BattleService`) dan gerbang level spawn point di Peta (`MapController`) — keduanya udah disamain ke nama baru. Setting lama otomatis dibuang pas `db:seed`.

---

## 49. Fix Bug: Gagal Bikin Monster Baru (kolom legacy NOT NULL) (v7.2)

**Error**: `SQLSTATE[23502]: Not null violation ... null value in column "strong_against" of relation "monsters"` — gagal tiap kali bikin monster baru lewat `/admin/monsters`.

**Root cause**: `strong_against`/`weak_against` kolom LAMA (1 pola string, sebelum sistem `weak_matchups`/`strong_matchups` di bagian 27) masih `NOT NULL` di database (dari migration awal), tapi `Admin\MonsterController::validated()` udah lama berhenti ngisi kedua kolom itu (fully digantikan sistem matchup baru). Insert monster baru = kedua kolom legacy itu gak pernah disertakan = Postgres nolak (NOT NULL constraint).

**Fix**: migration baru, `ALTER TABLE monsters ALTER COLUMN ... DROP NOT NULL` (raw SQL, sengaja gak pakai `Schema::change()` biar gak butuh `doctrine/dbal` yang belum tentu ke-install). Kolom-kolom ini SENGAJA dibiarkan ada (bukan di-drop) buat jaga-jaga data historis, tapi sekarang boleh null — sesuai kondisi aslinya (udah gak dipakai kode manapun lagi).

---

## 50. Monster Selalu Pakai Skill (Physical/Magic Eksplisit) + Damage Campuran Persen (v7.3)

### Masalah lama
Serangan monster sebelumnya bisa "fallback" ke serangan generik yang nebak sendiri physical/magic dari perbandingan stat (`magic_damage > physical_damage`) — ambigu, gak jelas dari sisi desain skill.

### Sekarang: monster SELALU nyerang lewat skill, physical/magic eksplisit
- Setiap skill monster (`skills_config`) sekarang punya field **`physical_ratio`** (0-100, wajib diisi di admin, default 100=full physical). 0 = full magic, 100 = full physical, di antaranya = **campuran** (misal 60 = 60% physical + 40% magic, mitigasi damage juga dihitung campuran dari physical_defense+magic_defense target sesuai rasio yang sama).
- `MonsterDefaultSkillSeeder` (baru) — jamin SEMUA monster (termasuk 12 monster dasar dari `MonsterSeeder`) punya minimal 1 skill eksplisit. Buat monster yang belum di-edit manual, `physical_ratio`-nya dihitung SEKALI dari perbandingan stat physical_damage vs magic_damage aslinya (bukan dihitung ulang tiap ronde kayak dulu — angkanya jadi TETAP, bukan ambigu).
- Admin Monster Form: warning kalau list skill kosong ("monster ini gak bakal bisa nyerang sama sekali"), field baru "Physical %" per skill.

### Skill karakter (player) juga bisa campuran
`skills.physical_ratio` (nullable) ditambahkan sebagai REFINEMENT opsional di atas `scaling_stat` yang udah ada:
- **Kosong** (default, semua 112 skill yang udah ada tetap kosong) → fallback ke `scaling_stat` lama (100% Physical kalau `scaling_stat='physical'`, 100% Magic kalau `'magic'`) — **gak ada yang berubah** buat skill existing, sesuai keputusan user ("pilih saja 100% pisik/magic, saya edit nanti").
- **Diisi** (0-100) → override jadi campuran custom, admin bisa atur manual kapan aja di `/admin/skills`.

### Formula damage campuran (dipakai konsisten player & monster)
```
offenseStat = physicalStat × (physical_ratio/100) + magicStat × (1 - physical_ratio/100)
defenseStat = physicalDefense × (physical_ratio/100) + magicDefense × (1 - physical_ratio/100)
```
`Skill::resolvedPhysicalRatio()` — method helper yang nanganin fallback logic (physical_ratio eksplisit vs scaling_stat lama) di satu tempat, dipakai `BattleService` biar konsisten.

---

## 51. Fix Bug: Gambar Map Gak Muncul (Maps/Show.jsx gak pernah baca background_path) (v7.4)

**Laporan**: upload gambar map lewat admin berhasil, tapi pas buka halaman Peta tetap blank/hitam, cuma spawn point yang keliatan.

**Root cause**: `Maps/Show.jsx` dari awal dibuat (v-lama, sebelum fitur upload background ada) pakai `background: 'radial-gradient(...)'` hardcode sebagai placeholder — dan **gak pernah diupdate** buat baca `map.background_path` pas fitur upload background ditambahin belakangan (bagian 32/38). Jadi biarpun `Admin\MapController::uploadBackground()` beneran nyimpen gambar & path-nya dengan benar ke database, halaman publik yang nampilin peta gak pernah pakai data itu.

**Fix**: `Maps/Show.jsx` sekarang cek `map.background_path` — kalau ada, pakai `backgroundImage: url(...)` (`cover`, center); kalau belum di-upload, fallback ke gradient placeholder kayak sebelumnya.

---

## 52. Fix Bug: Seeder Gagal - Perbandingan Kolom JSON Postgres (v7.5)

**Error**: `SQLSTATE[42883]: Undefined function: operator does not exist: json = unknown` pas jalanin `php artisan migrate --seed`.

**Root cause**: `MonsterDefaultSkillSeeder` (bagian 50) pakai `->orWhere('skills_config', '[]')` buat ngecek monster dengan skill kosong. Kolom `skills_config` tipenya `json` (bukan `jsonb`) di Postgres — tipe `json` **gak dukung operator `=`** langsung buat perbandingan, cuma `jsonb` yang bisa. Laravel nerjemahin `->orWhere()` biasa jadi SQL `=` mentah, Postgres nolak.

**Fix**: ganti pakai `whereJsonLength('skills_config', 0)` — method Laravel yang khusus buat ngecek panjang array JSON, diterjemahin ke fungsi `json_array_length()` yang emang didukung tipe `json` di Postgres (bukan operator `=` biasa).

---

## 53. Battle Log Dihapus Total → Damage Number Floating + Reposisi HP Bar + HUD Manual (v7.6)

### Battle log teks dihapus, ganti animasi visual
Sebelumnya ada box scroll teks "Battle Log" di bawah arena. Sekarang **dihapus total** — feedback battle sepenuhnya visual:
- **Damage number floating**: "-100" merah muncul di atas target yang kena, melayang naik & fade (CSS keyframe `rpg-float-up`, 1.1 detik)
- **Heal**: "+50" hijau, format sama
- **Miss**: teks "MELESET" abu-abu kecil
- **Critical**: font lebih besar + tanda seru

Backend `snapshot()` sekarang punya field `effect` terstruktur (`type`, `value`, `target`, `is_critical`, `is_ultimate`) — bukan cuma teks lagi, biar frontend gampang render animasi tanpa parsing string.

### HP bar dipindah ke bawah sprite
Sebelumnya HP bar di ATAS nama+sprite (deket kepala). Sekarang dipindah ke **bawah sprite** — berlaku buat semua karakter/NPC party maupun monster.

### Animasi Ultimate dibedain (bukan cuma warna)
Skill tier-3 (ultimate) sekarang dapet **glow emas berdenyut** (`rpg-ulti-pulse`, CSS keyframe animasi filter drop-shadow) di sekitar sprite pas dipakai — beda total dari skill biasa, gak cuma soal warna GIF-nya doang.

### HUD Mode Manual: HP/MP/SP + skill bar
Panel baru "Status Kamu" muncul di bawah arena (cuma mode Manual) — 3 bar (HP merah, SP oranye, MP ungu) lengkap sama angka current/max, plus `ManualSkillBar` (5 tombol skill icon + keybind letter di pojok, overlay angka cooldown, **abu-abu + grayscale filter** kalau lagi cooldown/gak affordable — jelas beda dari yang siap pakai).

Tombol "Lewati" (skip animasi) disembunyikan di mode Manual (gak relevan, gak ada playback buat di-skip) — diganti tombol "🏳️ Menyerah" (flee) yang emang cuma relevan pas battle masih `ongoing`.

---

## 54. Fix Bug Battle Manual Stuck + Layout Arena Baru (Player-Monster-NPC 3 Kolom) (v7.7)

### Fix bug penting: battle manual freeze kalau player diem
**Laporan**: "stag tidak ada tindakan apa-apa, NPC gak menyerang monster juga". Root cause: `sendManualAction()` dulu CUMA ke-trigger dari klik/keyboard player - kalau player lagi mikir/gak ngapa-ngapain, NPC & monster IKUT diem total (gak ada mekanisme yang jalanin giliran mereka independen dari aksi player).

**Fix**: polling otomatis tiap `skillActionDelay` detik (setting admin) - kirim `skillId=null` ("player skip giliran ini") ke `processManualTurn()`, yang tetap proses NPC (`autoPickSkill`) & monster (`executeMonsterTurn`) meskipun player belum milih skill apapun. Battle jalan terus walau player idle.

### Layout arena baru: Player kiri - Monster tengah - NPC kanan (ditumpuk)
Sebelumnya semua party (player+NPC) baris sejajar di bawah. Sekarang:
- **Player** (karakter yang login) sendiri di **kiri**, agak besar
- **Monster** di **tengah**, besar, HP bar di bawahnya, efek (damage/heal/miss) + nama serangan monster ditampilin **di bawah HP bar** (bukan nempel di sprite, biar gak nutupin)
- **NPC** (sampai 2) ditumpuk di **kanan**, lebih kecil, otomatis deket monster (gak perlu tombol toggle posisi terpisah - emang defaultnya udah gitu di layout baru)

**Floating damage/heal number** sekarang muncul di SISI karakter yang ngarah ke monster: Player (kiri layar) → teks di sisi **kanan** dia. NPC (kanan layar) → teks di sisi **kiri** dia. Backend `effect` dapet field baru `skill_name` (khusus serangan monster) buat ditampilin di bawah.

### Penyesuaian HUD Manual
- Ikon skill diperkecil (56px → 42px)
- Spacing panel "Status Kamu" dirapatkan (HP/SP/MP bar lebih deket ke skill bar di bawahnya, gak ada gap besar lagi)

---

## 55. Fix Bug Tombol Skill Ilang + Menu Pengaturan + Mini-Log + Ikon 48px (v7.8)

### Fix bug: tombol skill manual ilang di awal battle
**Root cause**: `BattleController::act()` eager-load-nya cuma `'participants.character.subclass'` (tanpa `.skills`). Response ini nimpa state frontend setelah AKSI PERTAMA (termasuk auto-poll otomatis yang jalan beberapa detik setelah battle mulai, bukan cuma dari klik player) — begitu `subclass.skills` ilang dari data, `ManualSkillBar` gak nemu skill loadout-nya, tombol jadi kosong/ilang. Fix: tambah `.skills` ke eager load.

### Menu Pengaturan (player, bukan admin)
- Kolom baru `users.default_battle_mode` ('auto'/'manual', default 'auto')
- Nama user di nav (yang tadinya cuma teks statis) sekarang jadi **dropdown**, isinya link "⚙ Pengaturan"
- Halaman `/settings` — toggle Auto/Manual (styling sama kayak toggle di halaman Frontman), disimpan ke akun
- Preferensi ini otomatis jadi **default terpilih** di halaman Frontman (masih bisa diganti manual per-battle, gak dikunci)

### Mini-log floating di bawah monster
Ruang kosong di bawah efek+nama serangan monster sekarang diisi **1 baris teks terakhir** (`current.text`, font kecil, background semi-transparan tanpa border box) — mirip battle log tapi ringkas & "ngambang" di area yang emang masih kosong, bukan box scroll besar kayak sebelumnya.

### Ikon skill 48px
Ukuran ikon skill manual disesuaikan dari 42px → 48px sesuai permintaan.

---

## 56. Delay Skill Jadi Waktu Asli Per-Karakter (bukan Tick Bersama) + Hapus Toggle Mode di Frontman + Fix Nav (v7.9)

### Fix konsep: delay skill sekarang bener-bener independen per karakter
**Laporan**: "delay skill ini per player kan, bukan per skill kluar - jadi pas NPC pakai skill, punya saya harusnya gak kena delay". Ketemu akar masalahnya: cooldown di mode Manual sebelumnya diukur pakai `battle.round_number` — counter GLOBAL yang sama dipakai buat SEMUA actor (player, NPC, monster) sebagai "referensi jam". Walau storage cooldown-nya emang udah per-participant, REFERENSI WAKTU yang dipakai buat ngukur "udah berapa lama" itu sama-sama satu jam bersama.

**Fix**: ganti total ke **waktu asli** (`now()->diffInSeconds($battle->created_at)`, detik beneran sejak battle mulai) - dibandingin LANGSUNG ke `skill->cooldown_seconds` (gak perlu dibulatin ke satuan "tick" pakai `skill_action_delay` lagi, jadi presisinya juga lebih akurat). `autoPickSkillRealtime()` (method baru, khusus mode Manual) dipisah dari `autoPickSkill()` lama (tetap dipakai mode Auto, gak disentuh sama sekali biar gak ada risiko regresi). Frontend `ManualSkillBar` juga diupdate ngukur cooldown dari `Date.now() - battle.created_at`, bukan `battle.round_number`.

### Toggle Auto/Manual dihapus dari halaman Frontman
Sekarang preferensi dari menu Pengaturan otomatis dipakai, gak perlu pilih ulang tiap battle - halaman Frontman cuma nampilin info mode yang lagi aktif + link ke Pengaturan kalau mau ganti.

### Fix nav: tombol username diganti langsung jadi link Pengaturan
Sebelumnya nama user di nav jadi dropdown (ternyata gak fungsi dengan baik) - sekarang langsung jadi link "⚙ Pengaturan" tanpa perlu dropdown.

---

## 57. Pengaturan Audio di Admin — Upload Custom Sound per Event Battle (v8.0)

Halaman baru `/admin/audio` — admin bisa upload file audio custom (MP3/WAV/OGG, maks 2MB) buat gantiin suara sintesis default (Web Audio API) di 9 event battle:

| Event | Kapan trigger |
|---|---|
| Battle Mulai | Monster muncul di awal battle |
| Pakai Skill (biasa) | Karakter/NPC pakai skill non-ultimate, kena target |
| Pakai Skill Ultimate | Skill tier-3 (ultimate) dipakai, kena target |
| Critical Hit | Damage critical (siapapun yang nyerang) |
| Serangan Meleset | Hit chance gagal (siapapun) |
| Kena Serangan Monster | Monster nyerang balik ke party, kena |
| Dapat Item Drop | Item drop abis menang battle (fitur baru, sebelumnya gak ada suara sama sekali) |
| Menang Battle | Battle selesai, status won |
| Kalah Battle | Battle selesai, status lost |

### Implementasi
- `GameSetting` dipakai buat nyimpen PATH file (bukan cuma angka/teks kayak setting lain) — kosong = fallback ke suara sintesis
- `Admin\AudioController` — upload (validasi mimes mp3/wav/ogg/m4a, replace file lama otomatis) & reset (hapus file, balik ke default) per slot
- `battleAudio.js` — tiap fungsi terima `customUrl` opsional, coba `new Audio(url).play()` duluan, fallback ke `beep()` sintesis kalau kosong/gagal (di-cache per URL biar gak re-fetch tiap trigger)
- `Battle/Show.jsx` — sound trigger di-rewrite pakai data `effect` terstruktur (bukan text-matching lagi), bisa bedain: skill vs ultimate (cek `is_ultimate` dari effect), nyerang vs kena serang (`is_monster_actor`), dan deteksi item drop dari teks "dapat item"
- Tambah 2 suara sintesis BARU sebagai fallback: `skill` (beda dari `hit` biasa) dan `itemDrop`, plus `ultimate` yang lebih megah (4-note chord) dibanding `critical`

---

## 58. Fix Setting Manual Gak Nyantol + NPC Gak Kebagian Giliran + Upload GIF Skill (v8.1)

### Fix bug: setting Manual selalu balik ke Auto
**Root cause**: `User` model pakai PHP attribute `#[Fillable(['name', 'username', 'email', 'password'])]` — `default_battle_mode` **gak ada di list itu**. Jadi `$request->user()->update(['default_battle_mode' => ...])` di `SettingsController` diam-diam GAGAL (mass assignment protection Laravel), value-nya gak pernah beneran ke-save ke database, selalu balik baca default 'auto' dari migration. Fix: tambahin `default_battle_mode` ke Fillable list.

### Fix: NPC kelihatan gak pernah nyerang
Bukan bug di engine skill-nya, tapi soal **urutan giliran**. Party dari Guild selalu tersusun [karakter kamu, NPC, NPC] - dan loop battle sebelumnya SELALU proses sesuai urutan itu tiap ronde (karaktermu duluan). Kalau serangan kamu cukup buat ngalahin monster, loop langsung `break` SEBELUM giliran NPC ke-proses - keliatan kayak "NPC gak pernah nyerang" padahal cuma emang gak kebagian giliran (monster keburu mati). Fix: urutan giliran di-**acak tiap ronde** (`$battle->participants->shuffle()`), diterapkan di mode Auto maupun Manual - NPC sekarang punya kesempatan adil gerak duluan.

### Upload GIF di Skill Editor
`/admin/skills/{id}/edit` sekarang punya section "Animasi Skill (GIF)" - upload langsung dari form (fetch(), gak reload halaman), preview GIF yang udah ke-upload, tombol "Ganti GIF" buat replace. Disimpen ke `public/images/skills/animations/skill-{id}.gif`, update `skills.animation_path` otomatis.

---

## 59. Fix Cooldown Skill/Ulti Jadi Countdown Real-Time (v8.2)

**Laporan**: "cooldown system untuk skill tidak berjalan, ini cooldown ulti juga tidak real time, nunggu ada serangan [baru update]".

**Root cause**: logic cooldown-nya sendiri sebenarnya udah bener (dihitung dari waktu asli sejak battle mulai, lihat bagian 56) — masalahnya di **tampilan**. `nowSeconds` di `ManualSkillBar` cuma dihitung ULANG setiap kali komponen re-render, dan komponen ini cuma re-render kalau ada respons server baru (abis klik skill, atau auto-poll tiap `skill_action_delay` detik). Di ANTARA respons-respons itu, angka cooldown yang ditampilin BEKU — gak keliatan ngitung mundur beneran walau di belakang layar udah jalan bener.

**Fix**: `ManualSkillBar` sekarang punya timer sendiri (`setInterval` 1 detik) yang maksa komponen re-render tiap detik, independen dari kapan server ngirim update. Countdown-nya sekarang beneran "ngitung mundur detik demi detik" kayak yang diharapkan — berlaku sama buat skill biasa MAUPUN ultimate.

---

## 60. Fix Mini-Log Gak Kelihatan (Ke-potong Overflow Arena) (v8.3)

**Laporan**: mini-log 1 baris (bagian 55) gak muncul di mode Manual.

**Root cause**: kontainer arena punya `overflow: hidden` (buat sudut rounded background tetap rapi). Tumpukan konten di kolom monster (gambar + nama + HP bar + efek damage + nama skill + mini-log) kepanjangan secara vertikal, ngelewatin batas bawah arena — mini-log-nya KE-RENDER tapi ke-potong/gak kelihatan karena posisinya udah di luar area yang keliatan.

**Fix**: gambar monster digeser ke atas dikit (`top: 4% → 1%`) dan dikecilin dikit (`maxHeight: 175 → 145`), area efek dirapatkan (`minHeight: 32 → 24`), mini-log dibatasi 1 baris tegas (`whiteSpace: nowrap` + `textOverflow: ellipsis`, gak bakal wrap ke 2 baris walau teksnya panjang) — total ruang vertikal yang dibutuhin lebih kecil, muat dalam batas arena.

---

## 61. Fix Skill Cooldown Grey + HP/SP/MP Regen Real-Time (v8.4)

**Laporan**: ulti cooldown udah bener, tapi skill (tier-1) biasa gagal keliatan grey pas cooldown - diklik malah keliatan "meleset terus" (padahal seharusnya blocked, bukan diproses jadi serangan meleset).

### Fix: perkuat pengecekan cooldown/afford di frontend
Kemungkinan besar celahnya di tipe data — nilai dari JSON (cooldown timestamp, mana/stamina cost) sekarang dipaksa jadi `Number()` eksplisit sebelum dibandingin, biar gak ada kemungkinan perbandingan `>=`/pengurangan salah diam-diam gara-gara type coercion JS yang gak konsisten. Kalau tombol beneran `disabled` (browser native), klik gak akan pernah nyampe ke server sama sekali — jadi begitu perhitungan `usable`-nya presisi, gak mungkin lagi ke-klik pas seharusnya cooldown/gak mampu bayar.

### HP/SP/MP regen real-time (fitur baru)
Sesuai request "misal 10/s gitu" — panel "Status Kamu" sekarang direfactor jadi komponen `PlayerStatusPanel` dengan **interpolasi real-time**: bar HP/SP/MP nambah dikit-dikit tiap detik di browser (bukan cuma "loncat" pas ada respons server baru), berdasarkan rate regen karakter (`effective_hp_regen` dkk, dikonversi ke per-detik dari `skill_action_delay`). Nilai display di-sinkronin ulang ke angka AUTORITATIF dari server tiap kali ada update beneran (gak numpuk drift/salah). Label kecil "(+X.X/s)" ditambahin di samping tiap bar biar rate-nya keliatan jelas.

---

## 62. Fix Race Condition Auto-Poll vs Klik Player (Cooldown "Reset" Random) + Ulti 15s Seragam (v8.5)

**Laporan**: "skill cooldown masih error, ada yang langsung reset kayak refresh page, terus diklik malah meleset. apa timernya gak sama ya."

### Root cause: race condition antara auto-poll dan klik manual
Guard "jangan kirim request baru kalau masih ada yang diproses" sebelumnya pakai **state React** (`acting`), yang bisa "telat" 1 render dibanding kondisi aslinya (closure lama, misal di dalam `setInterval` auto-poll, bisa masih baca `acting=false` versi lama). Kalau klik player dan auto-poll kebetulan nembak NYARIS BERSAMAAN, DUA-DUANYA bisa lolos pengecekan itu — 2 request kepr proses server BARENGAN, dan response yang **datang belakangan nimpa** state duluan. Efeknya keliatan random: kadang seperti "reset", kadang skill yang baru dipakai malah ke-treat kayak belum kepakai lagi.

**Fix**: guard utama sekarang pakai `useRef` (`actingRef`), yang NILAINYA SELALU sinkron real-time (gak nunggu render kayak state) — dicek dan di-set di satu langkah synchronous sebelum request dikirim, jadi gak mungkin lagi 2 request lolos bersamaan gak peduli seberapa presisi timing-nya. State `acting` tetap ada, cuma buat keperluan UI (nge-disable tombol pas lagi proses).

### Ultimate skill: cooldown 15 detik seragam
Semua skill tier-3 (ultimate, di semua 14 subclass) sekarang punya `cooldown_seconds = 15` — konsisten dan gampang diprediksi, gak variatif per skill lagi kayak sebelumnya.

---

## 63. Copot Total Ketergantungan "Delay" dari Cooldown & Regen Display (v8.6)

Sesuai permintaan — dicurigai `skill_action_delay` (setting admin) jadi sumber masalah di tampilan cooldown mode Manual. Diputus total:

- **Polling interval** mode Manual sekarang **konstanta tetap** di frontend (`POLL_INTERVAL_MS = 2500`), bukan lagi baca dari setting admin `skill_action_delay`. Tetap dipakai internal buat ngecek/proses giliran NPC & monster otomatis, tapi gak lagi "kekirim" sebagai konsep yang mempengaruhi persepsi cooldown skill.
- **`BattleController::show()`** gak ngirim `skillActionDelay` ke frontend lagi sama sekali.
- **Cooldown skill** (`ManualSkillBar`) tetap murni `skill.cooldown_seconds` vs waktu asli sejak battle mulai (gak pernah kesentuh delay dari awal, tapi sekarang dipastikan bener-bener terisolasi, gak ada prop nyambung ke sana).
- **Regen HP/SP/MP real-time** (`PlayerStatusPanel`) tetap jalan, rate-nya sekarang dihitung dari `POLL_INTERVAL_MS` (konstanta tetap), bukan setting admin.

Setting `skill_action_delay` di `/admin/settings` MASIH ADA dan masih dipakai (cuma buat mode Auto, server-side, gak pernah nyampe ke tampilan) — kalau mau dihapus total juga, bisa diberitahu lagi.

---

## 64. Fix Bug Timezone Parsing - Akar Masalah Cooldown "Ngaco" (v8.7)

**Laporan**: "cooldown tidak jalan, ulti pasti meleset, tiba-tiba belum 30 detik waktu udah habis, kayak ada waktu tersendiri."

### Root cause: parsing tanggal di client rawan salah timezone
Sebelumnya cooldown dihitung di JS pakai `new Date(battle.created_at).getTime()` — MEM-PARSE ULANG string tanggal ISO dari server. Ini **rawan meleset JAM** (bukan cuma detik) kalau ada AMBIGUITAS format timezone antara server (PHP/Laravel, `app.timezone=UTC`), koneksi database (Postgres session), dan cara JS nge-parse string tanggal itu. Kalau selisihnya sampai berjam-jam, SEMUA skill keliatan "langsung siap pakai lagi" instan — persis gejala "waktu tiba-tiba udah habis padahal belum 30 detik".

**Fix total**: hilangkan SAMA SEKALI parsing tanggal di client. Sekarang:
- Server ngirim **angka detik mentah** (`serverElapsedSeconds`, dihitung `now()->diffInSeconds($battle->created_at)` - PURELY server-side, gak ada celah parsing) di tiap response (`show()` awal DAN tiap `act()`)
- Client nyimpen angka ini + `Date.now()` client pas nerima ("titik sinkron")
- Buat "waktu sekarang", client CUMA nambahin delta `Date.now() - waktu_sinkron` (SAMA-SAMA clock client sendiri, gak ada parsing tanggal/timezone yang bisa salah sama sekali)

Cooldown gating SERVER-SIDE (`processManualTurn()`) udah aman dari awal (`now()->diffInSeconds()` PHP-native, konsisten karena `app.timezone=UTC` dipakai konsisten pas nulis MAUPUN baca) — masalahnya emang cuma di sisi tampilan/client.

---

## 65. Fix Waktu Cooldown Nambah Sendiri (Race Out-of-Order) + Mini-Log Jadi Baris Sendiri (v8.8)

### Fix: waktu cooldown "nambah sendiri" pas ada skill dari siapapun
**Laporan**: "waktu tiba-tiba bertambah trus dengan sendirinya, apalagi ketika ada skill siapapun yang masuk."

**Root cause**: auto-poll (jalan otomatis tiap beberapa detik) dan aksi manual player bisa nembak request ke server nyaris bersamaan. Kalau response yang LEBIH LAMBAT (dikirim duluan, tapi baru kelar belakangan karena network jitter) ke-apply SETELAH response yang lebih baru, angka "waktu berjalan" (`serverElapsedSeconds`) jadi **mundur** — dan karena sisa cooldown dihitung `cooldown_seconds - (now - lastUsed)`, kalau `now` mundur, sisa cooldown malah keliatan NAIK lagi (persis gejala "waktu nambah sendiri").

**Fix**: `elapsedSync` (gabungan serverSeconds+clientTime jadi 1 object, dulu 2 state terpisah) sekarang di-update lewat fungsi `updateElapsedSync()` yang **nolak update kalau angka barunya lebih kecil** dari yang lagi ditampilin sekarang — response basi/out-of-order otomatis diabaikan, waktu dijamin monotonic (cuma bisa maju, gak pernah mundur).

### Mini-log dipindah jadi baris sendiri (full-width)
Sebelumnya mini-log nyempil di kolom monster (sempit, dibatasi ellipsis). Sekarang jadi **baris terpisah full-width** di bawah arena (sebelum panel Status Kamu) — gak perlu dipotong lagi, teksnya bisa panjang. Karena ruang di kolom monster jadi lega lagi, **gambar monster dibalikin ke ukuran besar** (`maxHeight` 145→185, posisi geser balik ke `top: 3%`).

---

## 66. Fix Bug Fatal di Guard Waktu (Bikin Cooldown Ngaco Lagi) + Tombol Grey Kalau Mati (v8.9)

### Fix bug fatal: guard monotonic (bagian 65) SALAH bandingin
**Laporan**: "cooldown malah kembali error, kadang gk ada cooldown sama sekali tapi waktu battle jadi lebih singkat."

**Root cause**: fix di bagian 65 (`updateElapsedSync`) niatnya bagus (nolak update yang "mundur"), tapi **cara bandinginnya salah** — dibandingin ke `currentDisplayed` (hasil EKSTRAPOLASI, yang otomatis lebih besar karena udah nambahin estimasi delay jaringan), bukan ke nilai server SEBELUMNYA. Efeknya: update yang VALID pun sering ke-tolak (dikira "mundur" padahal enggak), bikin `elapsedSync` **beku di sync pertama** dan abis itu CUMA ekstrapolasi murni dari client (gak pernah dikoreksi ulang ke kenyataan server) — makin lama makin ngaco jauh dari waktu asli, kadang bikin cooldown keitung udah abis padahal belum (spam skill tanpa cooldown beneran → battle kelar lebih cepat dari harusnya).

**Fix**: bandingin ke nilai RAW server SEBELUMNYA (`prev.serverSeconds`), bukan hasil ekstrapolasi — apple-to-apple, sama-sama snapshot mentah dari server. Update valid HAMPIR SELALU lebih besar dari nilai sebelumnya (waktu server cuma maju), cuma nolak yang BENERAN basi/out-of-order.

### Tombol skill grey total kalau karakter mati
`ManualSkillBar` sekarang nerima status `is_alive` karakter yang dikontrol — kalau `false` (tumbang), SEMUA tombol otomatis grey + gak bisa ditekan (nge-override kondisi cooldown/afford individual), sama kayak kondisi `battle.status !== 'ongoing'`.

---

## 67. Fix HP Regen Tetap Jalan Pas Karakter Mati (v9.0)

**Laporan**: "ketika mati HP jadikan grey ini masih generate juga."

**Root cause**: `PlayerStatusPanel` interpolasi HP/SP/MP real-time (bagian 61) JALAN TERUS gak peduli status hidup/mati — begitu karakter tumbang (HP 0, `is_alive=false`), tampilan client tetap "nambahin" HP pakai rate regen kayak biasa (padahal server SAMA SEKALI gak nge-regen karakter yang udah tumbang), bikin HP keliatan naik lagi walau mati.

**Fix**: kalau `is_alive === false`, interpolasi DIMATIKAN — tampilin nilai HP/SP/MP apa adanya dari server (harusnya 0), gak diekstrapolasi naik lagi.

## Catatan soal laporan cooldown lainnya
Laporan "cooldown cuma jalan di awal", "6s jadi 3s", "ulti pasti meleset" kemungkinan besar adalah **efek langsung dari bug di bagian 66** (guard waktu yang salah bandingin, bikin jam client ngaco/drift) — yang udah diperbaiki di commit sebelumnya. Kalau laporan ini dites SEBELUM pull commit itu, gejalanya bakal persis kayak yang dijelasin (waktu ngaco bisa bikin cooldown keitung lebih cepat/lambat dari seharusnya, termasuk kemungkinan pola "6 detik keitung cuma 3 detik" kalau jam client-nya "lari" lebih cepat dari jam server).

Kalau setelah pull versi TERBARU (commit fix bagian 66 ke atas) + hard-refresh browser masalahnya masih persis sama, perlu diinfoin detail reproduksinya lagi (skill spesifik yang dipakai, urutan klik) buat investigasi lebih lanjut.

---

## 68. REWORK TOTAL Sistem Cooldown Skill — Tabel Dedicated (v9.1)

**Laporan berulang**: "cuma cooldown pertama yang jalan, habis itu gk jalan lagi. rework total aja algoritmanya."

Setelah beberapa kali coba dicari bug spesifiknya di sistem lama (kolom JSON `skill_cooldowns` gabungan, di-baca-ubah-simpan tiap kali skill dipakai) tanpa ketemu akar masalahnya secara pasti, diputuskan **rework total** ke pendekatan yang jauh lebih robust dan auditable.

### Arsitektur baru: 1 baris tabel = 1 cooldown skill
Tabel baru `battle_skill_cooldowns` (`battle_participant_id`, `skill_id`, `used_at_seconds`, unique constraint di kombinasi keduanya). **Setiap skill punya baris sendiri**, di-upsert (`updateOrCreate`) independen total dari skill lain — gak ada lagi 1 kolom JSON gabungan yang bisa numpuk masalah antar-skill.

- `BattleService::cooldownUsedAt()` — baca kapan 1 skill tertentu terakhir dipakai (1 query spesifik, per skill)
- `BattleService::recordCooldownUsed()` — catat pemakaian (upsert, gak nyentuh skill lain sama sekali)
- `BattleService::cooldownsMapFor()` + `attachCooldownsToParticipants()` — buat kompatibilitas response JSON ke frontend (`participant.skill_cooldowns` tetap bentuknya sama kayak sebelumnya, `ManualSkillBar` gak perlu diubah sama sekali)

### Scope rework: CUMA mode Manual
Mode **Auto** (`autoPickSkill()`, tick-based) **SENGAJA GAK DISENTUH SAMA SEKALI** — tetap pakai kolom JSON lama, biar gak ada risiko regresi di mekanisme yang udah kebukti jalan baik. Kolom `battle_participants.skill_cooldowns` (lama) masih ada di database, masih di-seed di awal battle (buat auto mode), tapi buat mode Manual sekarang CUMA dipakai sebagai "tampilan" (di-override pakai data segar dari tabel baru sebelum dikirim ke frontend) — sumber kebenaran (source of truth) yang beneran dipakai buat GATING/logic mode Manual sekarang 100% dari tabel dedicated.

### Ultimate seeding
Sama kayak sebelumnya (ulti mulai battle udah "dipakai di detik 0", langsung cooldown) — sekarang di-seed ke DUA tempat: kolom lama (buat auto) DAN tabel baru (buat manual), via `recordCooldownUsed($participant, $skillId, 0.0)` abis `BattleParticipant::create()`.

---

## 69. Fix Bug Fatal: Battle End Prematur Pas Skill Ditekan Cepat (v9.2)

**Laporan**: "jika skill ditekan cepat-cepat langsung end prematur."

### Root cause ketemu — ini kemungkinan besar PENYEBAB UTAMA semua laporan cooldown sebelumnya
`MAX_ROUNDS = 20` (cap "biar gak infinite loop") tadinya didesain buat mode Auto, dimana 1 "ronde" = 1 putaran SIMULASI (wajar dibatasi 20). Tapi di mode Manual, `$battle->round_number` naik 1 **SETIAP KALI** endpoint `/act` dipanggil — termasuk dari **klik cepat berturut-turut**! Kalau player spam klik skill (~20 kali dalam beberapa detik), `round_number` ngelewatin cap itu **cuma dalam hitungan detik** (bukan karena battle beneran udah lama), bikin battle **dipaksa berakhir premature** ("Pertarungan terlalu lama, party mundur") padahal baru jalan bentar.

Begitu battle berakhir premature, endpoint `/act` nolak semua request berikutnya (battle udah gak `ongoing`) — klik lanjutan gak ngapa-ngapain (kesannya "skill gak jalan"), dan karena battle terus-terusan restart dari awal, cooldown emang gak pernah kelihatan jalan normal dalam durasi yang cukup (kesannya "cooldown gk ada").

**Fix**: mode Manual sekarang pakai cap **waktu ASLI** (`MAX_MANUAL_BATTLE_SECONDS = 300` detik / 5 menit), bukan jumlah aksi — konsisten sama konsep mode ini yang emang berbasis waktu, bukan giliran/ronde. Klik secepat apapun, gak akan lagi ngaruh ke kapan battle "dianggap kelamaan" — itu sekarang murni soal berapa lama battle beneran udah berjalan.

Mode Auto (`MAX_ROUNDS=20`, berbasis jumlah ronde simulasi) **gak disentuh**, tetap seperti sebelumnya.

---

## 70. Tambah Error Logging - "Gk Ada Reaksi" Kemungkinan Request Gagal Diam-Diam (v9.3)

**Laporan**: "klik skill gk ada reaksi, cuma icon berkedip. animasi Blade Knight gak jalan, battle log juga gk ada."

**Analisis**: semua gejala ini (gak ada reaksi, animasi gak jalan, log gak update) konsisten sama SATU kemungkinan: request `/act` GAGAL di server, tapi sebelumnya di-`catch` dan **didiemin total** — gak ada tanda apapun ke user maupun developer. Kalau request gagal, `liveLog`/`liveBattle` gak pernah ke-update, jadi `step` gak maju, `current` gak berubah — semua yang bergantung ke situ (animasi, angka damage, mini-log) ikut "beku" karena emang gak ada data baru yang masuk.

**Fix diagnostik**: `sendManualAction()` sekarang **log ke console** (buka DevTools → Console) kalau:
- Response HTTP-nya gak `ok` (401/403/422/500 dll) - tampilin status code + isi errornya
- Response JSON punya field `error`
- Ada exception pas fetch/parsing

Ini BELUM tentu fix akar masalahnya (kalau ada beneran error di server), tapi sekarang errornya **kelihatan** — buka Console pas battle jalan, coba klik skill, screenshot/salin pesan error yang muncul (kalau ada) biar bisa dilacak lebih pasti apa yang sebenernya gagal.

---

## 71. Diagnostik "1 Skill Run Berikutnya Pasti Meleset" (v9.4)

**Laporan**: "kalau sudah run 1 skill, berikutnya pasti meleset." Screenshot Console browser dicek — **gak ada error** di request (`/act` sukses normal), jadi ini BUKAN soal request gagal (beda dari laporan sebelumnya).

**Analisis matematis**: formula hit chance (`max(50, min(99, 100 + accuracy - 90 - monster.agility))`) punya **batas minimum 50%** — secara matematis GAK MUNGKIN "pasti meleset" terus-terusan kalau logic-nya jalan normal (paling parah pun harusnya rata-rata kena separuh kali).

**Diagnostik ditambahin**: pesan "MELESET" di log sekarang nampilin **angka mentahnya**: `roll {angka} vs {hitChance}% | ACC {accuracy} vs AGI monster {agility}`. Ini bakal langsung ketauan dari 1 kali coba lagi: kalau `hitChance`-nya wajar (misal 70-90%) tapi kebetulan roll-nya di atas itu beberapa kali beruntun → itu emang sial normal (variance), BUKAN bug. Kalau `hitChance`-nya keitung absurd rendah (misal di bawah 50% padahal ada floor 50%, atau 0%) → baru itu bug kalkulasi beneran, dan sekarang ketauan persis di angka mana yang salah.

---

## 72. Fix Bug: Auto-Poll "Balapan" Sama Klik Manual, Makan Giliran Player (v9.5)

**Laporan**: "klik skill pertama aman, berikutnya skill tidak jalan cuma jadi refresh round, jadi klik skill langsung skill npc/monster berurutan lebih cepat."

### Root cause ketemu — race antara auto-poll dan niat klik player
Auto-poll (bagian 63, jalan sendiri tiap `POLL_INTERVAL_MS`=2.5 detik biar NPC/monster tetap gerak walau player diem) sebelumnya jalan di **jadwal tetap**, sama sekali gak peduli player baru aja klik atau lagi mikir. Kalau player butuh waktu sedikit lebih lama dari 2.5 detik buat mutusin skill apa yang mau dipake, jadwal auto-poll ini **keburu nembak duluan** (`skillId=null`, artinya "skip giliran") — makan jatah giliran player SEBELUM sempat klik. Efeknya persis kayak dilaporkan: skill pertama jalan (keburu klik cepet abis battle mulai), abis itu klik-klik berikutnya sering "kalah cepet" sama auto-poll yang jalan sendiri, kelihatan cuma NPC/monster yang gerak terus-terusan.

**Fix**: auto-poll sekarang **gak jadwal tetap** lagi — dicek tiap 0.5 detik, tapi CUMA beneran ngirim kalau udah **beneran lewat penuh `POLL_INTERVAL_MS` dari aksi terakhir** (baik itu klik manual player MAUPUN auto-poll sebelumnya). Setiap kali player klik (atau tekan keyboard), jam "napas" 2.5 detiknya **RESET** — jadi player SELALU dapet jatah penuh 2.5 detik buat mikir/klik tanpa disela auto-poll, gak peduli seberapa lama jarak antar klik mereka.

---

## 73. Diagnostik Lanjutan: Log "[DEBUG]" di Setiap Titik Skill Player Ditolak (v9.6)

**Laporan berulang**: "setelah skill pertama, berikutnya cooldown + skill gk jalan, meleset terus."

Karena bug ini terus berulang walau udah beberapa kali di-fix dari sisi berbeda (tabel cooldown dedicated, race auto-poll), sekarang ditambahin **log diagnostik eksplisit** di SETIAP titik dimana request skill player bisa "diem-diem ditolak" (sebelumnya `continue` doang, gak ada jejak sama sekali):

1. **Skill ID gak valid/gak ada di loadout** → log `[DEBUG] Skill ID {id} ditolak: gak ketemu di subclass atau gak ada di loadout.`
2. **Masih cooldown / MP-SP gak cukup** → log `[DEBUG] {nama} coba pakai {skill} TAPI DITOLAK: masih cooldown {sisa}s lagi (lastUsed=..., now=..., butuh ...s)` atau `MP/SP gak cukup (butuh XMP/YSP, punya AMP/BSP)`

Ini akan **langsung kelihatan di mini-log** (bagian bawah arena) kalau muncul — kalau request KAMU beneran nyampe ke server tapi ditolak, sekarang PASTI ada jejaknya, dan alasannya jelas. Kalau mini-log SAMA SEKALI gak nunjukkin entry `[DEBUG]` apapun padahal kamu ngerasa klik gak ngefek, berarti masalahnya di FRONTEND (request gak nyampe sama sekali) - beda diagnosis dan penanganannya.

---

## 74. Debug Log Dipindah ke File + Halaman Viewer (v9.7)

Debug diagnostik (bagian 73) yang tadinya nongol di battle log UI sekarang ditulis ke **file terpisah** (`storage/logs/skill-debug.log`), gak ganggu tampilan main. Dicatat SETIAP kali skill dicek (bukan cuma pas ditolak) - lengkap: `participant_id`, `skill_id`, `lastUsed`, `nowSeconds`, cooldown yang dibutuhin, status affordable, mana/stamina.

Ditambah juga logging di titik masuk request (`BattleController::act()`) — nyatet SETIAP request yang masuk (`battle_id`, `acting_character_id`, `skill_id` yang dikirim) dan alasan penolakan kalau ada (mode salah/battle udah selesai/karakter gak ketemu).

**Cara akses (gak perlu SSH)**: buka `/admin/skill-debug-log` di browser (admin-only) — nampilin 300 baris terakhir sebagai teks polos, gampang di-copy/screenshot. Tombol clear via `DELETE /admin/skill-debug-log` (atau langsung hapus filenya manual) buat mulai bersih sebelum tes baru.

**Ini fitur sementara** buat lacak bug cooldown yang berulang — bakal dihapus (route+controller) begitu masalahnya udah kelar.

---

## 75. KETEMU AKAR MASALAH SEBENARNYA: `diffInSeconds()` Ngasih Angka NEGATIF (v9.8)

**Dari debug log yang dikirim user**, ketemu baris kunci:
```
nowSeconds=-45.7
```
**NEGATIF.** Ini akar masalah SEMUA laporan cooldown yang berulang berkali-kali sejak bagian 64.

### Root cause
`now()->diffInSeconds($battle->created_at)` **tanpa parameter `$absolute` eksplisit** ternyata di versi Carbon yang dipakai project ini **defaultnya `false`**, dan hasilnya `created_at - now()` (bukan `now() - created_at` yang diharapkan) — karena `created_at` SELALU di masa lalu (lebih kecil dari `now()`), hasilnya SELALU **negatif**.

Basis waktu "elapsed seconds sejak battle mulai" yang jadi FONDASI seluruh sistem cooldown mode Manual (bagian 68) ternyata **salah tanda dari awal**. Efeknya kacau total dan gak konsisten — kadang kelihatan "cooldown gak ada" (karena perhitungan `nowSeconds - lastUsed` jadi angka aneh yang gak masuk akal), kadang "meleset terus" (efek ikutan dari logic yang kebingungan), dan lain-lain — semua gejala yang dilaporkan berkali-kali itu **satu akar masalah yang sama**, cuma manifestasinya keliatan beda-beda tergantung timing.

### Fix
3 titik yang kena, semua di-fix pakai parameter `$absolute=true` eksplisit (dijamin hasil selalu positif, gak peduli konvensi tanda Carbon versi berapa pun):
- `BattleService::processManualTurn()` — `$nowSeconds`
- `BattleController::show()` — `serverElapsedSeconds`
- `BattleController::act()` — `serverElapsedSeconds`

**Pelajaran**: `Carbon::diffInSeconds()` (dan method `diffInX` sejenis) **WAJIB selalu eksplisit kasih parameter `$absolute`** kalau butuh hasil yang predictable, jangan andalkan default (defaultnya bisa beda-beda tergantung versi Carbon/Laravel yang dipakai).

---

## 76. Damage Number: Ikon Skill, Durasi Lebih Lama, Bisa Numpuk (Stacking) (v9.9)

Setelah bug cooldown akhirnya kelar (bagian 75), sekarang polish visual damage number:

### Ikon jenis skill di samping angka
Ditentuin dari `physical_ratio` skill (dikirim backend, 0-100): **⚔️** kalau physical (≥50%), **🔮** kalau magic (<50%), **💥** kalau ultimate (nge-override yang lain). Critical hit dapet tambahan **💫** + tanda seru + font lebih besar (udah ada sebelumnya).

### Durasi animasi diperpanjang
Dari 1.1 detik → **1.8 detik** — lebih kebaca, gak buru-buru ilang.

### Damage number bisa NUMPUK (gak saling timpa)
Sebelumnya kalau ada 2 hit beruntun cepat (misal player + NPC nyerang monster yang sama nyaris bersamaan, atau efek dari skill combo), angka yang baru langsung GANTI yang lama (nempatin posisi yang sama, kesannya cuma 1 angka). Sekarang `FloatingNumberStack` (komponen baru, gantiin `FloatingNumber` lama) nyimpen SEMUA damage number yang lagi "aktif" (belum selesai fade-out-nya) dalam 1 array — tiap hit baru DITAMBAHIN ke stack (bukan ganti), digeser dikit ke atas (`stackIndex * 26px`) biar keliatan jelas sebagai angka-angka terpisah, masing-masing otomatis ilang sendiri-sendiri setelah durasi animasinya abis (independen, gak nunggu yang lain).

Berlaku di party member (kiri/kanan sisi karakter) — untuk panel monster (efek ditampilin di bawah HP bar, bukan floating di atas sprite) tetap 1 tampilan aja per momen (gak di-stack), tapi udah dapet ikon skill + critical yang sama.

---

## 77. Sistem Accession Item — Level 1-100, Sacrifice, Mithril, Shop Baru (v10.0)

Fitur besar baru terinspirasi dari referensi UI "Hujan's Trading Post" — Shop sekarang punya 3 menu terpisah, plus item baru yang bisa naik level.

### Kategori item: Artifact vs Accession
- **Artifact Item** — item biasa yang udah ada (70 item lama), bonus stat langsung, gak bisa di-level
- **Accession Item** (baru) — item spesial, bisa di-level **1-100**, power-nya naik seiring level. 8 contoh accession item di-seed (`AccessionItemSeeder`), rentang rarity Rare-Legendary, harga & drop rate disesuaikan lebih eksklusif dari Artifact setara

### Rumus power accession (`Item::accessionEffectiveValue()`)
```
effectiveValue = effect_value × (1 + (level-1) × 2%) × (1 + milestonesPassed × 15%)
```
Naik linear 2% tiap level, PLUS lompatan **+15% ekstra tiap kelipatan 20 level** (20/40/60/80/100) — ini implementasi "hidden skill" sebagai power spike (bukan skill terpisah dengan efek unik — itu pengembangan lebih lanjut kalau dibutuhin, infrastruktur kategori & level udah siap buat itu nanti).

### Currency baru: Mithril
Kolom `characters.mithril` — didapat dari **drop battle** (15% chance menang, 1-5/battle) atau (nanti) beli di shop. Dipakai bareng sacrifice item buat naik level accession.

### Level-up via Sacrifice (`AccessionController::levelUp()`)
- Pilih 1 accession item target + beberapa item Artifact buat "dikorbankan" (dihapus permanen) + isi Mithril
- **Gak bisa dikorbankan**: item **SR/Legendary** (sesuai permintaan), item Accession lain, item yang lagi **di-equip**, item target itu sendiri
- Poin sacrifice per rarity: Common=1, Rare=3, UR=8 (SR/Legendary gak masuk hitungan karena emang gak bisa dikorbankan) + Mithril nambah poin 1:1
- Butuh poin sejumlah `(level_tujuan)` buat naik 1 level — makin tinggi level, makin mahal naik lagi (natural progression curve)
- Preview level hasil real-time di frontend (rumus disamain persis kayak backend) SEBELUM submit

### Shop dirombak jadi 3 menu (`Shop/Menu.jsx`)
1. **🎒 Item Saya** (`/my-items`, `AccessionController::index()`) — lihat semua item (Accession + Artifact), UI level-up
2. **🗿 Beli Artifact Item** (`/shop/artifact`) — toko lama, sekarang di-filter kategori
3. **💠 Beli Accession Item** (`/shop/accession`) — toko baru, sama tampilannya, badge "Lv.1-100" di tiap card

`Shop/Index.jsx` lama dihapus, digantikan `Shop/Menu.jsx` (menu 3 pilihan) + `Shop/Category.jsx` (grid item, dipakai buat kedua kategori via parameter).

---

## 78. Shop Menu Pakai Gambar "Hujan's Trading Post" sebagai Background Interaktif (v10.1)

Gambar referensi (desa pedagang tropis, 3 papan kayu udah digambar: Item Saya/Beli Artifak Item/Beli Accession Item) dipakai LANGSUNG jadi background halaman menu Shop (`Shop/Menu.jsx`) — sama polanya kayak Town Hub (bagian 43): gambar full-bleed + hotspot klik transparan diposisikan PERSIS di atas tiap papan kayu (posisi dalam persen, divalidasi visual pakai overlay kotak warna sebelum di-finalize).

Hover di salah satu papan kasih border putih tipis + highlight redup, biar jelas area yang bisa diklik. Daftar link teks kecil di bawah gambar tetap ada buat aksesibilitas/fallback di layar kecil.

Gambar dikompres dari PNG 2.4MB jadi JPEG ~270KB (`public/images/ui/shop-menu-bg.jpg`).
