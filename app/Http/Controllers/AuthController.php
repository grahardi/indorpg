<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showRegister(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => [
                'required', 'string', 'min:3', 'max:30', 'alpha_dash',
                // 'unique' bawaan Laravel case-SENSITIVE di Postgres, jadi "Jatayu"
                // dan "jatayu" dianggap 2 username beda. Custom rule ini cek
                // case-insensitive biar gak bisa daftar dua akun cuma beda huruf besar/kecil.
                Rule::unique('users', 'username')->where(fn ($query) => $query->whereRaw('LOWER(username) = ?', [strtolower($request->input('username'))])),
            ],
            'password' => ['required', 'string', 'min:4', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $data['username'],
            'username' => $data['username'],
            'password' => $data['password'], // otomatis di-hash lewat cast 'hashed' di model User
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('guild.index');
    }

    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Cari user case-insensitive dulu (WHERE username = ? di Postgres itu
        // case-sensitive by default), baru cek password manual - biar "jatayu"
        // dan "Jatayu" dianggap sama pas login walau tersimpannya "Jatayu".
        $user = User::whereRaw('LOWER(username) = ?', [strtolower($data['username'])])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password salah.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('guild.index'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('classes.index');
    }
}
