<?php

use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\MapController as AdminMapController;
use App\Http\Controllers\Admin\MonsterController as AdminMonsterController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\SkillController as AdminSkillController;
use App\Http\Controllers\Admin\SpawnPointController as AdminSpawnPointController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\GameDataController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\GuildController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\MonsterController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

// Browsing publik - gak butuh login.
Route::get('/', [GameDataController::class, 'index'])->name('classes.index');
Route::get('/codex', [GameDataController::class, 'codex'])->name('classes.codex');
Route::get('/guide', [GuideController::class, 'index'])->name('guide.index');
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
    Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [\App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');
    // Terima log diagnostik dari BROWSER (bagian 104) - dibuka buat SEMUA
    // user login (bukan admin-only), karena yang tes battle player biasa,
    // bukan cuma admin. Ditulis ke file yang sama, admin liat lewat
    // /admin/frontend-debug-log.
    Route::post('/frontend-debug-log', [\App\Http\Controllers\Admin\DebugLogController::class, 'receiveFrontendLog'])->name('debug-log.frontend-receive');
    Route::get('/characters', [CharacterController::class, 'index'])->name('characters.index');
    Route::post('/characters', [CharacterController::class, 'store'])->name('characters.store');
    Route::delete('/characters/{character}', [CharacterController::class, 'destroy'])->name('characters.destroy');
    Route::post('/characters/{character}/upgrade', [CharacterController::class, 'upgradeStat'])->name('characters.upgrade');
    Route::post('/characters/{character}/loadout', [CharacterController::class, 'updateLoadout'])->name('characters.loadout');
    Route::post('/characters/{character}/skills/{skill}/allocate', [CharacterController::class, 'allocateSkillPoint'])->name('characters.skills.allocate');
    Route::post('/characters/{character}/items/{characterItemId}/toggle-equip', [CharacterController::class, 'toggleEquipItem'])->name('characters.items.toggle-equip');
    Route::post('/characters/{character}/items/{characterItemId}/sell', [CharacterController::class, 'sellItem'])->name('characters.items.sell');

    Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
    Route::get('/shop/{category}', [ShopController::class, 'category'])->name('shop.category')->where('category', 'artifact|accession');
    Route::post('/shop/buy', [ShopController::class, 'buy'])->name('shop.buy');
    Route::get('/my-items', [\App\Http\Controllers\AccessionController::class, 'index'])->name('accession.index');
    Route::post('/my-items/level-up', [\App\Http\Controllers\AccessionController::class, 'levelUp'])->name('accession.level-up');

    Route::get('/guild', [GuildController::class, 'index'])->name('guild.index');
    Route::post('/guild/quick-mission', [GuildController::class, 'quickMission'])->name('guild.quick-mission');
    Route::post('/guild/explore', [GuildController::class, 'setPartyAndExplore'])->name('guild.explore');

    Route::post('/spawn-points/{spawnPoint}/explore', [MapController::class, 'explore'])->name('spawn-points.explore');

    Route::get('/encounters/{encounter}/select', [BattleController::class, 'select'])->name('encounters.select');
    Route::post('/encounters/{encounter}/start', [BattleController::class, 'start'])->name('encounters.start');
    Route::get('/battles/{battle}', [BattleController::class, 'show'])->name('battles.show');
    Route::post('/battles/{battle}/act', [BattleController::class, 'act'])->name('battles.act');
    Route::post('/battles/{battle}/flee', [BattleController::class, 'flee'])->name('battles.flee');
});

