<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class CombatRangeSeeder extends Seeder
{
    /**
     * Klasifikasi close/range/area berdasarkan keyword di nama skill.
     * Ultimate & skill "sapuan area" -> area. Skill senjata/kontak langsung -> close.
     * Sisanya (proyektil/sihir jarak jauh single-target) -> range.
     */
    public function run(): void
    {
        $areaKeywords = [
            'Nova', 'Badai', 'Topan', 'Gempa', 'Tsunami', 'Wabah', 'Sanctuary',
            'Simfoni', 'Requiem', 'Vakum', 'Titik Didih', 'Tekanan Laut',
            'Runtuhan', 'Ledakan', 'Injak', 'Getaran', 'Longsor', 'Riak',
            'Pusaran', 'Lingkaran', 'Rantai', 'Gema', 'Berputar', 'Nyanyian',
            'Melodi', 'Not Penyemangat', 'Aura', 'Gelora', 'Pancaran', 'Gelombang',
            'Amukan', 'Murka', 'Seruan', 'Hukuman Surga', 'Harmoni', 'Balanced Guard',
            'Cyclone', 'Storm', 'Bilah Dimensi', 'Singularitas',
        ];

        $closeKeywords = [
            'Tebasan', 'Hantam', 'Hantaman', 'Tusukan', 'Cakar', 'Sabetan',
            'Pukulan', 'Serangan Berantai', 'Serangan Balik', 'Counter',
            'Guard Break', 'Hantaman Runa', 'Steel', 'Rage Slash', 'Reckless',
            'Perisai', 'Shield', 'Iron Stance', 'Kulit Batu', 'Sentuhan',
            'Genggaman', 'Cengkeraman', 'Withering Touch',
        ];

        Skill::chunk(50, function ($skills) use ($areaKeywords, $closeKeywords) {
            foreach ($skills as $skill) {
                $range = 'range'; // default buat skill magic/proyektil jarak jauh

                foreach ($areaKeywords as $kw) {
                    if (str_contains($skill->name, $kw)) {
                        $range = 'area';
                        break;
                    }
                }

                if ($range !== 'area') {
                    foreach ($closeKeywords as $kw) {
                        if (str_contains($skill->name, $kw)) {
                            $range = 'close';
                            break;
                        }
                    }
                }

                // Fallback tambahan: skill tier 3 dengan scaling physical yang belum
                // ketangkep keyword apapun, anggap close (finisher melee).
                if ($range === 'range' && $skill->scaling_stat === 'physical' && $skill->tier !== 3) {
                    $range = 'close';
                }

                $skill->update(['combat_range' => $range]);
            }
        });
    }
}
