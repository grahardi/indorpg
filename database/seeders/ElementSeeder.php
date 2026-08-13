<?php

namespace Database\Seeders;

use App\Models\Element;
use App\Models\ElementMatchup;
use Illuminate\Database\Seeder;

class ElementSeeder extends Seeder
{
    public function run(): void
    {
        $elements = ['Fire', 'Wind', 'Earth', 'Water'];

        foreach ($elements as $name) {
            Element::updateOrCreate(
                ['slug' => \Illuminate\Support\Str::slug($name)],
                ['name' => $name]
            );
        }

        // Siklus: Fire > Wind > Earth > Water > Fire
        $cycle = ['Fire', 'Wind', 'Earth', 'Water'];
        $count = count($cycle);

        for ($i = 0; $i < $count; $i++) {
            $attacker = Element::where('name', $cycle[$i])->first();
            $strongAgainst = Element::where('name', $cycle[($i + 1) % $count])->first();
            $weakAgainst = Element::where('name', $cycle[($i - 1 + $count) % $count])->first();

            ElementMatchup::updateOrCreate(
                ['attacker_element_id' => $attacker->id, 'defender_element_id' => $strongAgainst->id],
                ['multiplier' => 1.25]
            );

            ElementMatchup::updateOrCreate(
                ['attacker_element_id' => $attacker->id, 'defender_element_id' => $weakAgainst->id],
                ['multiplier' => 0.85]
            );
        }
    }
}
