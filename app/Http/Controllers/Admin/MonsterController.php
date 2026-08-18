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
        return Inertia::render('Admin/Monsters/Index', [
            'monsters' => Monster::with('element')->orderBy('level')->get(),
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
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', 'integer', 'min:1', 'max:100'],
            'type' => ['required', 'string', 'max:50'],
            'element_id' => ['nullable', 'exists:elements,id'],
            'strong_against' => ['nullable', 'string', 'in:'.implode(',', Monster::COMBAT_PATTERNS)],
            'weak_against' => ['nullable', 'string', 'in:'.implode(',', Monster::COMBAT_PATTERNS)],
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
        ]);
    }
}
