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

export default function Show({ battle, battleBackground }) {
    const { props } = usePage();
    const currentUserId = props.auth?.user?.id;
    const monster = battle.monster;
    const log = battle.battle_log || [];

    // Level & stat monster yang beneran dipakai battle ini (udah di-scale
    // sesuai level encounter) - fallback ke stat statis monster kalau battle
    // lama (dibuat sebelum fitur level dinamis ada, monster_level-nya null).
    const monsterLevel = battle.monster_level ?? monster.level;
    const monsterMaxHp = battle.monster_stats?.hp ?? monster.hp;
    const monsterExpReward = battle.monster_stats?.exp_reward ?? monster.exp_reward;

    const [step, setStep] = useState(0);
    const [finished, setFinished] = useState(log.length <= 1);
    const [soundOn, setSoundOn] = useState(true);
    const [redirectIn, setRedirectIn] = useState(null);
    const [userSkipped, setUserSkipped] = useState(false);
    const timerRef = useRef(null);
    const finishedSoundPlayed = useRef(false);
    const logBoxRef = useRef(null);

    // Status yang beneran ditampilin - kalau user klik Lewati, dianggap
    // "menyerah" (gak nunggu hasil), TERLEPAS dari status asli battle di
    // database. Catatan: EXP/reward battle yang sebenarnya udah kepotong dari
    // awal (battle di-resolve penuh di server sebelum halaman ini kebuka),
    // jadi ini murni override tampilan doang - reward yang beneran gak berubah.
    const displayStatus = userSkipped ? 'fled' : battle.status;

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

    // Auto-scroll KE DALAM box log doang (bukan scrollIntoView, yang ternyata
    // ikut nge-scroll seluruh halaman kalau box-nya deket tepi viewport) -
    // biar posisi halaman/toolbar gak ikut geser tiap baris log baru muncul.
    useEffect(() => {
        if (logBoxRef.current) {
            logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
        }
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

    // Suara menang/kalah, sekali doang pas animasi kelar. Gak bunyi kalau
    // user nge-skip (dianggap menyerah, gak ada suara menang/kalah).
    useEffect(() => {
        if (!finished || finishedSoundPlayed.current || !soundOn || userSkipped) return;
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
        setUserSkipped(true);
    }

    const current = log[step] || { monster_hp: battle.monster_current_hp, participants: {} };
    const visibleLog = log.slice(0, step + 1);

    // Skill animation (GIF) yang lagi aktif di step ini, kalau skill yang dipakai
    // punya animation_path. Ilang otomatis pas step ganti (gak di-track manual).
    const activeAnimation = useMemo(() => {
        if (!current.skill_id || !current.actor_character_id) return null;
        const participant = battle.participants.find((p) => p.character_id === current.actor_character_id);
        if (!participant) return null;
        const skill = participant.character.subclass?.skills?.find((s) => s.id === current.skill_id);
        if (!skill?.animation_path) return null;
        return { path: skill.animation_path, characterId: current.actor_character_id };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

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
                <Head title={displayStatus === 'won' ? 'Menang!' : displayStatus === 'lost' ? 'Kalah' : 'Mundur'} />
                <div className="container py-5" style={{ maxWidth: 560 }}>
                    <div className="rpg-card text-center" style={{ '--accent': displayStatus === 'won' ? '#c9a24b' : displayStatus === 'lost' ? '#5b6178' : '#8890a4', padding: '2rem 1.5rem' }}>
                        {(displayStatus === 'won' || displayStatus === 'lost') && (
                            <div className="d-flex align-items-center justify-content-center gap-3 gap-md-4 mb-4 flex-wrap">
                                <div style={{ width: 130, position: 'relative' }}>
                                    {mainSubclass?.full_body_path ? (
                                        <img
                                            src={mainSubclass.full_body_path}
                                            alt={mainParticipant.character.name}
                                            style={{
                                                width: '100%', aspectRatio: '1 / 2', objectFit: 'contain',
                                                background: 'var(--bg-panel)', borderRadius: 10,
                                                border: `2px solid ${displayStatus === 'lost' ? '#5b6178' : mainColor}`,
                                                filter: displayStatus === 'lost' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': mainColor, width: 90, height: 90, fontSize: '2rem', filter: displayStatus === 'lost' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {mainParticipant.character.name.charAt(0)}
                                        </div>
                                    )}
                                    {displayStatus === 'lost' && (
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
                                    <div className="mt-2" style={{ color: displayStatus === 'lost' ? 'var(--text-muted)' : mainColor, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
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
                                                border: `2px solid ${displayStatus === 'won' ? '#5b6178' : MONSTER_COLOR}`,
                                                filter: displayStatus === 'won' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': MONSTER_COLOR, width: 90, height: 90, fontSize: '2rem', filter: displayStatus === 'won' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {monster.name.charAt(0)}
                                        </div>
                                    )}
                                    {displayStatus === 'won' && (
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
                                    <div className="mt-2" style={{ color: displayStatus === 'won' ? 'var(--text-muted)' : MONSTER_COLOR, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {monster.name}
                                    </div>
                                </div>
                            </div>
                        )}

                        {displayStatus === 'fled' && (
                            <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>🏳️</div>
                        )}

                        <div className="rpg-subclass-name" style={{ fontSize: '1.5rem' }}>
                            {displayStatus === 'won' && '🏆 Menang!'}
                            {displayStatus === 'lost' && '💀 Kalah...'}
                            {displayStatus === 'fled' && 'Party Menyerah'}
                        </div>
                        {displayStatus === 'fled' && (
                            <p className="text-secondary small mt-1 mb-0">Pertarungan kelamaan, party mundur teratur.</p>
                        )}

                        {displayStatus === 'won' && (
                            <div className="mt-3">
                                <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem' }}>Hadiah</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#c9a24b' }}>
                                    +{monsterExpReward} EXP <span className="rpg-power-type" style={{ fontSize: '0.85rem' }}>/ karakter</span>
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

    // ===== LAYAR BATTLE BERJALAN (animasi playback) - arena scene =====
    const participantCount = battle.participants.length;

    function renderArenaFighter(p, index, isMain) {
        const live = current.participants[p.character_id] || {
            hp: p.current_hp, is_alive: p.is_alive,
        };
        const subclass = p.character.subclass;
        const maxHp = p.character.effective_base_hp ?? live.hp;
        const pColor = PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
        const leftPct = ((index + 1) / (participantCount + 1)) * 100;

        const isAnimating = activeAnimation?.characterId === p.character_id;
        const idleImage = subclass?.battle_idle_path || subclass?.full_body_path;

        return (
            <div
                key={p.id}
                style={{
                    position: 'absolute', bottom: '3%', left: `${leftPct}%`, transform: 'translateX(-50%)',
                    width: '24%', textAlign: 'center', opacity: live.is_alive ? 1 : 0.4,
                }}
            >
                {isMain && (
                    <span
                        className="rpg-element-badge d-inline-block mb-1"
                        style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.55rem', background: 'rgba(11,12,18,0.75)' }}
                    >
                        KAMU
                    </span>
                )}
                <div style={{ width: '75%', margin: '0 auto 3px' }}>
                    <Bar current={live.hp} max={maxHp} color="#b8433a" />
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: pColor,
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginBottom: 2,
                    }}
                >
                    {p.character.name} {!live.is_alive && '☠'}
                </div>
                {/* GIF gantiin pose idle pas skill dipakai (bukan numpuk) - ukuran &
                    posisi udah di-sync sama kanvas 364x360 yang sama. */}
                {isAnimating ? (
                    <img
                        src={activeAnimation.path}
                        alt="skill"
                        style={{ width: '100%', maxHeight: 110, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                    />
                ) : idleImage ? (
                    <img
                        src={idleImage}
                        alt={p.character.name}
                        style={{ width: '100%', maxHeight: 110, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                    />
                ) : (
                    <div className="rpg-badge-hex mx-auto" style={{ '--accent': pColor, width: 44, height: 44, fontSize: '1rem' }}>
                        {p.character.name.charAt(0)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
            <Head title={`Battle vs ${monster.name}`} />

            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    IndoRPG
                </span>
            </div>

            <div className="container py-4" style={{ maxWidth: 700 }}>
                {/* Arena: background scene sesuai tema map, monster gede di belakang,
                    party di depan dikroyok - cuma 1 bar (HP) per karakter/monster. */}
                <div
                    style={{
                        position: 'relative', width: '100%', aspectRatio: '1024 / 571',
                        backgroundImage: `url('${battleBackground}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                        borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: '1rem',
                    }}
                >
                    {/* Monster - lebih besar, di belakang/tengah */}
                    <div style={{ position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)', width: '42%', textAlign: 'center' }}>
                        <div style={{ width: '65%', margin: '0 auto 3px' }}>
                            <Bar current={current.monster_hp} max={monsterMaxHp} color={MONSTER_COLOR} />
                        </div>
                        <div
                            style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: MONSTER_COLOR,
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginBottom: 2,
                            }}
                        >
                            {monster.name} · Lv.{monsterLevel}
                        </div>
                        {monster.full_body_path ? (
                            <img
                                src={monster.full_body_path}
                                alt={monster.name}
                                style={{ width: '100%', maxHeight: 190, objectFit: 'contain', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}
                            />
                        ) : (
                            <div className="rpg-badge-hex mx-auto" style={{ '--accent': MONSTER_COLOR, width: 84, height: 84, fontSize: '1.8rem' }}>
                                {monster.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Party - lebih kecil, di depan/bawah, dikroyok ke arah monster */}
                    {battle.participants.map((p, i) => renderArenaFighter(p, i, p.character.user_id === currentUserId))}
                </div>

                {/* Battle Log */}
                <div className="rpg-skill-group-title">Battle Log</div>
                <div ref={logBoxRef} className="rpg-card" style={{ '--accent': '#8890a4', fontSize: '0.85rem', height: 300, overflowY: 'auto' }}>
                    {visibleLog.map((entry, i) => (
                        <p key={i} className="mb-1" style={{ color: logLineColor(entry.text) }}>{entry.text}</p>
                    ))}
                </div>

                {/* Toolbar di bawah - bukan di atas, biar gak ketutup pas battle log auto-scroll */}
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <button
                        onClick={() => setSoundOn((s) => !s)}
                        className="btn btn-sm"
                        style={{
                            background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)', borderRadius: 6, fontSize: '0.8rem', padding: '0.4rem 0.9rem',
                        }}
                    >
                        {soundOn ? '🔊 Suara' : '🔇 Suara'}
                    </button>
                    {!finished && (
                        <button
                            onClick={skipToEnd}
                            className="btn btn-sm"
                            style={{
                                background: 'var(--bg-panel)', border: `1px solid ${MONSTER_COLOR}`,
                                color: MONSTER_COLOR, borderRadius: 6, fontSize: '0.8rem', padding: '0.4rem 1rem', fontWeight: 600,
                            }}
                        >
                            Lewati ▶▶
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
