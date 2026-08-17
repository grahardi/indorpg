<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class GameSetting extends Model
{
    protected $fillable = ['key', 'value', 'description'];

    /**
     * Ambil nilai setting (di-cache 60 detik biar gak query berkali-kali tiap battle).
     */
    public static function get(string $key, string $default = ''): string
    {
        return Cache::remember("game_setting:{$key}", 60, function () use ($key, $default) {
            return static::where('key', $key)->value('value') ?? $default;
        });
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("game_setting:{$key}");
    }

    public static function getFloat(string $key, float $default = 0): float
    {
        return (float) static::get($key, (string) $default);
    }

    public static function getInt(string $key, int $default = 0): int
    {
        return (int) static::get($key, (string) $default);
    }
}
