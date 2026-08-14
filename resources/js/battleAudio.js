// Efek suara battle, disintesis langsung pakai Web Audio API (gak perlu file
// audio eksternal - hindari masalah lisensi/asset, dan ukuran bundle tetap kecil).

let ctx = null;

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

export const battleAudio = {
    hit: () => beep({ freq: 220, sweepTo: 90, duration: 0.15, type: 'square', volume: 0.2 }),
    critical: () => {
        beep({ freq: 320, sweepTo: 120, duration: 0.18, type: 'sawtooth', volume: 0.22 });
        beep({ freq: 550, duration: 0.12, type: 'square', volume: 0.16, delay: 0.08 });
    },
    miss: () => beep({ freq: 600, sweepTo: 950, duration: 0.12, type: 'sine', volume: 0.1 }),
    cast: () => beep({ freq: 150, sweepTo: 400, duration: 0.1, type: 'triangle', volume: 0.1 }),
    victory: () => {
        [523, 659, 784, 1046].forEach((f, i) => beep({ freq: f, duration: 0.28, type: 'square', volume: 0.16, delay: i * 0.15 }));
    },
    defeat: () => {
        [400, 350, 300, 220].forEach((f, i) => beep({ freq: f, duration: 0.32, type: 'sawtooth', volume: 0.14, delay: i * 0.18 }));
    },
};
