<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\ImageResizer;
use Illuminate\Http\JsonResponse;
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
     * Upload gambar manual (bukan pilih dari pool) - dipanggil via fetch()
     * langsung dari form (bukan Inertia visit), biar gak reload halaman/ilangin
     * isian form yang lain. Gak butuh {item} existing karena dipakai juga pas
     * bikin item BARU (belum ada ID).
     */
    public function uploadIcon(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120', 'dimensions:min_width=32,min_height=32'],
        ]);

        $binary = ImageResizer::coverResizePng($request->file('image')->getRealPath(), 256, 256, 'center');

        $filename = Str::uuid().'.png';
        $relativePath = 'images/items/uploads/'.$filename;
        @mkdir(public_path('images/items/uploads'), 0755, true);
        file_put_contents(public_path($relativePath), $binary);

        return response()->json(['path' => '/'.$relativePath]);
    }

    /**
     * Scan folder public/images/items/pool/ (ikon dari game-icons.net yang
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
            'category' => ['required', 'string', 'in:'.implode(',', Item::CATEGORIES)],
            'price' => ['required', 'integer', 'min:1'],
            'effect_stat' => ['required', 'string', 'in:'.implode(',', Item::EFFECT_STATS)],
            'effect_element_id' => ['nullable', 'exists:elements,id'],
            'effect_value' => ['required', 'integer', 'min:1'],
            'drop_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'icon_path' => ['nullable', 'string', 'max:255'],
            'accession_bonuses' => ['nullable', 'array'],
            'accession_bonuses.*.tier' => ['required', 'integer', 'in:'.implode(',', Item::ACCESSION_TIERS)],
            'accession_bonuses.*.stat' => ['required', 'string', 'in:'.implode(',', Item::EFFECT_STATS)],
            'accession_bonuses.*.value' => ['required', 'integer'],
            'accession_bonuses.*.element_id' => ['nullable', 'exists:elements,id'],
        ]);

        if ($data['effect_stat'] !== 'elemental_damage') {
            $data['effect_element_id'] = null;
        }

        // Bonus Part cuma relevan buat item 'artifact' (equipment) - kategori
        // lain (accession/material) gak ada mekanisme level, jadi dikosongin.
        if ($data['category'] !== 'artifact') {
            $data['accession_bonuses'] = null;
        } else {
            // Per-part: kalau statnya bukan elemental_damage, element_id-nya
            // dikosongin (biar gak nyisa data gak relevan).
            $data['accession_bonuses'] = collect($data['accession_bonuses'] ?? [])
                ->map(fn ($b) => [
                    'tier' => (int) $b['tier'],
                    'stat' => $b['stat'],
                    'value' => (int) $b['value'],
                    'element_id' => $b['stat'] === 'elemental_damage' ? ($b['element_id'] ?? null) : null,
                ])
                ->values()
                ->all();
        }

        return $data;
    }
}
