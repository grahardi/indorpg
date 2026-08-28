<?php

namespace Database\Seeders;

use App\Models\Subclass;
use Illuminate\Database\Seeder;

class SkillSeeder extends Seeder
{
    /**
     * Contoh skill tier 1 (dasar, langsung terbuka) untuk tiap subclass.
     * Tier 2 & 3 menyusul setelah battle-testing angka dasar ini.
     */
    public function run(): void
    {
        $skills = [
            'Berserker' => [
                ['name' => 'Cakar Liar', 'stat' => 'physical', 'stamina' => 18, 'mana' => 0, 'cd' => 3, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Cakaran ganas beruntun dengan senjata utama.', 'icon' => 'berserker-cakar-liar.svg'],
                ['name' => 'Hantaman Membabi Buta', 'stat' => 'physical', 'stamina' => 22, 'mana' => 0, 'cd' => 5, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Tusukan brutal ke satu titik lemah musuh.', 'icon' => 'berserker-hantaman-membabi-buta.svg'],
                ['name' => 'Amuk Berdarah', 'stat' => 'physical', 'stamina' => 25, 'mana' => 0, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menaikkan damage fisik sendiri, mengorbankan sedikit defense.', 'icon' => 'berserker-amuk-berdarah.svg'],
                ['name' => 'Tebasan Ganda', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Dua tebasan cepat beruntun.', 'icon' => 'berserker-tebasan-ganda.svg'],
                ['name' => 'Serangan Membakar', 'stat' => 'physical', 'stamina' => 15, 'mana' => 10, 'cd' => 6, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Serangan fisik dilapisi sedikit energi liar.', 'icon' => 'berserker-serangan-membakar.svg'],
                ['name' => 'Aura Amarah', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 10, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Melepaskan aura yang menaikkan damage tim sesaat.', 'icon' => 'berserker-aura-amarah.svg'],
                ['name' => 'Amukan Iblis', 'stat' => 'physical', 'stamina' => 65, 'mana' => 0, 'cd' => 15, 'mult' => 2.7, 'tier' => 3,
                    'desc' => 'Ultimate: rentetan pukulan liar tanpa henti, damage fisik masif.', 'icon' => 'berserker-amukan-iblis.svg'],
                ['name' => 'Murka Tanpa Ampun', 'stat' => 'magic', 'stamina' => 30, 'mana' => 40, 'cd' => 15, 'mult' => 2.4, 'tier' => 3,
                    'desc' => 'Ultimate: ledakan amarah berubah jadi energi destruktif.', 'icon' => 'berserker-murka-tanpa-ampun.svg'],
            ],
            'Blade Knight' => [
                ['name' => 'Tebasan Baja', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 3, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Serangan pedang dasar yang cepat dan stabil.', 'icon' => 'blade-knight-tebasan-baja.svg'],
                ['name' => 'Serangan Berantai', 'stat' => 'physical', 'stamina' => 25, 'mana' => 0, 'cd' => 6, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Dua tebasan beruntun, hit kedua sedikit lebih kuat.', 'icon' => 'blade-knight-serangan-berantai.svg'],
                ['name' => 'Hantam Perisai', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 7, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Menghantam musuh dengan perisai, mengurangi physical defense musuh sementara.', 'icon' => 'blade-knight-hantam-perisai.svg'],
                ['name' => 'Tebasan Berputar', 'stat' => 'physical', 'stamina' => 30, 'mana' => 0, 'cd' => 9, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Berputar menebas seluruh musuh di sekitar.', 'icon' => 'blade-knight-tebasan-berputar.svg'],
                ['name' => 'Pedang Elemental', 'stat' => 'magic', 'stamina' => 10, 'mana' => 20, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melapisi bilah pedang dengan energi sihir untuk satu serangan.', 'icon' => 'blade-knight-pedang-elemental.svg'],
                ['name' => 'Gelombang Kejut', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 7, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melepaskan gelombang energi dari hantaman ke tanah.', 'icon' => 'blade-knight-gelombang-kejut.svg'],
                ['name' => 'Badai Bilah', 'stat' => 'physical', 'stamina' => 60, 'mana' => 0, 'cd' => 15, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: rangkaian tebasan bertubi-tubi ke segala arah dengan damage fisik masif.', 'icon' => 'blade-knight-badai-bilah.svg'],
                ['name' => 'Murka Ksatria', 'stat' => 'magic', 'stamina' => 0, 'mana' => 60, 'cd' => 15, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: ledakan sihir dari lambang ksatria, damage magic masif ke satu target.', 'icon' => 'blade-knight-murka-ksatria.svg'],
            ],
            'Spellblade' => [
                ['name' => 'Tebasan Arkana', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Tebasan pedang yang dilapisi energi arkana ringan.', 'icon' => 'spellblade-tebasan-arkana.svg'],
                ['name' => 'Tusukan Berlapis Sihir', 'stat' => 'physical', 'stamina' => 18, 'mana' => 8, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Tusukan presisi dengan sedikit dorongan sihir.', 'icon' => 'spellblade-tusukan-berlapis-sihir.svg'],
                ['name' => 'Tebasan Ganda Mistis', 'stat' => 'physical', 'stamina' => 20, 'mana' => 5, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Dua tebasan beruntun dengan jejak energi.', 'icon' => 'spellblade-tebasan-ganda-mistis.svg'],
                ['name' => 'Ledakan Rune', 'stat' => 'magic', 'stamina' => 5, 'mana' => 25, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melepaskan rune yang meledak di titik serangan.', 'icon' => 'spellblade-ledakan-rune.svg'],
                ['name' => 'Perisai Arkana', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Membentuk perisai energi yang menyerap sedikit damage.', 'icon' => 'spellblade-perisai-arkana.svg'],
                ['name' => 'Longkang Energi', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 7, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Melepaskan energi tersimpan dalam ledakan area kecil.', 'icon' => 'spellblade-longkang-energi.svg'],
                ['name' => 'Bilah Dimensi', 'stat' => 'physical', 'stamina' => 40, 'mana' => 20, 'cd' => 15, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: bilah pedang merobek ruang, damage fisik besar ke satu target.', 'icon' => 'spellblade-bilah-dimensi.svg'],
                ['name' => 'Singularitas Arkana', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.7, 'tier' => 3,
                    'desc' => 'Ultimate: memanggil titik energi yang meledak dahsyat.', 'icon' => 'spellblade-singularitas-arkana.svg'],
            ],
            'Paladin' => [
                ['name' => 'Tebasan Suci', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Tebasan pedang yang diberkati cahaya.', 'icon' => 'paladin-tebasan-suci.svg'],
                ['name' => 'Hantaman Berkat', 'stat' => 'physical', 'stamina' => 18, 'mana' => 5, 'cd' => 6, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Hantaman perisai yang memberi sedikit efek suci.', 'icon' => 'paladin-hantaman-berkat.svg'],
                ['name' => 'Sinar Penghukum', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 5, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Memanggil sinar cahaya menghunjam musuh.', 'icon' => 'paladin-sinar-penghukum.svg'],
                ['name' => 'Cahaya Penyembuh', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 8, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Memulihkan sedikit HP diri sendiri atau rekan terdekat.', 'icon' => 'paladin-cahaya-penyembuh.svg'],
                ['name' => 'Perisai Cahaya', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 10, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Membentuk perisai suci yang menahan damage masuk.', 'icon' => 'paladin-perisai-cahaya.svg'],
                ['name' => 'Seruan Keadilan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 28, 'cd' => 7, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Ledakan energi suci di sekitar paladin.', 'icon' => 'paladin-seruan-keadilan.svg'],
                ['name' => 'Sumpah Ksatria', 'stat' => 'physical', 'stamina' => 45, 'mana' => 15, 'cd' => 15, 'mult' => 2.5, 'tier' => 3,
                    'desc' => 'Ultimate: menghantam musuh dengan seluruh kekuatan fisik dan berkat.', 'icon' => 'paladin-sumpah-ksatria.svg'],
                ['name' => 'Hukuman Surga', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.8, 'tier' => 3,
                    'desc' => 'Ultimate: cahaya surga turun menghantam area luas.', 'icon' => 'paladin-hukuman-surga.svg'],
            ],
            'Bulwark' => [
                ['name' => 'Hantam Perisai Besar', 'stat' => 'physical', 'stamina' => 18, 'mana' => 0, 'cd' => 4, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Hantaman perisai berat yang menarik aggro.', 'icon' => 'bulwark-hantam-perisai-besar.svg'],
                ['name' => 'Serangan Balik', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 6, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Membalas serangan musuh berikutnya dengan tebasan.', 'icon' => 'bulwark-serangan-balik.svg'],
                ['name' => 'Injak Bumi', 'stat' => 'physical', 'stamina' => 25, 'mana' => 0, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menghentak tanah, mengganggu musuh di sekitar.', 'icon' => 'bulwark-injak-bumi.svg'],
                ['name' => 'Tembok Baja', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 10, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menaikkan physical defense untuk sementara.', 'icon' => 'bulwark-tembok-baja.svg'],
                ['name' => 'Gelora Pelindung', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 12, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Aura yang menaikkan defense seluruh tim sesaat.', 'icon' => 'bulwark-gelora-pelindung.svg'],
                ['name' => 'Pancaran Tameng', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Melepaskan gelombang energi pelindung ke sekitar.', 'icon' => 'bulwark-pancaran-tameng.svg'],
                ['name' => 'Benteng Tak Tergoyahkan', 'stat' => 'physical', 'stamina' => 60, 'mana' => 0, 'cd' => 15, 'mult' => 2.2, 'tier' => 3,
                    'desc' => 'Ultimate: menjadi tembok hidup, defense fisik meningkat drastis sambil menghantam balik.', 'icon' => 'bulwark-benteng-tak-tergoyahkan.svg'],
                ['name' => 'Murka Penjaga', 'stat' => 'magic', 'stamina' => 0, 'mana' => 55, 'cd' => 15, 'mult' => 2.3, 'tier' => 3,
                    'desc' => 'Ultimate: melepas seluruh energi pelindung sebagai ledakan besar.', 'icon' => 'bulwark-murka-penjaga.svg'],
            ],
            'Warden' => [
                ['name' => 'Hantaman Runa', 'stat' => 'physical', 'stamina' => 18, 'mana' => 5, 'cd' => 5, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Hantaman perisai berlapis runa pelindung.', 'icon' => 'warden-hantaman-runa.svg'],
                ['name' => 'Tebasan Penjaga', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 4, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Tebasan dasar penjaga sihir.', 'icon' => 'warden-tebasan-penjaga.svg'],
                ['name' => 'Perisai Mana', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 10, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menaikkan magic defense untuk sementara.', 'icon' => 'warden-perisai-mana.svg'],
                ['name' => 'Pantulan Sihir', 'stat' => 'magic', 'stamina' => 0, 'mana' => 25, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Membentuk perisai yang memantulkan sebagian serangan sihir.', 'icon' => 'warden-pantulan-sihir.svg'],
                ['name' => 'Ledakan Runa', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 7, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Melepaskan ledakan energi dari runa pelindung.', 'icon' => 'warden-ledakan-runa.svg'],
                ['name' => 'Gelombang Pelindung', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 12, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Aura sihir yang menaikkan magic defense tim.', 'icon' => 'warden-gelombang-pelindung.svg'],
                ['name' => 'Benteng Mana', 'stat' => 'physical', 'stamina' => 40, 'mana' => 25, 'cd' => 15, 'mult' => 2.2, 'tier' => 3,
                    'desc' => 'Ultimate: menyerap energi sihir musuh menjadi pertahanan masif.', 'icon' => 'warden-benteng-mana.svg'],
                ['name' => 'Runtuhan Runa', 'stat' => 'magic', 'stamina' => 0, 'mana' => 60, 'cd' => 15, 'mult' => 2.4, 'tier' => 3,
                    'desc' => 'Ultimate: seluruh runa pelindung meledak sekaligus.', 'icon' => 'warden-runtuhan-runa.svg'],
            ],
            'Sentinel' => [
                ['name' => 'Pukulan Seimbang', 'stat' => 'physical', 'stamina' => 15, 'mana' => 0, 'cd' => 4, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Pukulan dasar dengan tenaga merata.', 'icon' => 'sentinel-pukulan-seimbang.svg'],
                ['name' => 'Tebasan Penjaga', 'stat' => 'physical', 'stamina' => 18, 'mana' => 0, 'cd' => 5, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Dua tebasan cepat yang stabil.', 'icon' => 'sentinel-tebasan-penjaga.svg'],
                ['name' => 'Hantaman Berimbang', 'stat' => 'physical', 'stamina' => 20, 'mana' => 0, 'cd' => 6, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Hantaman perisai yang seimbang antara serang dan bertahan.', 'icon' => 'sentinel-hantaman-berimbang.svg'],
                ['name' => 'Aura Seimbang', 'stat' => 'magic', 'stamina' => 10, 'mana' => 15, 'cd' => 10, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Aura yang menaikkan defense fisik dan magic sedikit.', 'icon' => 'sentinel-aura-seimbang.svg'],
                ['name' => 'Pantulan Seimbang', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 8, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Gelombang energi yang menahan serangan dari segala arah.', 'icon' => 'sentinel-pantulan-seimbang.svg'],
                ['name' => 'Langkah Waspada', 'stat' => 'physical', 'stamina' => 18, 'mana' => 0, 'cd' => 7, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Pergerakan taktis yang membuka celah serangan balik.', 'icon' => 'sentinel-langkah-waspada.svg'],
                ['name' => 'Keseimbangan Sempurna', 'stat' => 'physical', 'stamina' => 35, 'mana' => 25, 'cd' => 15, 'mult' => 2.3, 'tier' => 3,
                    'desc' => 'Ultimate: menyatukan kekuatan fisik dan sihir dalam satu hantaman.', 'icon' => 'sentinel-keseimbangan-sempurna.svg'],
                ['name' => 'Harmoni Elemen', 'stat' => 'magic', 'stamina' => 20, 'mana' => 45, 'cd' => 15, 'mult' => 2.3, 'tier' => 3,
                    'desc' => 'Ultimate: melepaskan seluruh energi tersimpan secara merata ke musuh.', 'icon' => 'sentinel-harmoni-elemen.svg'],
            ],
            'Pyromancer' => [
                ['name' => 'Pukulan Membara', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.9, 'tier' => 1,
                    'desc' => 'Pukulan dasar dengan sedikit percikan api.', 'icon' => 'pyromancer-pukulan-membara.svg'],
                ['name' => 'Bola Api', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Bola api dilempar ke satu musuh.', 'icon' => 'pyromancer-bola-api.svg'],
                ['name' => 'Cakar Bara', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Serangan beruntun dengan energi panas.', 'icon' => 'pyromancer-cakar-bara.svg'],
                ['name' => 'Ledakan Dekat', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Ledakan api kecil di sekitar caster.', 'icon' => 'pyromancer-ledakan-dekat.svg'],
                ['name' => 'Hujan Bara', 'stat' => 'magic', 'stamina' => 0, 'mana' => 28, 'cd' => 8, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Memanggil hujan bara api ke area musuh.', 'icon' => 'pyromancer-hujan-bara.svg'],
                ['name' => 'Aura Panas', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Aura panas yang melemahkan defense musuh terdekat.', 'icon' => 'pyromancer-aura-panas.svg'],
                ['name' => 'Nova Api', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.8, 'tier' => 3,
                    'desc' => 'Ultimate: ledakan api dahsyat ke seluruh area sekitar.', 'icon' => 'pyromancer-nova-api.svg'],
                ['name' => 'Titik Didih', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: memusatkan seluruh energi api ke satu titik, damage magic ekstrem.', 'icon' => 'pyromancer-titik-didih.svg'],
            ],
            'Hydromancer' => [
                ['name' => 'Hantaman Basah', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.9, 'tier' => 1,
                    'desc' => 'Pukulan dasar dengan sedikit tekanan air.', 'icon' => 'hydromancer-hantaman-basah.svg'],
                ['name' => 'Semburan Air', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Semburan air bertekanan tinggi ke satu musuh.', 'icon' => 'hydromancer-semburan-air.svg'],
                ['name' => 'Cambuk Ombak', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Serangan beruntun berbentuk cambukan air.', 'icon' => 'hydromancer-cambuk-ombak.svg'],
                ['name' => 'Riak Kejut', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Gelombang kejut air di sekitar caster.', 'icon' => 'hydromancer-riak-kejut.svg'],
                ['name' => 'Gelombang Pasang', 'stat' => 'magic', 'stamina' => 0, 'mana' => 28, 'cd' => 8, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Memanggil gelombang air besar ke arah musuh.', 'icon' => 'hydromancer-gelombang-pasang.svg'],
                ['name' => 'Aliran Pendingin', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Memperlambat serangan musuh terdekat.', 'icon' => 'hydromancer-aliran-pendingin.svg'],
                ['name' => 'Badai Tsunami', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.8, 'tier' => 3,
                    'desc' => 'Ultimate: gelombang tsunami raksasa menyapu area luas.', 'icon' => 'hydromancer-badai-tsunami.svg'],
                ['name' => 'Tekanan Laut Dalam', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: memusatkan tekanan air ekstrem ke satu target.', 'icon' => 'hydromancer-tekanan-laut-dalam.svg'],
            ],
            'Geomancer' => [
                ['name' => 'Hantaman Batu', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.9, 'tier' => 1,
                    'desc' => 'Pukulan dasar dengan sedikit kekuatan tanah.', 'icon' => 'geomancer-hantaman-batu.svg'],
                ['name' => 'Duri Batu', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Duri batu muncul menusuk dari bawah musuh.', 'icon' => 'geomancer-duri-batu.svg'],
                ['name' => 'Hantaman Ganda Tanah', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Dua hantaman beruntun dengan energi tanah.', 'icon' => 'geomancer-hantaman-ganda-tanah.svg'],
                ['name' => 'Getaran Lokal', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Getaran kecil yang mengganggu musuh di sekitar.', 'icon' => 'geomancer-getaran-lokal.svg'],
                ['name' => 'Longsor Kecil', 'stat' => 'magic', 'stamina' => 0, 'mana' => 28, 'cd' => 8, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Memanggil bebatuan jatuh ke arah musuh.', 'icon' => 'geomancer-longsor-kecil.svg'],
                ['name' => 'Kulit Batu', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Memperkuat kulit menjadi seperti batu sesaat.', 'icon' => 'geomancer-kulit-batu.svg'],
                ['name' => 'Gempa Bumi', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.8, 'tier' => 3,
                    'desc' => 'Ultimate: guncangan besar meluluhlantakkan area sekitar.', 'icon' => 'geomancer-gempa-bumi.svg'],
                ['name' => 'Runtuhan Gunung', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: memanggil bongkahan gunung menghantam satu titik.', 'icon' => 'geomancer-runtuhan-gunung.svg'],
            ],
            'Aeromancer' => [
                ['name' => 'Pukulan Angin', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.9, 'tier' => 1,
                    'desc' => 'Pukulan dasar dengan dorongan angin.', 'icon' => 'aeromancer-pukulan-angin.svg'],
                ['name' => 'Tebasan Angin', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.4, 'tier' => 1,
                    'desc' => 'Bilah angin tajam melesat ke musuh.', 'icon' => 'aeromancer-tebasan-angin.svg'],
                ['name' => 'Sabetan Ganda', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 5, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Dua sabetan angin beruntun.', 'icon' => 'aeromancer-sabetan-ganda.svg'],
                ['name' => 'Pusaran Kecil', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 6, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Pusaran angin kecil di sekitar caster.', 'icon' => 'aeromancer-pusaran-kecil.svg'],
                ['name' => 'Terjangan Badai', 'stat' => 'magic', 'stamina' => 0, 'mana' => 28, 'cd' => 8, 'mult' => 1.5, 'tier' => 1,
                    'desc' => 'Terjangan angin kencang ke arah musuh.', 'icon' => 'aeromancer-terjangan-badai.svg'],
                ['name' => 'Langkah Angin', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Meningkatkan kecepatan serangan sesaat.', 'icon' => 'aeromancer-langkah-angin.svg'],
                ['name' => 'Topan Dahsyat', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.8, 'tier' => 3,
                    'desc' => 'Ultimate: topan raksasa menyapu seluruh area musuh.', 'icon' => 'aeromancer-topan-dahsyat.svg'],
                ['name' => 'Vakum Udara', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: memusatkan tekanan udara ekstrem ke satu target.', 'icon' => 'aeromancer-vakum-udara.svg'],
            ],
            'Cleric' => [
                ['name' => 'Pukulan Ringan', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.8, 'tier' => 1,
                    'desc' => 'Pukulan dasar seadanya, bukan fokus utama.', 'icon' => 'cleric-pukulan-ringan.svg'],
                ['name' => 'Cahaya Penyembuh', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 4, 'mult' => 1.3, 'tier' => 1,
                    'desc' => 'Memulihkan HP satu target.', 'icon' => 'cleric-cahaya-penyembuh.svg'],
                ['name' => 'Berkat Ganda', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 6, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Penyembuhan beruntun dua tahap ke satu target.', 'icon' => 'cleric-berkat-ganda.svg'],
                ['name' => 'Lingkaran Suci', 'stat' => 'magic', 'stamina' => 0, 'mana' => 30, 'cd' => 10, 'mult' => 1.1, 'tier' => 1,
                    'desc' => 'Memulihkan HP seluruh party sedikit.', 'icon' => 'cleric-lingkaran-suci.svg'],
                ['name' => 'Sentuhan Pemurnian', 'stat' => 'magic', 'stamina' => 0, 'mana' => 18, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menghapus efek negatif ringan dari satu target.', 'icon' => 'cleric-sentuhan-pemurnian.svg'],
                ['name' => 'Restorasi Bertahap', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Memberi efek pemulihan HP bertahap ke satu target.', 'icon' => 'cleric-restorasi-bertahap.svg'],
                ['name' => 'Sanctuary', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: memulihkan HP seluruh party dalam jumlah besar.', 'icon' => 'cleric-sanctuary.svg'],
                ['name' => 'Kebangkitan Cahaya', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: pulihkan HP masif ke satu target sekarat.', 'icon' => 'cleric-kebangkitan-cahaya.svg'],
            ],
            'Warlock' => [
                ['name' => 'Pukulan Gelap', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.8, 'tier' => 1,
                    'desc' => 'Pukulan dasar seadanya, bukan fokus utama.', 'icon' => 'warlock-pukulan-gelap.svg'],
                ['name' => 'Tanda Kutukan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 5, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Menandai musuh dengan damage over time.', 'icon' => 'warlock-tanda-kutukan.svg'],
                ['name' => 'Sentuhan Layu', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 6, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Melemahkan damage musuh untuk sementara.', 'icon' => 'warlock-sentuhan-layu.svg'],
                ['name' => 'Rantai Kutukan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 26, 'cd' => 7, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Kutukan menyebar ke musuh terdekat.', 'icon' => 'warlock-rantai-kutukan.svg'],
                ['name' => 'Bisikan Teror', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Mengurangi akurasi serangan musuh.', 'icon' => 'warlock-bisikan-teror.svg'],
                ['name' => 'Serapan Jiwa', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 7, 'mult' => 1.2, 'tier' => 1,
                    'desc' => 'Menyerap sedikit HP musuh saat kutukan aktif.', 'icon' => 'warlock-serapan-jiwa.svg'],
                ['name' => 'Wabah Kutukan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.7, 'tier' => 3,
                    'desc' => 'Ultimate: menyebarkan kutukan berat ke seluruh musuh di area.', 'icon' => 'warlock-wabah-kutukan.svg'],
                ['name' => 'Genggaman Maut', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.9, 'tier' => 3,
                    'desc' => 'Ultimate: kutukan puncak yang mengikis HP target secara drastis.', 'icon' => 'warlock-genggaman-maut.svg'],
            ],
            'Enchanter' => [
                ['name' => 'Pukulan Ringan', 'stat' => 'physical', 'stamina' => 15, 'mana' => 5, 'cd' => 4, 'mult' => 0.8, 'tier' => 1,
                    'desc' => 'Pukulan dasar seadanya, bukan fokus utama.', 'icon' => 'enchanter-pukulan-ringan.svg'],
                ['name' => 'Nyanyian Kekuatan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 6, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menaikkan damage skill satu rekan tim.', 'icon' => 'enchanter-nyanyian-kekuatan.svg'],
                ['name' => 'Nyanyian Kecepatan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 20, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Mengurangi cooldown skill rekan tim.', 'icon' => 'enchanter-nyanyian-kecepatan.svg'],
                ['name' => 'Melodi Pelindung', 'stat' => 'magic', 'stamina' => 0, 'mana' => 22, 'cd' => 8, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Menaikkan defense satu rekan tim sesaat.', 'icon' => 'enchanter-melodi-pelindung.svg'],
                ['name' => 'Gema Harmoni', 'stat' => 'magic', 'stamina' => 0, 'mana' => 26, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Efek buff menyebar ke rekan terdekat.', 'icon' => 'enchanter-gema-harmoni.svg'],
                ['name' => 'Not Penyemangat', 'stat' => 'magic', 'stamina' => 0, 'mana' => 24, 'cd' => 9, 'mult' => 1.0, 'tier' => 1,
                    'desc' => 'Memulihkan sedikit stamina/mana rekan tim.', 'icon' => 'enchanter-not-penyemangat.svg'],
                ['name' => 'Simfoni Kemenangan', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.4, 'tier' => 3,
                    'desc' => 'Ultimate: seluruh tim mendapat buff damage dan kecepatan besar.', 'icon' => 'enchanter-simfoni-kemenangan.svg'],
                ['name' => 'Requiem Terakhir', 'stat' => 'magic', 'stamina' => 0, 'mana' => 65, 'cd' => 15, 'mult' => 2.6, 'tier' => 3,
                    'desc' => 'Ultimate: ledakan energi buff yang juga memberi damage magic ke musuh.', 'icon' => 'enchanter-requiem-terakhir.svg'],
            ],
        ];

        foreach ($skills as $subclassName => $list) {
            $subclass = Subclass::where('name', $subclassName)->first();
            if (! $subclass) {
                continue;
            }

            foreach ($list as $skill) {
                $subclass->skills()->updateOrCreate(
                    ['name' => $skill['name']],
                    [
                        'description' => $skill['desc'],
                        'tier' => $skill['tier'] ?? 1,
                        'branch' => null,
                        'scaling_stat' => $skill['stat'],
                        'stamina_cost' => $skill['stamina'],
                        'mana_cost' => $skill['mana'],
                        'cooldown_seconds' => $skill['cd'],
                        'base_multiplier' => $skill['mult'],
                        'icon_path' => isset($skill['icon']) ? '/images/skills/'.$skill['icon'] : null,
                        'required_level' => 1,
                        'element_id' => $subclass->element_id,
                    ]
                );
            }
        }

        $this->normalizeDualResourceCosts();
    }

    /**
     * Rework balance (bagian 91) - SEMUA skill wajib punya biaya SP DAN MP
     * sekaligus (rasio boleh timpang, tapi gak boleh salah satunya 0 total).
     * Data mentah di atas MASIH ada yang murni 1 resource (stamina=0 atau
     * mana=0) - dinormalisasi di sini biar SEKALI GINI aja sumbernya, gak
     * usah nulis ulang manual satu-satu di array atas. Fresh seed maupun
     * migration data (2026_08_25_100001_dual_resource_skill_costs) sama-
     * sama pakai formula identik, jadi hasilnya konsisten kapan pun dijalanin.
     */
    private function normalizeDualResourceCosts(): void
    {
        $secondaryRatio = 0.15;
        $secondaryMin = 3;

        \App\Models\Skill::where('mana_cost', 0)->where('stamina_cost', '>', 0)->get()->each(function ($skill) use ($secondaryRatio, $secondaryMin) {
            $skill->update(['mana_cost' => max($secondaryMin, (int) round($skill->stamina_cost * $secondaryRatio))]);
        });

        \App\Models\Skill::where('stamina_cost', 0)->where('mana_cost', '>', 0)->get()->each(function ($skill) use ($secondaryRatio, $secondaryMin) {
            $skill->update(['stamina_cost' => max($secondaryMin, (int) round($skill->mana_cost * $secondaryRatio))]);
        });
    }
}
