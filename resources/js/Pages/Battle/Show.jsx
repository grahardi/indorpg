import { Link, Head } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import Layout from '../../Layout';

function Bar({ current, max, color }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    return (
        <div className="rpg-stat-track" style={{ height: 6 }}>
            <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
        </div>
    );
}

export default function Show({ battle }) {
    const monster = battle.monster;
    const log = battle.battle_log || [];

    const [step, setStep] = useState(0);
    const [finished, setFinished] = useState(log.length <= 1);
    const timerRef = useRef(null);

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

    function skipToEnd() {
        clearTimeout(timerRef.current);
        setStep(log.length - 1);
        setFinished(true);
    }

    const current = log[step] || { monster_hp: battle.monster_current_hp, participants: {} };
    const visibleLog = log.slice(0, step + 1);

    return (
        <Layout>
            <Head title={`Battle vs ${monster.name}`} />
            <div className="container py-5" style={{ maxWidth: 900 }}>
                {/* Monster panel */}
                <div className="rpg-card mb-4" style={{ '--accent': '#b8433a' }}>
                    <div className="d-flex align-items-center gap-3">
                        {monster.avatar_path ? (
                            <img src={monster.avatar_path} alt={monster.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #b8433a' }} />
                        ) : (
                            <div className="rpg-badge-hex" style={{ '--accent': '#b8433a', width: 56, height: 56, fontSize: '1.3rem' }}>
                                {monster.name.charAt(0)}
                            </div>
                        )}
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                                <div className="rpg-subclass-name" style={{ fontSize: '1.1rem' }}>{monster.name}</div>
                                <span className="rpg-power-type">Lv.{monster.level}</span>
                            </div>
                            <Bar current={current.monster_hp} max={monster.hp} color="#b8433a" />
                            <div className="rpg-stat-label mt-1"><span>HP</span><span>{current.monster_hp} / {monster.hp}</span></div>
                        </div>
                    </div>
                </div>

                {/* Result banner */}
                {finished && battle.status !== 'ongoing' && (
                    <div className="rpg-card mb-4 text-center" style={{ '--accent': battle.status === 'won' ? '#c9a24b' : '#5b6178' }}>
                        <div className="rpg-subclass-name" style={{ fontSize: '1.3rem' }}>
                            {battle.status === 'won' && '🏆 Menang!'}
                            {battle.status === 'lost' && '💀 Kalah...'}
                            {battle.status === 'fled' && '🏃 Party mundur.'}
                        </div>
                        <div className="d-flex gap-2 justify-content-center mt-3">
                            <Link href={route('guild.index')} className="rpg-back-link">Kembali ke Guild</Link>
                            <Link href={route('maps.index')} className="rpg-back-link">Peta</Link>
                        </div>
                    </div>
                )}

                {!finished && (
                    <div className="text-end mb-3">
                        <button className="rpg-back-link" onClick={skipToEnd} style={{ background: 'none' }}>
                            Lewati ▶▶
                        </button>
                    </div>
                )}

                {/* Party columns */}
                <div className="row g-3 mb-4">
                    {battle.participants.map((p) => {
                        const live = current.participants[p.character_id] || {
                            hp: p.current_hp, stamina: p.current_stamina, mana: p.current_mana, is_alive: p.is_alive,
                        };
                        const subclass = p.character.subclass;
                        const maxHp = subclass?.base_hp ?? live.hp;
                        const maxStamina = subclass?.base_sp ?? live.stamina;
                        const maxMana = subclass?.base_mp ?? live.mana;

                        return (
                            <div className="col-md-4" key={p.id}>
                                <div className="rpg-card h-100" style={{ '--accent': '#3f8c94', opacity: live.is_alive ? 1 : 0.45 }}>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {p.character.subclass?.avatar_path ? (
                                            <img src={p.character.subclass?.avatar_path} alt={p.character.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="rpg-badge-hex" style={{ '--accent': '#3f8c94', width: 40, height: 40, fontSize: '0.9rem' }}>
                                                {p.character.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="rpg-subclass-name" style={{ fontSize: '0.9rem' }}>
                                                {p.character.name} {!live.is_alive && '☠'}
                                            </div>
                                            <div className="rpg-power-type">{subclass?.name}</div>
                                        </div>
                                    </div>

                                    <Bar current={live.hp} max={maxHp} color="#b8433a" />
                                    <div className="rpg-stat-label mt-1 mb-2"><span>HP</span><span>{live.hp}</span></div>
                                    <Bar current={live.stamina} max={maxStamina} color="#c98a3a" />
                                    <div className="rpg-stat-label mt-1 mb-2"><span>SP</span><span>{live.stamina}</span></div>
                                    <Bar current={live.mana} max={maxMana} color="#7269d1" />
                                    <div className="rpg-stat-label mt-1"><span>MP</span><span>{live.mana}</span></div>

                                    <div className="rpg-skill-group-title mt-3 mb-1" style={{ fontSize: '0.65rem' }}>Skill Pool</div>
                                    <div className="d-flex flex-wrap gap-1">
                                        {subclass?.skills?.slice(0, 6).map((s) => (
                                            <span
                                                key={s.id}
                                                className="rpg-element-badge"
                                                style={{ '--accent': '#8890a4', fontSize: '0.62rem' }}
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Battle Log */}
                <div className="rpg-skill-group-title">Battle Log</div>
                <div className="rpg-card" style={{ '--accent': '#8890a4', maxHeight: 240, overflowY: 'auto', fontSize: '0.85rem' }}>
                    {visibleLog.map((entry, i) => (
                        <p key={i} className="mb-1 text-secondary">{entry.text}</p>
                    ))}
                    <div id="battle-log-end" />
                </div>
            </div>
        </Layout>
    );
}
