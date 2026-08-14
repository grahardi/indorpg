<?php

namespace App\Http\Controllers;

use App\Models\Monster;
use Inertia\Inertia;
use Inertia\Response;

class MonsterController extends Controller
{
    public function index(): Response
    {
        $monsters = Monster::with('element')
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Monsters/Index', [
            'monsters' => $monsters,
        ]);
    }

    public function show(Monster $monster): Response
    {
        $monster->load('element');

        return Inertia::render('Monsters/Show', [
            'monster' => $monster,
        ]);
    }
}
