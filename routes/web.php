<?php

use App\Http\Controllers\CharacterController;
use App\Http\Controllers\GameDataController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameDataController::class, 'index'])->name('classes.index');
Route::get('/subclass/{subclassId}', [GameDataController::class, 'showSubclass'])->name('subclass.show');
Route::post('/subclass/{subclass}/avatar', [GameDataController::class, 'uploadAvatar'])->name('subclass.avatar');
Route::post('/subclass/{subclass}/full-body', [GameDataController::class, 'uploadFullBody'])->name('subclass.fullbody');

Route::get('/characters', [CharacterController::class, 'index'])->name('characters.index');
Route::get('/characters/create', [CharacterController::class, 'create'])->name('characters.create');
Route::post('/characters', [CharacterController::class, 'store'])->name('characters.store');
Route::get('/characters/{character}', [CharacterController::class, 'show'])->name('characters.show');
Route::delete('/characters/{character}', [CharacterController::class, 'destroy'])->name('characters.destroy');
Route::post('/characters/{character}/avatar', [CharacterController::class, 'uploadAvatar'])->name('characters.avatar');
Route::post('/characters/{character}/full-body', [CharacterController::class, 'uploadFullBody'])->name('characters.fullbody');
