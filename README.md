# IndoRPG

Web-based RPG — Laravel 13 + PostgreSQL + PHP 8.5 + Inertia + React (Bootstrap 5 via CDN).

Tahap sekarang: development/tester, **belum ada auth/login**. Halaman awal cuma data browser class/subclass/skill.

## Setup di server (aaPanel)

```bash
git clone https://github.com/grahardi/indorpg.git
cd indorpg

composer install
cp .env.example .env
php artisan key:generate

# edit .env sesuaikan DB_DATABASE / DB_USERNAME / DB_PASSWORD utk postgres

php artisan migrate --seed

npm install
npm run build   # atau `npm run dev` untuk development
```

Lalu arahkan document root ke folder `public/`.

## Struktur data game

Lihat `GAME_DESIGN.md` (dokumen desain balance & skill tree) di repo terpisah / chat untuk referensi lengkap angka stat, siklus elemen, dan konsep skill tree tier 2-3 yang belum diimplementasi.

## Yang sudah ada

- Migration: `classes`, `elements`, `element_matchups`, `subclasses`, `characters`, `skills`, `character_skills`
- Seeder: 4 class, 14 subclass (dengan nama baru), siklus elemen Fire→Wind→Earth→Water→Fire, skill tier 1 untuk tiap subclass
- Halaman Inertia+React: `/` (daftar class & subclass), `/subclass/{id}` (detail + skill)
- Avatar karakter: kolom `avatar_path` sudah disiapkan, upload manual dulu (belum ada upload handler)

## Belum ada (next steps)

- Auth/login (sengaja belum, sesuai tahap development)
- Skill tree tier 2 & 3 (cabang pilihan)
- Battle system / simulasi damage
- Character creation form
- Upload avatar handler
