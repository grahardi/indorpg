<?php

use App\Http\Controllers\GameDataController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameDataController::class, 'index'])->name('classes.index');
Route::get('/subclass/{subclassId}', [GameDataController::class, 'showSubclass'])->name('subclass.show');
