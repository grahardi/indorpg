<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Element;
use App\Models\Skill;
use App\Models\Subclass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SkillController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Skill::with(['subclass.gameClass', 'element']);

        if ($request->filled('subclass_id')) {
            $query->where('subclass_id', $request->input('subclass_id'));
        }

        return Inertia::render('Admin/Skills/Index', [
            'skills' => $query->orderBy('subclass_id')->orderBy('tier')->orderBy('name')->get(),
            'subclasses' => Subclass::orderBy('name')->get(['id', 'name']),
            'filterSubclassId' => $request->input('subclass_id'),
        ]);
    }

    public function edit(Skill $skill): Response
    {
        return Inertia::render('Admin/Skills/Form', [
            'skill' => $skill,
            'elements' => Element::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Skill $skill): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'tier' => ['required', 'integer', 'in:1,3'],
            'element_id' => ['nullable', 'exists:elements,id'],
            'scaling_stat' => ['required', 'string', 'in:physical,magic'],
            'physical_ratio' => ['nullable', 'integer', 'min:0', 'max:100'],
            'combat_range' => ['required', 'string', 'in:close,range,area'],
            'stamina_cost' => ['required', 'integer', 'min:0'],
            'mana_cost' => ['required', 'integer', 'min:0'],
            'cooldown_seconds' => ['required', 'integer', 'min:0'],
            'base_multiplier' => ['required', 'numeric', 'min:0'],
            'can_stun' => ['boolean'],
            'buff_type' => ['required', 'string', 'in:'.implode(',', Skill::BUFF_TYPES)],
            'buff_stat' => ['nullable', 'string', 'in:'.implode(',', Skill::BUFF_STATS)],
            'heal_resource' => ['nullable', 'string', 'in:'.implode(',', Skill::HEAL_RESOURCES)],
            'required_level' => ['required', 'integer', 'min:1'],
        ]);

        $data['can_stun'] = $request->boolean('can_stun');
        if ($data['buff_type'] !== 'heal') {
            $data['heal_resource'] = null;
        }
        if ($data['buff_type'] !== 'buff') {
            $data['buff_stat'] = null;
        }

        $skill->update($data);

        return redirect()->route('admin.skills.index')->with('success', 'Skill diupdate.');
    }

    /**
     * Upload GIF animasi skill (dipakai buat ganti pose idle karakter pas skill
     * ini dipakai di battle - lihat SkillAnimationSeeder & Battle/Show.jsx).
     * Dipanggil via fetch() langsung (bukan Inertia visit), biar gak reload
     * halaman/ilangin isian form lain yang lagi diedit.
     */
    public function uploadAnimation(Request $request, Skill $skill): JsonResponse
    {
        $request->validate([
            'animation' => ['required', 'file', 'mimes:gif', 'max:5120'],
        ]);

        $filename = "skill-{$skill->id}.gif";
        $relativePath = "images/skills/animations/{$filename}";

        @mkdir(public_path('images/skills/animations'), 0755, true);
        $request->file('animation')->move(public_path('images/skills/animations'), $filename);

        $skill->update(['animation_path' => '/'.$relativePath]);

        return response()->json(['path' => '/'.$relativePath]);
    }
}
