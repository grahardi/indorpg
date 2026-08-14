<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\GameDataController;
use App\Http\Controllers\GuildController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\MonsterController;
use Illuminate\Support\Facades\Route;

// Browsing publik - gak butuh login.
Route::get('/', [GameDataController::class, 'index'])->name('classes.index');
Route::get('/subclass/{subclassId}', [GameDataController::class, 'showSubclass'])->name('subclass.show');
Route::post('/subclass/{subclass}/avatar', [GameDataController::class, 'uploadAvatar'])->name('subclass.avatar');
Route::post('/subclass/{subclass}/full-body', [GameDataController::class, 'uploadFullBody'])->name('subclass.fullbody');

Route::get('/monsters', [MonsterController::class, 'index'])->name('monsters.index');
Route::get('/monsters/{monster}', [MonsterController::class, 'show'])->name('monsters.show');
Route::post('/monsters/{monster}/avatar', [MonsterController::class, 'uploadAvatar'])->name('monsters.avatar');
Route::post('/monsters/{monster}/full-body', [MonsterController::class, 'uploadFullBody'])->name('monsters.fullbody');

Route::get('/maps', [MapController::class, 'index'])->name('maps.index');
Route::get('/maps/{map}', [MapController::class, 'show'])->name('maps.show');

Route::get('/characters/create', [CharacterController::class, 'create'])->middleware('auth')->name('characters.create');
Route::get('/characters/{character}', [CharacterController::class, 'show'])->name('characters.show');

// Auth - username + password sederhana.
Route::middleware('guest')->group(function () {
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// Butuh login - bikin karakter, adventure/battle (party wajib punya
// minimal 1 karakter milik sendiri, divalidasi di controller).
Route::middleware('auth')->group(function () {
    Route::get('/characters', [CharacterController::class, 'index'])->name('characters.index');
    Route::post('/characters', [CharacterController::class, 'store'])->name('characters.store');
    Route::delete('/characters/{character}', [CharacterController::class, 'destroy'])->name('characters.destroy');
    Route::post('/characters/{character}/upgrade', [CharacterController::class, 'upgradeStat'])->name('characters.upgrade');
    Route::post('/characters/{character}/loadout', [CharacterController::class, 'updateLoadout'])->name('characters.loadout');

    Route::get('/guild', [GuildController::class, 'index'])->name('guild.index');
    Route::post('/guild/quick-mission', [GuildController::class, 'quickMission'])->name('guild.quick-mission');
    Route::post('/guild/explore', [GuildController::class, 'setPartyAndExplore'])->name('guild.explore');

    Route::post('/spawn-points/{spawnPoint}/explore', [MapController::class, 'explore'])->name('spawn-points.explore');

    Route::get('/encounters/{encounter}/select', [BattleController::class, 'select'])->name('encounters.select');
    Route::post('/encounters/{encounter}/start', [BattleController::class, 'start'])->name('encounters.start');
    Route::get('/battles/{battle}', [BattleController::class, 'show'])->name('battles.show');
    Route::post('/battles/{battle}/flee', [BattleController::class, 'flee'])->name('battles.flee');
});
