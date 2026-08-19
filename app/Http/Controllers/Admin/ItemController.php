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
            'items' => Item::with('element')->orderByRaw($rarityOrder)->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Items/Form', [
            'item' => null,
            'elements' => \App\Models\Element::orderBy('name')->get(),
            'availableIcons' => $this->availableIcons(),
        ]);
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
        return Inertia::render('Admin/Items/Form', [
            'item' => $item,
            'elements' => \App\Models\Element::orderBy('name')->get(),
            'availableIcons' => $this->availableIcons(),
        ]);
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

    /**
     * Scan folder public/images/items/pool/ (40 ikon dari game-icons.net yang
     * belum ke-assign ke item manapun) - dipakai buat picker gambar di form
     * admin, biar admin gampang pilih ikon yang belum kepakai pas bikin item
     * manual, gak perlu upload sendiri.
     */
    private function availableIcons(): array
    {
        $poolDir = public_path('images/items/pool');
        if (! is_dir($poolDir)) {
            return [];
        }

        $usedPaths = Item::pluck('icon_path')->filter()->all();

        $files = glob($poolDir.'/*.png') ?: [];

        return collect($files)
            ->map(fn ($f) => '/images/items/pool/'.basename($f))
            ->reject(fn ($path) => in_array($path, $usedPaths, true))
            ->values()
            ->all();
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'rarity' => ['required', 'string', 'in:'.implode(',', Item::RARITIES)],
            'price' => ['required', 'integer', 'min:1'],
            'effect_stat' => ['required', 'string', 'in:'.implode(',', Item::EFFECT_STATS)],
            'effect_element_id' => ['nullable', 'exists:elements,id'],
            'effect_value' => ['required', 'integer', 'min:1'],
            'drop_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'icon_path' => ['nullable', 'string', 'max:255'],
        ]);

        if ($data['effect_stat'] !== 'elemental_damage') {
            $data['effect_element_id'] = null;
        }

        return $data;
    }
}
