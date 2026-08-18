<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(): Response
    {
        $rarityOrder = "CASE rarity ".
            implode(' ', array_map(fn ($r, $i) => "WHEN '{$r}' THEN {$i}", Item::RARITIES, array_keys(Item::RARITIES))).
            ' END';

        return Inertia::render('Admin/Items/Index', [
            'items' => Item::orderByRaw($rarityOrder)->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Items/Form', ['item' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        Item::create($data);

        return redirect()->route('admin.items.index')->with('success', 'Item dibuat.');
    }

    public function edit(Item $item): Response
    {
        return Inertia::render('Admin/Items/Form', ['item' => $item]);
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        $item->update($data);

        return redirect()->route('admin.items.index')->with('success', 'Item diupdate.');
    }

    public function destroy(Item $item): RedirectResponse
    {
        $item->delete();

        return redirect()->route('admin.items.index')->with('success', 'Item dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'rarity' => ['required', 'string', 'in:'.implode(',', Item::RARITIES)],
            'price' => ['required', 'integer', 'min:1'],
            'effect_stat' => ['required', 'string', 'in:'.implode(',', Item::EFFECT_STATS)],
            'effect_value' => ['required', 'integer', 'min:1'],
            'drop_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);
    }
}
