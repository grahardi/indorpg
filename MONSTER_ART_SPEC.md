# IndoRPG — Monster Art Spec & Prompt Generator

Dokumen referensi buat generate art 12 monster di Bestiary. Format sama kayak yang dipakai buat subclass (Berserker, Paladin, dkk) biar konsisten satu game.

---

## ⚠️ CATATAN PENTING SOAL TRANSPARENCY

Dari pengalaman art subclass sebelumnya: **banyak AI image generator (termasuk Gemini) gak beneran export PNG transparan** — mereka cuma "menggambar" pola checkerboard abu-abu/putih di background sebagai simulasi visual, padahal file PNG-nya fully opaque. Kalau hasil generate lo keliatan checkerboard, itu **bukan jaminan transparent asli**.

Cara aman:
1. Generate dengan prompt **"plain solid gray background"** aja (jangan minta transparent ke AI generator), karena checkerboard palsu itu lebih ribet dibersihkan daripada background solid.
2. Upload hasilnya ke saya, saya proses pakai AI background removal (`rembg`) biar transparent-nya asli.
3. Atau kalau lo punya tool sendiri yang bisa export PNG transparan asli (Photoshop, remove.bg, dll), langsung upload aja lewat halaman monster — sistem upload udah otomatis crop+resize.

---

## Spesifikasi Ukuran

Sama kayak subclass:
- **Avatar**: 256×256, crop dari kepala/wajah ke atas (buat bestiary card & badge)
- **Full Body**: 512×1024, anchor bawah (telapak kaki/dasar tubuh gak boleh kepotong)

## Style Guide (konsisten dengan subclass yang udah ada)

Digital painting semi-realistic fantasy, sapuan kuas kelihatan (painterly, bukan flat vector/anime), pencahayaan dramatis, palet warna natural/earthy dengan aksen elemen. Background saat generate: **plain solid gray** (bukan checkerboard, bukan scene).

---

## 1. Slime Api — Lv.1 — Fire — Slime

**Visual**: Gumpalan lendir semi-transparan berwarna oranye-merah membara, retakan di permukaan tubuhnya seperti lava yang mendingin memancarkan cahaya dari dalam, ada sedikit asap/api kecil mengepul di bagian atas. Bentuk tetesan/blob, gak ada wajah jelas — cukup 2 titik mata sipit membara.

**Prompt (avatar & full body)**:
> A small gelatinous fire slime monster, translucent molten orange-red body with glowing cracks like cooling lava, faint wisps of flame rising from the top, simple glowing eye dots, painterly fantasy digital art, dramatic lighting, plain solid gray background, no watermark

---

## 2. Slime Air — Lv.1 — Water — Slime

**Visual**: Sama seperti Slime Api tapi berbahan air — tubuh bening kebiruan-teal, permukaan berkilau basah, ada gelembung kecil dan tetesan air melayang di sekitarnya.

**Prompt**:
> A small gelatinous water slime monster, translucent glossy blue-teal body like living water, small bubbles and droplets floating around it, wet glossy surface reflecting light, simple glowing eye dots, painterly fantasy digital art, plain solid gray background, no watermark

---

## 3. Tikus Raksasa — Lv.1 — Beast, netral

**Visual**: Tikus raksasa (seukuran anjing kecil), bulu abu-abu kecoklatan kusut, mata merah kecil, gigi seri kuning tajam mencuat, telinga robek/cacat bekas pertarungan, ekor panjang berkerak.

**Prompt**:
> A giant rat monster the size of a small dog, scruffy brown-gray fur, small beady red eyes, sharp protruding yellowed incisor teeth, one torn ear, long scaly tail, menacing but slightly comedic RPG low-level enemy design, painterly fantasy digital art, plain solid gray background, no watermark

---

## 4. Kelelawar Gua — Lv.2 — Wind — Beast

**Visual**: Kelelawar gelap dengan sayap kulit lebar terbentang, taring tajam, mata bercahaya samar ungu-biru (efek ekolokasi), tubuh kecil ramping buat terbang lincah.

**Prompt**:
> A dark cave bat monster with wide leathery wings spread open mid-flight, sharp fangs bared, faint glowing purple-blue eyes suggesting echolocation, sleek small body, dynamic flying pose, painterly fantasy digital art, plain solid gray background, no watermark

---

## 5. Bandit Pemula — Lv.2 — Humanoid, netral

**Visual**: Manusia perampok jalanan, pakai jubah/hoodie compang-camping menutupi wajah bagian bawah, baju kulit lusuh, bawa pedang pendek dan perisai kecil bundar, penampilan kere/amatir (bukan elite).

