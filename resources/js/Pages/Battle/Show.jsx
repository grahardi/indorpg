import { Link, Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Layout from '../../Layout';

function HpBar({ current, max, color }) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    return (
        <div className="rpg-stat-track" style={{ height: 8 }}>
            <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

export default function Show({ battle }) {
    const monster = battle.monster;
    const [selections, setSelections] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [battle.battle_log]);

    const aliveParticipants = battle.participants.filter((p) => p.is_alive);
    const isOngoing = battle.status === 'ongoing';

    function pickSkill(characterId, skillId) {
        setSelections((prev) => ({ ...prev, [characterId]: skillId }));
    }

    function submitRound() {
        setSubmitting(true);
        router.post(route('battles.action', battle.id), { actions: selections }, {
            onFinish: () => {
                setSubmitting(false);
                setSelections({});
            },
        });
    }

    function flee() {
        router.post(route('battles.flee', battle.id));
    }

    const allSelected = aliveParticipants.every((p) => selections[p.character_id]);

    return (
        <Layout>
            <Head title={`Battle vs ${monster.name}`} />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                {/* Monster */}
                <div className="rpg-card mb-4" style={{ '--accent': '#b8433a' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="rpg-subclass-name" style={{ fontSize: '1.2rem' }}>{monster.name}</div>
                        <span className="rpg-power-type">Ronde {battle.round_number}</span>
                    </div>
                    <HpBar current={battle.monster_current_hp} max={monster.hp} color="#b8433a" />
                    <div className="rpg-stat-label mt-1"><span>HP</span><span>{battle.monster_current_hp} / {monster.hp}</span></div>
                </div>

                {/* Status */}
                {battle.status !== 'ongoing' && (
                    <div className="rpg-card mb-4 text-center" style={{ '--accent': battle.status === 'won' ? '#c9a24b' : '#5b6178' }}>
                        <div className="rpg-subclass-name" style={{ fontSize: '1.3rem' }}>
                            {battle.status === 'won' && '🏆 Menang!'}
                            {battle.status === 'lost' && '💀 Kalah...'}
                            {battle.status === 'fled' && '🏃 Kabur dari pertarungan.'}
                        </div>
                        <Link href={route('maps.index')} className="rpg-back-link mt-3 d-inline-block">
                            Kembali ke Peta
                        </Link>
                    </div>
                )}

                {/* Party */}
                <div className="row g-3 mb-4">
                    {battle.participants.map((p) => (
                        <div className="col-md-4" key={p.id}>
                            <div className="rpg-card h-100" style={{ '--accent': p.is_alive ? '#3f8c94' : '#5b6178', opacity: p.is_alive ? 1 : 0.5 }}>
                                <div className="rpg-subclass-name" style={{ fontSize: '0.95rem' }}>
                                    {p.character.name} {!p.is_alive && '(Tumbang)'}
                                </div>
                                <div className="rpg-power-type mb-2">{p.character.subclass?.name}</div>
                                <HpBar current={p.current_hp} max={p.character.subclass?.gameClass?.base_hp ?? p.current_hp} color="#3f8c94" />
                                <div className="rpg-stat-label mt-1"><span>HP</span><span>{p.current_hp}</span></div>
                                <div className="rpg-skill-cost mt-1">
                                    <span>⚡ {p.current_stamina}</span>
                                    <span>🔷 {p.current_mana}</span>
                                </div>

                                {isOngoing && p.is_alive && (
                                    <select
                                        className="form-select form-select-sm bg-dark text-light border-secondary mt-2"
                                        value={selections[p.character_id] || ''}
                                        onChange={(e) => pickSkill(p.character_id, e.target.value)}
                                    >
                                        <option value="">-- pilih skill --</option>
                                        {p.character.subclass?.skills?.map((s) => (
                                            <option value={s.id} key={s.id}>
                                                {s.name} ({s.stamina_cost > 0 ? `${s.stamina_cost} STA` : `${s.mana_cost} MP`})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isOngoing && (
                    <div className="d-flex gap-2 mb-4">
                        <button
                            className="btn btn-outline-light flex-grow-1"
                            onClick={submitRound}
                            disabled={!allSelected || submitting}
                        >
                            {submitting ? 'Memproses...' : 'Jalankan Ronde'}
                        </button>
                        <button className="btn btn-outline-secondary" onClick={flee} disabled={submitting}>
                            Kabur
                        </button>
                    </div>
                )}

                {/* Battle Log */}
                <div className="rpg-skill-group-title">Battle Log</div>
                <div
                    className="rpg-card"
                    style={{ '--accent': '#8890a4', maxHeight: 220, overflowY: 'auto', fontSize: '0.85rem' }}
                >
                    {(battle.battle_log || []).map((line, i) => (
                        <p key={i} className="mb-1 text-secondary">{line}</p>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </Layout>
    );
}
