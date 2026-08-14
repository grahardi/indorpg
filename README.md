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
php artisan storage:link

npm install
npm run build   # atau `npm run dev` untuk development
```

Lalu arahkan document root ke folder `public/`.

`php artisan storage:link` **wajib** dijalankan sekali — tanpa ini avatar/full body yang diupload gak akan bisa diakses browser (Laravel simpan file upload di `storage/app/public`, symlink ini yang expose ke `public/storage`).

Upload avatar & full body pakai **Intervention Image** buat auto crop+resize ke ukuran spec (256×256 / 512×1024) — butuh extension **GD** aktif di PHP 8.5 (cek di aaPanel → PHP 8.5 → Install extension kalau belum ada).

## Struktur data game

Lihat `GAME_DESIGN.md` (dokumen desain balance & skill tree) di repo terpisah / chat untuk referensi lengkap angka stat, siklus elemen, dan konsep skill tree tier 2-3 yang belum diimplementasi.

## Yang sudah ada

- Migration: `classes`, `elements`, `element_matchups`, `subclasses`, `characters`, `skills`, `character_skills`
- Seeder: 4 class, 14 subclass (dengan nama baru), siklus elemen Fire→Wind→Earth→Water→Fire, 8 skill/subclass (112 skill total) lengkap dengan ikon SVG
- Halaman Inertia+React: `/` (codex class & subclass), `/subclass/{id}` (detail + skill), `/characters` (roster), `/characters/create` (buat karakter), `/characters/{id}` (detail + upload avatar & full body)
- **Upload avatar & full body sudah fungsional dengan auto crop+resize**: drag-drop atau klik untuk pilih file, otomatis di-crop+resize server-side ke ukuran spec persis (avatar 256×256, full body 512×1024 dengan anchor bawah biar telapak kaki gak kepotong), tersimpan ke `storage/app/public/characters/{avatars,fullbody}` sebagai PNG

## Belum ada (next steps)

- Auth/login (sengaja belum, sesuai tahap development)
- Skill tree tier 2 & 3 (cabang pilihan) — baru tier 1 (skill dasar) & tier 3 (ultimate)
- Battle system / simulasi damage
- Assign skill ke karakter (character_skills belum ada UI-nya, baru relasi DB)
- Avatar @2x (512×512) belum digenerate otomatis — spec dari Claude Design menyebutkannya tapi belum diimplementasikan
