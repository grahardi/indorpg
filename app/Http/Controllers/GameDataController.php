<?php

namespace App\Http\Controllers;

use App\Models\GameClass;
use Inertia\Inertia;
use Inertia\Response;

class GameDataController extends Controller
{
    /**
     * Menampilkan seluruh class, subclass, dan skill tier 1 (data browser, no auth).
     */
    public function index(): Response
    {
        $classes = GameClass::with(['subclasses.element', 'subclasses.skills'])
            ->orderBy('id')
            ->get();

        return Inertia::render('Classes/Index', [
            'classes' => $classes,
        ]);
    }

    public function showSubclass(int $subclassId): Response
    {
        $subclass = \App\Models\Subclass::with(['gameClass', 'element', 'skills'])
            ->findOrFail($subclassId);

        return Inertia::render('Classes/Show', [
            'subclass' => $subclass,
        ]);
    }
}
