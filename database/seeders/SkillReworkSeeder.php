<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\Subclass;
use Illuminate\Database\Seeder;

class SkillReworkSeeder extends Seeder
{
    /**
     * Rework total skill: tiap subclass minimal punya 1 skill can_stun=true dan
     * minimal 1 skill tipe serangan biasa (buff_type=none). Subclass Saint
     * (Cleric/Warlock/Enchanter) dikasih porsi heal/nerf/buff lebih banyak
     * sesuai konsep karakternya. combat_range juga dipasang eksplisit di sini
     * (dulu gak keisi eksplisit di SkillSeeder awal).
     *
     * Format tiap entry: [buff_type, buff_stat, heal_resource, can_stun, combat_range]
     */
    public function run(): void
    {
        $data = [
            'Berserker' => [
                'Cakar Liar' => ['none', null, null, false, 'close'],
                'Hantaman Membabi Buta' => ['none', null, null, true, 'close'],
                'Amuk Berdarah' => ['buff', 'attack', null, false, 'close'],
                'Tebasan Ganda' => ['none', null, null, false, 'close'],
                'Serangan Membakar' => ['none', null, null, false, 'close'],
                'Aura Amarah' => ['buff', 'attack', null, false, 'area'],
                'Amukan Iblis' => ['none', null, null, false, 'close'],
                'Murka Tanpa Ampun' => ['none', null, null, false, 'range'],
            ],
            'Blade Knight' => [
                'Tebasan Baja' => ['none', null, null, false, 'close'],
                'Serangan Berantai' => ['none', null, null, false, 'close'],
                'Hantam Perisai' => ['nerf', null, null, true, 'close'],
                'Tebasan Berputar' => ['none', null, null, false, 'area'],
                'Pedang Elemental' => ['none', null, null, false, 'close'],
                'Gelombang Kejut' => ['none', null, null, false, 'area'],
                'Badai Bilah' => ['none', null, null, false, 'area'],
                'Murka Ksatria' => ['none', null, null, false, 'range'],
            ],
            'Spellblade' => [
                'Tebasan Arkana' => ['none', null, null, false, 'close'],
                'Tusukan Berlapis Sihir' => ['none', null, null, true, 'close'],
                'Tebasan Ganda Mistis' => ['none', null, null, false, 'close'],
                'Ledakan Rune' => ['none', null, null, false, 'range'],
                'Perisai Arkana' => ['buff', 'defense', null, false, 'close'],
                'Longkang Energi' => ['none', null, null, false, 'area'],
                'Bilah Dimensi' => ['none', null, null, false, 'close'],
                'Singularitas Arkana' => ['none', null, null, false, 'area'],
            ],
            'Paladin' => [
                'Tebasan Suci' => ['none', null, null, false, 'close'],
                'Hantaman Berkat' => ['none', null, null, true, 'close'],
                'Sinar Penghukum' => ['none', null, null, false, 'range'],
                'Cahaya Penyembuh' => ['heal', null, 'hp', false, 'close'],
                'Perisai Cahaya' => ['buff', 'defense', null, false, 'close'],
                'Seruan Keadilan' => ['none', null, null, false, 'area'],
                'Sumpah Ksatria' => ['none', null, null, false, 'close'],
                'Hukuman Surga' => ['none', null, null, false, 'area'],
            ],
            'Bulwark' => [
                'Hantam Perisai Besar' => ['none', null, null, true, 'close'],
                'Serangan Balik' => ['none', null, null, false, 'close'],
                'Injak Bumi' => ['none', null, null, false, 'area'],
                'Tembok Baja' => ['buff', 'defense', null, false, 'close'],
                'Gelora Pelindung' => ['buff', 'defense', null, false, 'area'],
                'Pancaran Tameng' => ['none', null, null, false, 'area'],
                'Benteng Tak Tergoyahkan' => ['none', null, null, false, 'close'],
                'Murka Penjaga' => ['none', null, null, false, 'area'],
            ],
            'Warden' => [
                'Hantaman Runa' => ['none', null, null, true, 'close'],
                'Tebasan Penjaga' => ['none', null, null, false, 'close'],
                'Perisai Mana' => ['buff', 'defense', null, false, 'close'],
                'Pantulan Sihir' => ['none', null, null, false, 'close'],
                'Ledakan Runa' => ['none', null, null, false, 'range'],
                // Contoh eksplisit dari instruksi: aura sihir naikin magic defense TIM.
                'Gelombang Pelindung' => ['buff', 'defense', null, false, 'area'],
                'Benteng Mana' => ['none', null, null, false, 'close'],
                'Runtuhan Runa' => ['none', null, null, false, 'area'],
            ],
            'Sentinel' => [
                'Pukulan Seimbang' => ['none', null, null, false, 'close'],
                'Tebasan Penjaga' => ['none', null, null, true, 'close'],
                'Hantaman Berimbang' => ['none', null, null, false, 'close'],
                'Aura Seimbang' => ['buff', 'defense', null, false, 'close'],
                'Pantulan Seimbang' => ['buff', 'defense', null, false, 'close'],
                'Langkah Waspada' => ['none', null, null, false, 'close'],
                'Keseimbangan Sempurna' => ['none', null, null, false, 'close'],
                'Harmoni Elemen' => ['none', null, null, false, 'area'],
            ],
            'Pyromancer' => [
                'Pukulan Membara' => ['none', null, null, false, 'close'],
                'Bola Api' => ['none', null, null, true, 'range'],
                'Cakar Bara' => ['none', null, null, false, 'close'],
                'Ledakan Dekat' => ['none', null, null, false, 'area'],
                'Hujan Bara' => ['none', null, null, false, 'area'],
                'Aura Panas' => ['nerf', null, null, false, 'close'],
                'Nova Api' => ['none', null, null, false, 'area'],
                'Titik Didih' => ['none', null, null, false, 'range'],
            ],
            'Hydromancer' => [
                'Hantaman Basah' => ['none', null, null, false, 'close'],
                'Semburan Air' => ['none', null, null, true, 'range'],
                'Cambuk Ombak' => ['none', null, null, false, 'close'],
                'Riak Kejut' => ['none', null, null, false, 'area'],
                'Gelombang Pasang' => ['none', null, null, false, 'area'],
                'Aliran Pendingin' => ['nerf', null, null, false, 'close'],
                'Badai Tsunami' => ['none', null, null, false, 'area'],
                'Tekanan Laut Dalam' => ['none', null, null, false, 'range'],
            ],
            'Geomancer' => [
                'Hantaman Batu' => ['none', null, null, false, 'close'],
                'Duri Batu' => ['none', null, null, true, 'range'],
                'Hantaman Ganda Tanah' => ['none', null, null, false, 'close'],
                'Getaran Lokal' => ['none', null, null, false, 'area'],
                'Longsor Kecil' => ['none', null, null, false, 'area'],
                'Kulit Batu' => ['buff', 'defense', null, false, 'close'],
                'Gempa Bumi' => ['none', null, null, false, 'area'],
                'Runtuhan Gunung' => ['none', null, null, false, 'range'],
            ],
            'Aeromancer' => [
                'Pukulan Angin' => ['none', null, null, false, 'close'],
                'Tebasan Angin' => ['none', null, null, true, 'range'],
                'Sabetan Ganda' => ['none', null, null, false, 'close'],
                'Pusaran Kecil' => ['none', null, null, false, 'area'],
                'Terjangan Badai' => ['none', null, null, false, 'area'],
                'Langkah Angin' => ['buff', 'attack', null, false, 'close'],
                'Topan Dahsyat' => ['none', null, null, false, 'area'],
                'Vakum Udara' => ['none', null, null, false, 'range'],
            ],
            // === SAINT: Cleric condong HEAL ===
            'Cleric' => [
                'Pukulan Ringan' => ['none', null, null, true, 'close'],
                'Cahaya Penyembuh' => ['heal', null, 'hp', false, 'close'],
                'Berkat Ganda' => ['heal', null, 'hp', false, 'close'],
                'Lingkaran Suci' => ['heal', null, 'hp', false, 'area'],
                'Sentuhan Pemurnian' => ['heal', null, 'hp', false, 'close'],
                'Restorasi Bertahap' => ['heal', null, 'hp', false, 'close'],
                'Sanctuary' => ['heal', null, 'hp', false, 'area'],
                'Kebangkitan Cahaya' => ['heal', null, 'hp', false, 'close'],
            ],
            // === SAINT: Warlock condong NERF ===
            'Warlock' => [
                'Pukulan Gelap' => ['none', null, null, false, 'close'],
                'Tanda Kutukan' => ['nerf', null, null, false, 'range'],
                'Sentuhan Layu' => ['nerf', null, null, false, 'close'],
                'Rantai Kutukan' => ['nerf', null, null, false, 'range'],
                'Bisikan Teror' => ['nerf', null, null, true, 'close'],
                'Serapan Jiwa' => ['none', null, null, false, 'close'],
                'Wabah Kutukan' => ['nerf', null, null, false, 'area'],
                'Genggaman Maut' => ['none', null, null, false, 'close'],
            ],
            // === SAINT: Enchanter condong BUFF ===
            'Enchanter' => [
                'Pukulan Ringan' => ['none', null, null, true, 'close'],
                'Nyanyian Kekuatan' => ['buff', 'attack', null, false, 'close'],
                'Nyanyian Kecepatan' => ['buff', 'attack', null, false, 'close'],
                'Melodi Pelindung' => ['buff', 'defense', null, false, 'close'],
                'Gema Harmoni' => ['buff', 'attack', null, false, 'area'],
                'Not Penyemangat' => ['heal', null, 'mp', false, 'area'],
                'Simfoni Kemenangan' => ['buff', 'attack', null, false, 'area'],
                'Requiem Terakhir' => ['none', null, null, false, 'area'],
            ],
        ];

        foreach ($data as $subclassName => $skills) {
            $subclass = Subclass::where('name', $subclassName)->first();
            if (! $subclass) {
                continue;
            }

            foreach ($skills as $skillName => [$buffType, $buffStat, $healResource, $canStun, $combatRange]) {
                Skill::where('subclass_id', $subclass->id)
                    ->where('name', $skillName)
                    ->update([
                        'buff_type' => $buffType,
                        'buff_stat' => $buffStat,
                        'heal_resource' => $healResource,
                        'can_stun' => $canStun,
                        'combat_range' => $combatRange,
                    ]);
            }
        }
    }
}
