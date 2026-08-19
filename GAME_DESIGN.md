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