// Admin - butuh login + is_admin=true (lihat middleware EnsureIsAdmin, grant
// akses lewat `php artisan user:make-admin {username}`).
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [AdminSettingController::class, 'update'])->name('settings.update');

    Route::get('/audio', [\App\Http\Controllers\Admin\AudioController::class, 'index'])->name('audio.index');
    Route::post('/audio/{key}/upload', [\App\Http\Controllers\Admin\AudioController::class, 'upload'])->name('audio.upload');
    Route::delete('/audio/{key}', [\App\Http\Controllers\Admin\AudioController::class, 'reset'])->name('audio.reset');

    // SEMENTARA - buat lacak bug cooldown skill yang berulang. Hapus lagi
    // (route + controller) kalau masalahnya udah kelar.
    Route::get('/skill-debug-log', [\App\Http\Controllers\Admin\DebugLogController::class, 'show'])->name('debug-log.show');
    Route::delete('/skill-debug-log', [\App\Http\Controllers\Admin\DebugLogController::class, 'clear'])->name('debug-log.clear');
    Route::get('/frontend-debug-log', [\App\Http\Controllers\Admin\DebugLogController::class, 'showFrontendLog'])->name('debug-log.frontend-show');
    Route::delete('/frontend-debug-log', [\App\Http\Controllers\Admin\DebugLogController::class, 'clearFrontendLog'])->name('debug-log.frontend-clear');
    Route::get('/monsters', [AdminMonsterController::class, 'index'])->name('monsters.index');
    Route::get('/monsters/create', [AdminMonsterController::class, 'create'])->name('monsters.create');
    Route::post('/monsters', [AdminMonsterController::class, 'store'])->name('monsters.store');
    Route::get('/monsters/{monster}/edit', [AdminMonsterController::class, 'edit'])->name('monsters.edit');
    Route::put('/monsters/{monster}', [AdminMonsterController::class, 'update'])->name('monsters.update');
    Route::post('/monsters/{monster}/skills/{skillIndex}/upload-audio', [AdminMonsterController::class, 'uploadSkillAudio'])->name('monsters.skills.upload-audio');
    Route::delete('/monsters/{monster}/skills/{skillIndex}/audio', [AdminMonsterController::class, 'resetSkillAudio'])->name('monsters.skills.reset-audio');
    Route::delete('/monsters/{monster}', [AdminMonsterController::class, 'destroy'])->name('monsters.destroy');

    Route::get('/skills', [AdminSkillController::class, 'index'])->name('skills.index');
    Route::get('/skills/{skill}/edit', [AdminSkillController::class, 'edit'])->name('skills.edit');
    Route::put('/skills/{skill}', [AdminSkillController::class, 'update'])->name('skills.update');
    Route::post('/skills/{skill}/upload-animation', [AdminSkillController::class, 'uploadAnimation'])->name('skills.upload-animation');
    Route::post('/skills/{skill}/upload-audio', [AdminSkillController::class, 'uploadAudio'])->name('skills.upload-audio');
    Route::delete('/skills/{skill}/audio', [AdminSkillController::class, 'resetAudio'])->name('skills.reset-audio');

    Route::get('/maps', [AdminMapController::class, 'index'])->name('maps.index');
    Route::get('/maps/create', [AdminMapController::class, 'create'])->name('maps.create');
    Route::post('/maps', [AdminMapController::class, 'store'])->name('maps.store');
    Route::get('/maps/{map}/edit', [AdminMapController::class, 'edit'])->name('maps.edit');
    Route::put('/maps/{map}', [AdminMapController::class, 'update'])->name('maps.update');
    Route::delete('/maps/{map}', [AdminMapController::class, 'destroy'])->name('maps.destroy');
    Route::post('/maps/{map}/background', [AdminMapController::class, 'uploadBackground'])->name('maps.background');

    Route::get('/maps/{map}/spawn-points', [AdminSpawnPointController::class, 'index'])->name('maps.spawn-points.index');
    Route::get('/maps/{map}/spawn-points/create', [AdminSpawnPointController::class, 'create'])->name('maps.spawn-points.create');
    Route::post('/maps/{map}/spawn-points', [AdminSpawnPointController::class, 'store'])->name('maps.spawn-points.store');
    Route::get('/maps/{map}/spawn-points/{spawnPoint}/edit', [AdminSpawnPointController::class, 'edit'])->name('maps.spawn-points.edit');
    Route::put('/maps/{map}/spawn-points/{spawnPoint}', [AdminSpawnPointController::class, 'update'])->name('maps.spawn-points.update');
    Route::delete('/maps/{map}/spawn-points/{spawnPoint}', [AdminSpawnPointController::class, 'destroy'])->name('maps.spawn-points.destroy');

    Route::get('/items', [AdminItemController::class, 'index'])->name('items.index');
    Route::get('/items/create', [AdminItemController::class, 'create'])->name('items.create');
    Route::post('/items', [AdminItemController::class, 'store'])->name('items.store');
    Route::post('/items/upload-icon', [AdminItemController::class, 'uploadIcon'])->name('items.upload-icon');
    Route::get('/items/{item}/edit', [AdminItemController::class, 'edit'])->name('items.edit');
    Route::put('/items/{item}', [AdminItemController::class, 'update'])->name('items.update');
    Route::delete('/items/{item}', [AdminItemController::class, 'destroy'])->name('items.destroy');
});
