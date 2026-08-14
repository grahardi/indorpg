import { Link, Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Layout from '../../Layout';

export default function Show({ map, spawnPoints }) {
    const { props } = usePage();
    const [result, setResult] = useState(null);
    const [loadingId, setLoadingId] = useState(null);

    useEffect(() => {
        if (props.flash?.explore_result) {
            setResult(props.flash.explore_result);
            setLoadingId(null);
        }
    }, [props.flash]);

    function explore(spawnPointId) {
        setLoadingId(spawnPointId);
        setResult(null);
        router.post(route('spawn-points.explore', spawnPointId), {}, {
            preserveScroll: true,
        });
    }

    return (
        <Layout>
            <Head title={map.name} />
            <div className="container py-5">
                <Link href={route('maps.index')} className="rpg-back-link mb-4">
                    &larr; Peta
                </Link>

                <h1 className="rpg-class-title mt-4" style={{ fontSize: '1.9rem' }}>{map.name}</h1>
                <p className="rpg-class-desc mb-4">{map.description} &middot; Level {map.min_level}-{map.max_level}</p>

                {result && (
                    <div
                        className="rpg-card mb-4"
                        style={{ '--accent': result.status === 'encounter' ? '#b8433a' : '#5b6178' }}
                    >
                        {result.status === 'encounter' ? (
                            <div className="d-flex align-items-center gap-3">
                                <div className="rpg-badge-hex" style={{ '--accent': '#b8433a' }}>
                                    {result.monster.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="rpg-subclass-name">{result.message}</div>
                                    <div className="rpg-power-type">
                                        Lv.{result.monster.level} &middot; {result.monster.type} &middot; HP {result.monster.hp}
                                    </div>
                                </div>
                                <Link href={route('encounters.select', result.encounter_id)} className="rpg-back-link ms-auto">
                                    Mulai Battle
                                </Link>
                            </div>
                        ) : (
                            <p className="mb-0 text-secondary">{result.message}</p>
                        )}
                    </div>
                )}

                {/* Area peta - background placeholder sampai ada art peta beneran */}
                <div
                    style={{
                        position: 'relative',
                        aspectRatio: '16 / 9',
                        background: 'radial-gradient(circle at 30% 20%, #1e2230, var(--bg-panel) 70%)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        overflow: 'hidden',
                        marginBottom: '2rem',
                    }}
                >
                    {spawnPoints.map((sp) => (
                        <button
                            key={sp.id}
                            onClick={() => explore(sp.id)}
                            disabled={sp.on_cooldown || loadingId === sp.id}
                            title={sp.name}
                            style={{
                                position: 'absolute',
                                left: `${sp.pos_x}%`,
                                top: `${sp.pos_y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                border: '2px solid var(--text-primary)',
                                background: sp.on_cooldown ? 'var(--text-muted)' : '#b8433a',
                                cursor: sp.on_cooldown ? 'not-allowed' : 'pointer',
                                boxShadow: sp.on_cooldown ? 'none' : '0 0 12px rgba(184,67,58,0.7)',
                            }}
                        />
                    ))}
                </div>

                <div className="row g-3">
                    {spawnPoints.map((sp) => (
                        <div className="col-md-6 col-lg-3" key={sp.id}>
                            <div className="rpg-card" style={{ '--accent': sp.on_cooldown ? '#5b6178' : '#c9a24b' }}>
                                <div className="rpg-subclass-name">{sp.name}</div>
                                <p className="rpg-power-type mt-1 mb-2">
                                    {sp.monsters.map((m) => m.name).join(', ')}
                                </p>
                                <button
                                    className="btn btn-sm w-100"
                                    style={{ background: 'var(--bg-panel-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                                    onClick={() => explore(sp.id)}
                                    disabled={sp.on_cooldown || loadingId === sp.id}
                                >
                                    {loadingId === sp.id ? 'Menjelajah...' : sp.on_cooldown ? 'Cooldown' : 'Jelajahi'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
