// Efek suara battle - default disintesis pakai Web Audio API (gak perlu file
// eksternal), TAPI admin bisa upload file custom per event/skill/monster
// yang bakal dipakai ini kalau ada (fallback ke sintesis kalau kosong ATAU
// kalau gagal diputar).

let ctx = null;
const customAudioCache = {};

// Kirim log diagnostik ke SERVER (bagian 104) - biar bisa diliat lewat
// /admin/frontend-debug-log (file txt), gak perlu bolak-balik screenshot
// DevTools Console. Tetap console.log juga (buat yang bisa akses DevTools).
// "Fire and forget" - gagal kirim gak masalah, cuma diagnostik tambahan.
export function sendDebugLog(message) {
    console.log(message);
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        fetch('/frontend-debug-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ message }),
        }).catch(() => {});
    } catch (e) {
        // Diemin - ini cuma diagnostik tambahan, gak boleh ganggu gameplay.
    }
}

// "Buka kunci" izin audio browser - banyak browser (Chrome, Safari, dll)
// NOLAK audio.play() kalau dipanggil di luar user-gesture LANGSUNG (klik
// tombol, misalnya) - kalau suara dipicu dari respons async (fetch server
// abis skill dieksekusi), browser bisa anggap itu "bukan bagian dari" klik
// aslinya dan blokir diam-diam. Fix: panggil ini di DALAM handler klik
// LANGSUNG (misal tombol toggle Suara) - resume AudioContext + coba
// play+pause instan biar browser "inget" user udah kasih izin buat elemen
// audio berikutnya di sesi ini.
export function unlockAudio() {
    try {
        const audioCtx = getCtx();
        if (audioCtx?.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        const silent = new Audio();
        silent.play().then(() => silent.pause()).catch(() => {});
    } catch (e) {
        // Diemin - ini cuma usaha "priming", bukan critical path.
    }
}

function getCtx() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    return ctx;
}

// BUG FIX FATAL (v12.6): versi sebelumnya `playCustom()` SELALU return `true`
// begitu URL ada (walau audio.play() BENERAN GAGAL secara async) - efeknya
// caller (`playCustom(url) || beep()`) NGGAK PERNAH manggil beep() fallback
// kalau ada URL, meskipun file-nya gagal total diputar (403/404, format gak
// didukung, kena blokir autoplay browser, dll). User ngerasa "upload udah
// tapi tetep suara 8-bit" itu SEBALIKNYA gejala lain (audioSettings-nya
// kosong nyampe ke sini, playCustom balik false dari awal karena !url) -
// tapi kalaupun url-nya ADA dan GAGAL diputar, versi lama bakal DIEM AJA
// (gak ada suara sama sekali), BUKAN fallback ke sintesis. Fix total:
// `playWithFallback()` nunggu hasil asli dari audio.play() (resolve/reject),
// BARU mutusin fallback - dijamin SELALU ada suara (custom kalau berhasil,
// sintesis kalau gagal/kosong), gak pernah diem total.
function playWithFallback(url, fallbackFn, label) {
    if (!url) {
        fallbackFn();
        return;
    }
    try {
        if (!customAudioCache[url]) {
            customAudioCache[url] = new Audio(url);
        }
        const audio = customAudioCache[url];
        audio.currentTime = 0;
        audio.play().catch((err) => {
            sendDebugLog(`[battleAudio] "${label}" - gagal muter audio custom "${url}" (${err.name}: ${err.message}) - fallback ke suara sintesis.`);
            fallbackFn();
        });
    } catch (e) {
        sendDebugLog(`[battleAudio] "${label}" - exception pas nyoba muter "${url}" - fallback ke suara sintesis. ${e}`);
        fallbackFn();
    }
}

function beep({ freq = 440, duration = 0.12, type = 'square', volume = 0.15, sweepTo = null, delay = 0 }) {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    try {
        const start = audioCtx.currentTime + delay;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (sweepTo) {
            osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
        }
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
    } catch (e) {
        // Autoplay policy / unsupported browser - diemin aja, suara opsional.
    }
}

function beepUltimate() {
    [220, 330, 440, 660].forEach((f, i) => beep({ freq: f, duration: 0.22, type: 'sawtooth', volume: 0.2, delay: i * 0.06 }));
}
function beepCritical() {
    beep({ freq: 320, sweepTo: 120, duration: 0.18, type: 'sawtooth', volume: 0.22 });
    beep({ freq: 550, duration: 0.12, type: 'square', volume: 0.16, delay: 0.08 });
}
function beepItemDrop() {
    [660, 880, 1100].forEach((f, i) => beep({ freq: f, duration: 0.14, type: 'sine', volume: 0.14, delay: i * 0.08 }));
}
function beepVictory() {
    [523, 659, 784, 1046].forEach((f, i) => beep({ freq: f, duration: 0.28, type: 'square', volume: 0.16, delay: i * 0.15 }));
}
function beepDefeat() {
    [400, 350, 300, 220].forEach((f, i) => beep({ freq: f, duration: 0.32, type: 'sawtooth', volume: 0.14, delay: i * 0.18 }));
}

// Semua fungsi terima `customUrl` opsional (dari GameSetting/skill.audio_path,
// di-pass lewat Battle/Show.jsx) - kalau ada DAN berhasil diputar, dipakai;
// kalau kosong ATAU GAGAL diputar, fallback ke suara sintesis bawaan (dijamin
// SELALU ada suara, gak pernah diem total).
export const battleAudio = {
    hit: (customUrl) => playWithFallback(customUrl, () => beep({ freq: 220, sweepTo: 90, duration: 0.15, type: 'square', volume: 0.2 }), 'hit'),
    hitTaken: (customUrl) => playWithFallback(customUrl, () => beep({ freq: 180, sweepTo: 70, duration: 0.16, type: 'sawtooth', volume: 0.22 }), 'hitTaken'),
    skill: (customUrl) => playWithFallback(customUrl, () => beep({ freq: 400, sweepTo: 650, duration: 0.14, type: 'triangle', volume: 0.15 }), 'skill'),
    ultimate: (customUrl) => playWithFallback(customUrl, beepUltimate, 'ultimate'),
    critical: (customUrl) => playWithFallback(customUrl, beepCritical, 'critical'),
    miss: (customUrl) => playWithFallback(customUrl, () => beep({ freq: 600, sweepTo: 950, duration: 0.12, type: 'sine', volume: 0.1 }), 'miss'),
    cast: (customUrl) => playWithFallback(customUrl, () => beep({ freq: 150, sweepTo: 400, duration: 0.1, type: 'triangle', volume: 0.1 }), 'cast'),
    itemDrop: (customUrl) => playWithFallback(customUrl, beepItemDrop, 'itemDrop'),
    victory: (customUrl) => playWithFallback(customUrl, beepVictory, 'victory'),
    defeat: (customUrl) => playWithFallback(customUrl, beepDefeat, 'defeat'),
};
