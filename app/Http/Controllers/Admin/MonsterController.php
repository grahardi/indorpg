<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Element;
use App\Models\Monster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MonsterController extends Controller
{
    public function index(): Response
    {
        $rankOrder = "CASE class_rank ".
            implode(' ', array_map(fn ($r, $i) => "WHEN '{$r}' THEN {$i}", Monster::RANKS, array_keys(Monster::RANKS))).
            ' END';

        return Inertia::render('Admin/Monsters/Index', [
            'monsters' => Monster::with('element')->orderByRaw($rankOrder)->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Monsters/Form', [
            'monster' => null,
            'elements' => Element::orderBy('name')->get(),
            'combatPatterns' => Monster::COMBAT_PATTERNS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        Monster::create($data);

        return redirect()->route('admin.monsters.index')->with('success', 'Monster dibuat.');
    }

    public function edit(Monster $monster): Response
    {
        return Inertia::render('Admin/Monsters/Form', [
            'monster' => $monster,
            'elements' => Element::orderBy('name')->get(),
            'combatPatterns' => Monster::COMBAT_PATTERNS,
        ]);
    }

    public function update(Request $request, Monster $monster): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        $monster->update($data);

        return redirect()->route('admin.monsters.index')->with('success', 'Monster diupdate.');
    }

    public function destroy(Monster $monster): RedirectResponse
    {
        $monster->delete();

        return redirect()->route('admin.monsters.index')->with('success', 'Monster dihapus.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', 'integer', 'min:1', 'max:100'],
            'class_rank' => ['required', 'string', 'in:'.implode(',', Monster::RANKS)],
            'type' => ['required', 'string', 'max:50'],
            'element_id' => ['nullable', 'exists:elements,id'],
            'hp' => ['required', 'integer', 'min:1'],
            'physical_damage' => ['required', 'integer', 'min:0'],
            'physical_defense' => ['required', 'integer', 'min:0'],
            'magic_damage' => ['required', 'integer', 'min:0'],
            'magic_defense' => ['required', 'integer', 'min:0'],
            'agility' => ['required', 'integer', 'min:0'],
            'accuracy' => ['required', 'integer', 'min:0'],
            'exp_reward' => ['required', 'integer', 'min:1'],
            'min_party_level' => ['required', 'integer', 'min:1'],
            'special_skill_name' => ['nullable', 'string', 'max:100'],
            'special_skill_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'weak_matchups' => ['nullable', 'array', 'max:2'],
            'weak_matchups.*.combat_range' => ['nullable', 'string', 'in:close,range,area'],
            'weak_matchups.*.element_id' => ['nullable', 'integer', 'exists:elements,id'],
            'weak_matchups.*.ratio' => ['nullable', 'numeric', 'min:0'],
            'strong_matchups' => ['nullable', 'array', 'max:2'],
            'strong_matchups.*.combat_range' => ['nullable', 'string', 'in:close,range,area'],
            'strong_matchups.*.element_id' => ['nullable', 'integer', 'exists:elements,id'],
            'strong_matchups.*.ratio' => ['nullable', 'numeric', 'min:0'],
            'skills_config' => ['nullable', 'array'],
            'skills_config.*.name' => ['required', 'string', 'max:100'],
            'skills_config.*.damage_ratio' => ['required', 'numeric', 'min:0', 'max:100'],
            'skills_config.*.effect' => ['required', 'string', 'in:single,area'],
            'skills_config.*.can_stun' => ['boolean'],
            'skills_config.*.usage_ratio' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        if (isset($data['skills_config'])) {
            $data['skills_config'] = collect($data['skills_config'])
                ->map(fn ($s) => [...$s, 'can_stun' => (bool) ($s['can_stun'] ?? false)])
                ->values()
                ->all();
        }

        // Buang slot yang combat_range-nya kosong (dianggap "gak diisi").
        foreach (['weak_matchups', 'strong_matchups'] as $key) {
            $data[$key] = collect($data[$key] ?? [])
                ->filter(fn ($slot) => ! empty($slot['combat_range']))
                ->values()
                ->all();
        }

        return $data;
    }
}
