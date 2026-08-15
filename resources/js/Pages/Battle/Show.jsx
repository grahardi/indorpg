import { Link, Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { battleAudio } from '../../battleAudio';

const MONSTER_COLOR = '#b8433a';
const PARTICIPANT_COLORS = ['#3f8c94', '#c9a24b', '#7269d1'];

function Bar({ current, max, color }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    return (
        <div className="rpg-stat-track" style={{ height: 6 }}>
            <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
        </div>
    );
}

export default function Show({ battle }) {
    const { props } = usePage();
    const currentUserId = props.auth?.user?.id;
    const monster = battle.monster;
    const log = battle.battle_log || [];

    const [step, setStep] = useState(0);
    const [finished, setFinished] = useState(log.length <= 1);
    const [soundOn, setSoundOn] = useState(true);
    const [redirectIn, setRedirectIn] = useState(null);
    const timerRef = useRef(null);
    const finishedSoundPlayed = useRef(false);

    // Target total durasi animasi 15-30 detik, interval per baris log disesuaikan
    // biar totalnya masuk range itu (dibatasi biar gak terlalu cepat/lambat per baris).
    const intervalMs = useMemo(() => {
        const targetTotal = 15000 + Math.random() * 15000;
        const raw = targetTotal / Math.max(log.length - 1, 1);
        return Math.max(700, Math.min(2600, raw));
    }, [log.length]);

    useEffect(() => {
        if (step >= log.length - 1) {
            setFinished(true);
            return;
        }
        timerRef.current = setTimeout(() => setStep((s) => s + 1), intervalMs);
        return () => clearTimeout(timerRef.current);
    }, [step, log.length, intervalMs]);

    useEffect(() => {
        const logEnd = document.getElementById('battle-log-end');
        logEnd?.scrollIntoView({ behavior: 'smooth' });
    }, [step]);

    // Trigger efek suara sesuai isi baris log yang baru muncul.
    useEffect(() => {
        if (!soundOn) return;
        const entry = log[step];
        if (!entry) return;
        const text = entry.text;
        if (text.includes('CRITICAL')) battleAudio.critical();
        else if (text.includes('MELESET')) battleAudio.miss();
        else if (text.includes('damage')) battleAudio.hit();
        else if (text.includes('muncul menghadang')) battleAudio.cast();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Suara menang/kalah, sekali doang pas animasi kelar.
    useEffect(() => {
        if (!finished || finishedSoundPlayed.current || !soundOn) return;
        if (battle.status === 'won') battleAudio.victory();
        else if (battle.status === 'lost') battleAudio.defeat();
        finishedSoundPlayed.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    // Auto-balik ke Guild beberapa detik setelah battle kelar - biar gak ada yang
    // "kejebak" di layar battle lama pas balik buka app lagi.
    useEffect(() => {
        if (!finished || battle.status === 'ongoing') return;
        setRedirectIn(5);
        const countdown = setInterval(() => {
            setRedirectIn((s) => {
                if (s <= 1) {
                    clearInterval(countdown);
                    router.visit(route('guild.index'));
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(countdown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function skipToEnd() {
        clearTimeout(timerRef.current);
        setStep(log.length - 1);
        setFinished(true);
    }

    const current = log[step] || { monster_hp: battle.monster_current_hp, participants: {} };
    const visibleLog = log.slice(0, step + 1);

    function logLineColor(text) {
        const map = { [monster.name]: MONSTER_COLOR };
        battle.participants.forEach((p, i) => {
            map[p.character.name] = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];
        });
        const speaker = Object.keys(map).find((name) => text.startsWith(name));
        return speaker ? map[speaker] : 'var(--text-secondary)';
    }

    // Karakter "utama" buat layar hasil - punya user yang login, fallback ke yang pertama.
    const mainIndex = battle.participants.findIndex((p) => p.character.user_id === currentUserId);
    const mainParticipant = mainIndex >= 0 ? battle.participants[mainIndex] : battle.participants[0];
    const mainColor = PARTICIPANT_COLORS[(mainIndex >= 0 ? mainIndex : 0) % PARTICIPANT_COLORS.length];
    const mainSubclass = mainParticipant?.character?.subclass;

    // ===== LAYAR HASIL (battle selesai) - tampilan baru, gak ada lagi scene battle-nya =====
    if (finished && battle.status !== 'ongoing') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
                <Head title={battle.status === 'won' ? 'Menang!' : battle.status === 'lost' ? 'Kalah' : 'Mundur'} />
                <div className="container py-5" style={{ maxWidth: 560 }}>
                    <div className="rpg-card text-center" style={{ '--accent': battle.status === 'won' ? '#c9a24b' : battle.status === 'lost' ? '#5b6178' : '#8890a4', padding: '2rem 1.5rem' }}>
                        {(battle.status === 'won' || battle.status === 'lost') && (
                            <div className="d-flex align-items-center justify-content-center gap-3 gap-md-4 mb-4 flex-wrap">
                                <div style={{ width: 130, position: 'relative' }}>
                                    {mainSubclass?.full_body_path ? (
                                        <img
                                            src={mainSubclass.full_body_path}
                                            alt={mainParticipant.character.name}
                                            style={{
                                                width: '100%', aspectRatio: '1 / 2', objectFit: 'contain',
                                                background: 'var(--bg-panel)', borderRadius: 10,
                                                border: `2px solid ${battle.status === 'lost' ? '#5b6178' : mainColor}`,
                                                filter: battle.status === 'lost' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': mainColor, width: 90, height: 90, fontSize: '2rem', filter: battle.status === 'lost' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {mainParticipant.character.name.charAt(0)}
                                        </div>
                                    )}
                                    {battle.status === 'lost' && (
                                        <div
                                            style={{
                                                position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
                                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#5b6178',
                                                textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 3px black',
                                            }}
                                        >
                                            TUMBANG
                                        </div>
                                    )}
                                    <div className="mt-2" style={{ color: battle.status === 'lost' ? 'var(--text-muted)' : mainColor, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {mainParticipant.character.name}
                                    </div>
                                </div>

                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    VS
                                </div>

                                <div style={{ width: 130, position: 'relative' }}>
                                    {monster.full_body_path ? (
                                        <img
                                            src={monster.full_body_path}
                                            alt={monster.name}
                                            style={{
                                                width: '100%', aspectRatio: '1 / 1', objectFit: 'contain',
                                                background: 'var(--bg-panel)', borderRadius: 10,
                                                border: `2px solid ${battle.status === 'won' ? '#5b6178' : MONSTER_COLOR}`,
                                                filter: battle.status === 'won' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': MONSTER_COLOR, width: 90, height: 90, fontSize: '2rem', filter: battle.status === 'won' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {monster.name.charAt(0)}
                                        </div>
                                    )}
                                    {battle.status === 'won' && (
                                        <div
                                            style={{
                                                position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
                                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#b8433a',
                                                textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 3px black',
                                            }}
                                        >
                                            K.O.
                                        </div>
                                    )}
                                    <div className="mt-2" style={{ color: battle.status === 'won' ? 'var(--text-muted)' : MONSTER_COLOR, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {monster.name}
                                    </div>
                                </div>
                            </div>
                        )}

                        {battle.status === 'fled' && (
                            <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>🏳️</div>
                        )}

                        <div className="rpg-subclass-name" style={{ fontSize: '1.5rem' }}>
                            {battle.status === 'won' && '🏆 Menang!'}
                            {battle.status === 'lost' && '💀 Kalah...'}
                            {battle.status === 'fled' && 'Party Menyerah'}
                        </div>
                        {battle.status === 'fled' && (
                            <p className="text-secondary small mt-1 mb-0">Pertarungan kelamaan, party mundur teratur.</p>
                        )}

                        {battle.status === 'won' && (
                            <div className="mt-3">
                                <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem' }}>Hadiah</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#c9a24b' }}>
                                    +{monster.exp_reward} EXP <span className="rpg-power-type" style={{ fontSize: '0.85rem' }}>/ karakter</span>
                                </div>
                            </div>
                        )}

                        {redirectIn !== null && redirectIn > 0 && (
                            <p className="text-secondary small mt-4 mb-0">Kembali ke Guild otomatis dalam {redirectIn}s...</p>
                        )}
                        <div className="d-flex gap-2 justify-content-center mt-3">
                            <Link href={route('guild.index')} className="rpg-back-link">Kembali ke Guild</Link>
                            <Link href={route('maps.index')} className="rpg-back-link">Peta</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== LAYAR BATTLE BERJALAN (animasi playback) =====
    const otherParticipants = battle.participants.filter((p) => p.character.user_id !== currentUserId);
    const mainBattleParticipant = battle.participants.find((p) => p.character.user_id === currentUserId) || battle.participants[0];

    function renderPartyCard(p, isMain) {
        const i = battle.participants.indexOf(p);
        const live = current.participants[p.character_id] || {
            hp: p.current_hp, stamina: p.current_stamina, mana: p.current_mana, is_alive: p.is_alive,
        };
        const subclass = p.character.subclass;
        const maxHp = p.character.effective_base_hp ?? live.hp;
        const maxStamina = p.character.effective_base_sp ?? live.stamina;
        const maxMana = p.character.effective_base_mp ?? live.mana;
        const pColor = PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length];

        return (
            <div
                key={p.id}
                className="rpg-card text-center"
                style={{ '--accent': pColor, opacity: live.is_alive ? 1 : 0.45, padding: '0.6rem', width: 108, margin: '0 auto' }}
            >
                {isMain && (
                    <span className="rpg-element-badge d-block mb-1" style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.55rem' }}>
                        KAMU
                    </span>
                )}
                {subclass?.full_body_path ? (
                    <img
                        src={subclass.full_body_path}
                        alt={p.character.name}
                        style={{ width: 46, height: 92, objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 6, margin: '0 auto' }}
                    />
                ) : (
                    <div className="rpg-badge-hex mx-auto" style={{ '--accent': pColor, width: 46, height: 46, fontSize: '1rem' }}>
                        {p.character.name.charAt(0)}
                    </div>
                )}
                <div className="rpg-subclass-name text-truncate mt-1" style={{ fontSize: '0.72rem', color: pColor }}>
                    {p.character.name} {!live.is_alive && '☠'}
                </div>
                <div style={{ width: 80, margin: '0 auto' }}>
                    <Bar current={live.hp} max={maxHp} color="#b8433a" />
                    <div className="rpg-stat-label mt-1" style={{ fontSize: '0.55rem' }}><span>HP</span><span>{live.hp}</span></div>
                    <Bar current={live.stamina} max={maxStamina} color="#c98a3a" />
                    <div className="rpg-stat-label mt-1" style={{ fontSize: '0.55rem' }}><span>SP</span><span>{live.stamina}</span></div>
                    <Bar current={live.mana} max={maxMana} color="#7269d1" />
                    <div className="rpg-stat-label mt-1" style={{ fontSize: '0.55rem' }}><span>MP</span><span>{live.mana}</span></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
            <Head title={`Battle vs ${monster.name}`} />

            {/* Toolbar - full screen battle, gak ada nav sama sekali. Cuma 2 kontrol
                ini yang dibutuhkan: toggle suara & skip animasi. */}
            <div
                className="d-flex justify-content-between align-items-center"
                style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}
            >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    IndoRPG
                </span>
                <div className="d-flex gap-2">
                    <button
                        onClick={() => setSoundOn((s) => !s)}
                        className="btn btn-sm"
                        style={{
                            background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)', borderRadius: 6, fontSize: '0.8rem', padding: '0.35rem 0.7rem',
                        }}
                    >
                        {soundOn ? '🔊' : '🔇'}
                    </button>
                    {!finished && (
                        <button
                            onClick={skipToEnd}
                            className="btn btn-sm"
                            style={{
                                background: 'var(--bg-panel)', border: `1px solid ${MONSTER_COLOR}`,
                                color: MONSTER_COLOR, borderRadius: 6, fontSize: '0.8rem', padding: '0.35rem 0.9rem', fontWeight: 600,
                            }}
                        >
                            Lewati ▶▶
                        </button>
                    )}
                </div>
            </div>

            <div className="container py-4" style={{ maxWidth: 700 }}>
                {/* Baris atas: Party lain + Monster (auto-fit, reflow otomatis sesuai lebar layar).
                    Baris bawah: KAMU + Battle Log (selalu berdampingan, log tinggi fix + scroll internal). */}
                <div className="battle-top-row">
                    {otherParticipants.map((p) => renderPartyCard(p, false))}

                    <div
                        className="rpg-card text-center"
                        style={{ '--accent': MONSTER_COLOR, padding: '0.75rem', maxWidth: 220, margin: '0 auto' }}
                    >
                        {monster.full_body_path ? (
                            <img
                                src={monster.full_body_path}
                                alt={monster.name}
                                style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'contain', background: 'var(--bg-panel)', margin: '0 auto' }}
                            />
                        ) : (
                            <div className="rpg-badge-hex mx-auto" style={{ '--accent': MONSTER_COLOR, width: 84, height: 84, fontSize: '1.8rem' }}>
                                {monster.name.charAt(0)}
                            </div>
                        )}
                        <div className="rpg-subclass-name text-truncate mt-1" style={{ fontSize: '0.88rem' }}>{monster.name}</div>
                        <div className="rpg-power-type mb-1">Lv.{monster.level}</div>
                        <div style={{ width: 150, margin: '0 auto' }}>
                            <Bar current={current.monster_hp} max={monster.hp} color={MONSTER_COLOR} />
                            <div className="rpg-stat-label mt-1" style={{ fontSize: '0.6rem' }}><span>HP</span><span>{current.monster_hp}/{monster.hp}</span></div>
                        </div>
                    </div>
                </div>

                <div className="battle-bottom-row">
                    <div>{renderPartyCard(mainBattleParticipant, true)}</div>

                    <div>
                        <div className="rpg-skill-group-title">Battle Log</div>
                        <div className="rpg-card" style={{ '--accent': '#8890a4', fontSize: '0.85rem', height: 300, overflowY: 'auto' }}>
                            {visibleLog.map((entry, i) => (
                                <p key={i} className="mb-1" style={{ color: logLineColor(entry.text) }}>{entry.text}</p>
                            ))}
                            <div id="battle-log-end" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
