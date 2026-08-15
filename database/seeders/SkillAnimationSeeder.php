<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\Subclass;
use Illuminate\Database\Seeder;

class SkillAnimationSeeder extends Seeder
{
    /**
     * Isi animation_path buat skill yang udah punya GIF moveset. Baru Blade
     * Knight yang ada (8 skill = 8 gif). Subclass lain nyusul kalau ada
     * asetnya nanti - format nama file: {slug-subclass}-{slug-skill}.gif
     * di public/images/skills/animations/.
     */
    public function run(): void
    {
        $subclass = Subclass::where('name', 'Blade Knight')->first();
        if (! $subclass) {
            return;
        }

        $map = [
            'Tebasan Baja' => 'blade-knight-tebasan-baja.gif',
            'Serangan Berantai' => 'blade-knight-serangan-berantai.gif',
            'Hantam Perisai' => 'blade-knight-hantam-perisai.gif',
            'Tebasan Berputar' => 'blade-knight-tebasan-berputar.gif',
            'Pedang Elemental' => 'blade-knight-pedang-elemental.gif',
            'Gelombang Kejut' => 'blade-knight-gelombang-kejut.gif',
            'Badai Bilah' => 'blade-knight-badai-bilah.gif',
            'Murka Ksatria' => 'blade-knight-murka-ksatria.gif',
        ];

        foreach ($map as $skillName => $filename) {
            Skill::where('subclass_id', $subclass->id)
                ->where('name', $skillName)
                ->update(['animation_path' => '/images/skills/animations/'.$filename]);
        }

        // Pose idle khusus arena battle (kanvas 364x360, sync sama GIF di atas).
        $subclass->update(['battle_idle_path' => '/images/subclasses/blade-knight-idle.png']);
    }
}
