// Efek suara battle - default disintesis pakai Web Audio API (gak perlu file
// eksternal), TAPI admin bisa upload file custom per event lewat /admin/audio
// yang bakal dipakai ini kalau ada (fallback ke sintesis kalau kosong).

let ctx = null;
const customAudioCache = {};

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

// Mainin file custom (di-cache per URL biar gak re-fetch tiap panggil).
// Return true kalau berhasil coba mainin (walau gagal autoplay, tetep true -
// caller gak perlu fallback ke sintesis lagi kalau emang ada custom file).
function playCustom(url) {
    if (!url) return false;
    try {
        if (!customAudioCache[url]) {
            customAudioCache[url] = new Audio(url);
        }
        const audio = customAudioCache[url];
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return true;
    } catch (e) {
        return false;
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

// Semua fungsi terima `customUrl` opsional (dari GameSetting, di-pass lewat
// props audioSettings di Battle/Show.jsx) - kalau ada, dipakai; kalau kosong,
// fallback ke suara sintesis bawaan.
export const battleAudio = {
    hit: (customUrl) => playCustom(customUrl) || beep({ freq: 220, sweepTo: 90, duration: 0.15, type: 'square', volume: 0.2 }),
    hitTaken: (customUrl) => playCustom(customUrl) || beep({ freq: 180, sweepTo: 70, duration: 0.16, type: 'sawtooth', volume: 0.22 }),
    skill: (customUrl) => playCustom(customUrl) || beep({ freq: 400, sweepTo: 650, duration: 0.14, type: 'triangle', volume: 0.15 }),
    ultimate: (customUrl) => {
        if (playCustom(customUrl)) return;
        [220, 330, 440, 660].forEach((f, i) => beep({ freq: f, duration: 0.22, type: 'sawtooth', volume: 0.2, delay: i * 0.06 }));
    },
    critical: (customUrl) => {
        if (playCustom(customUrl)) return;
        beep({ freq: 320, sweepTo: 120, duration: 0.18, type: 'sawtooth', volume: 0.22 });
        beep({ freq: 550, duration: 0.12, type: 'square', volume: 0.16, delay: 0.08 });
    },
    miss: (customUrl) => playCustom(customUrl) || beep({ freq: 600, sweepTo: 950, duration: 0.12, type: 'sine', volume: 0.1 }),
    cast: (customUrl) => playCustom(customUrl) || beep({ freq: 150, sweepTo: 400, duration: 0.1, type: 'triangle', volume: 0.1 }),
    itemDrop: (customUrl) => {
        if (playCustom(customUrl)) return;
        [660, 880, 1100].forEach((f, i) => beep({ freq: f, duration: 0.14, type: 'sine', volume: 0.14, delay: i * 0.08 }));
    },
    victory: (customUrl) => {
        if (playCustom(customUrl)) return;
        [523, 659, 784, 1046].forEach((f, i) => beep({ freq: f, duration: 0.28, type: 'square', volume: 0.16, delay: i * 0.15 }));
    },
    defeat: (customUrl) => {
        if (playCustom(customUrl)) return;
        [400, 350, 300, 220].forEach((f, i) => beep({ freq: f, duration: 0.32, type: 'sawtooth', volume: 0.14, delay: i * 0.18 }));
    },
};
