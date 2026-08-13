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