**Prompt**:
> A novice bandit human enemy, ragged hooded cloak covering lower face, worn leather armor, wielding a short sword and small round wooden shield, scruffy improvised low-tier gear, standing threateningly, painterly fantasy digital art, plain solid gray background, no watermark

---

## 6. Laba-laba Beracun — Lv.3 — Earth — Insect

**Visual**: Laba-laba besar (seukuran anjing), cangkang belang coklat-hijau tanah, taring menetes racun hijau menyala, ada pola garis-garis bercahaya sickly-green di perutnya, banyak mata berkilau.

**Prompt**:
> A large venomous spider monster the size of a dog, mottled earthy brown-green carapace, fangs dripping glowing green venom, sickly green glowing markings on its abdomen, multiple glinting eyes, menacing crouched pose, painterly fantasy digital art, plain solid gray background, no watermark

---

## 7. Serigala Hutan — Lv.3 — Earth — Beast

**Visual**: Serigala liar ramping, bulu abu-coklat kotor bercampur lumpur, gigi taring terlihat karena menggeram, postur waspada siap menerkam, mata kuning tajam.

**Prompt**:
> A lean wild forest wolf monster, mud-caked grey-brown fur, bared fangs mid-snarl, sharp yellow eyes, alert predatory stance ready to pounce, forest undergrowth atmosphere, painterly fantasy digital art, plain solid gray background, no watermark

---

## 8. Zombie Reyot — Lv.3 — Undead, netral

**Visual**: Mayat hidup, kulit abu-kehijauan membusuk, kain kafan compang-camping, rahang menganga, postur bungkuk asimetris kayak jalan tertatih, mata kosong pucat.

**Prompt**:
> A shambling zombie undead monster, decayed greenish-gray skin, tattered burial cloth, slack open jaw, asymmetric hunched shambling posture, pale hollow eyes, undead pallor, painterly fantasy digital art, plain solid gray background, no watermark

---

## 9. Peri Air — Lv.4 — Water — Spirit

**Visual**: Sosok humanoid kecil etherial terbuat dari air/kabut mengalir, translucent biru-putih pucat bercahaya lembut, wajah androgini halus, jejak kabut air mengekor di belakangnya, gak berpijak di tanah (melayang).

**Prompt**:
> An ethereal water sprite spirit, small humanoid figure made of flowing translucent water and mist, soft glowing pale blue-white, gentle androgynous facial features, trailing water wisps, floating gracefully above ground, painterly fantasy digital art, plain solid gray background, no watermark

---

## 10. Elemental Api Kecil — Lv.5 — Fire — Elemental

**Visual**: Massa api hidup berbentuk humanoid kasar, inti putih membara di dalam tubuh oranye-merah menyala, percikan bara api berjatuhan, gak ada wajah jelas — cuma rongga bercahaya menyerupai mata.

**Prompt**:
> A lesser fire elemental monster, roughly humanoid mass of living flame, glowing white-hot core visible within an orange-red fire body, embers drifting off its form, glowing void-like eyes with no fixed facial features, radiating heat, painterly fantasy digital art, plain solid gray background, no watermark

---

## 11. Golem Batu Kecil — Lv.5 — Earth — Construct

**Visual**: Konstruksi humanoid pendek-kekar dari blok granit kasar, lumut tumbuh di celah-celah retakan batu, ada rune bercahaya teal redup terukir di dada, postur berat/kokoh.

**Prompt**:
> A small stone golem construct, squat and heavily built humanoid made of rough granite blocks, moss growing in the cracks, a faintly glowing teal rune carved on its chest, heavy sturdy stance, painterly fantasy digital art, plain solid gray background, no watermark

---

## 12. Harpy Muda — Lv.6 — Wind — Beast

**Visual**: Makhluk setengah manusia setengah burung, sayap berbulu coklat-tan keemasan, cakar tajam di kaki, rambut liar berkibar tertiup angin, ekspresi predator galak, pose dinamis seperti baru mendarat/terbang.

**Prompt**:
> A young harpy monster, half-woman half-bird creature, feathered wings in earthy brown-tan and gold plumage, sharp talons on bird-like legs, wild windswept hair, fierce predatory expression, dynamic mid-flight or landing pose, painterly fantasy digital art, plain solid gray background, no watermark

---

## Cara Pakai

1. Copy prompt salah satu monster di atas ke image generator favorit lo (Gemini, Midjourney, dll).
2. Generate 2 versi: satu buat **avatar** (framing close-up/bust), satu lagi **full body** (framing seluruh badan, pose lebih dinamis).
3. Kalau hasilnya background checkerboard/abu-abu (bukan transparent asli), upload ke saya — saya proses jadi transparent PNG.
4. Atau langsung upload lewat halaman `/monsters/{id}` di web — sistem bakal auto crop+resize ke 256×256 / 512×1024.
