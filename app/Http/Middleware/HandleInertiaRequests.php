<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'appName' => config('app.name', 'IndoRPG'),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'username' => $request->user()->username,
                    'is_admin' => $request->user()->is_admin,
                    'default_battle_mode' => $request->user()->default_battle_mode,
                ] : null,
            ],
            'flash' => [
                'explore_result' => fn () => $request->session()->get('explore_result'),
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }
}
