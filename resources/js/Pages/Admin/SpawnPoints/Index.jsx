import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layout';

export default function Index({ map, spawnPoints }) {
    const { props } = usePage();

    function destroy(sp) {
        if (!confirm(`Hapus spawn point "${sp.name}"?`)) return;
        router.delete(route('admin.maps.spawn-points.destroy', [map.id, sp.id]));
    }

    return (
        <Layout>
            <Head title={`Spawn Points - ${map.name}`} />
            <div className="container py-5">
                <Link href={route('admin.maps.index')} className="rpg-back-link mb-3">&larr; Map</Link>
                <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Spawn Points: {map.name}</h1>
                    <Link href={route('admin.maps.spawn-points.create', map.id)} className="rpg-back-link" style={{ color: '#c9a24b' }}>
                        + Spawn Point Baru
                    </Link>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}

                <div className="row g-3">
                    {spawnPoints.map((sp) => (
                        <div className="col-md-6" key={sp.id}>
                            <div className="rpg-card" style={{ '--accent': '#c9a24b' }}>
                                <div className="rpg-subclass-name d-flex align-items-center gap-2">
                                    {sp.name}
                                    {sp.min_monster_level > 1 && (
                                        <span className="rpg-element-badge" style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.55rem' }}>
                                            🔒 Lv.{sp.min_monster_level}+
                                        </span>
                                    )}
                                </div>
                                <p className="rpg-power-type mt-1 mb-2">
                                    Posisi ({sp.pos_x}%, {sp.pos_y}%) &middot; Respawn {sp.respawn_seconds}s
                                </p>
                                <p className="text-secondary small mb-2">
                                    {sp.monsters.map((m) => `${m.name} (${m.pivot.weight})`).join(', ')}
                                </p>
                                <div className="d-flex gap-2">
                                    <Link href={route('admin.maps.spawn-points.edit', [map.id, sp.id])} className="rpg-back-link" style={{ fontSize: '0.78rem' }}>
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => destroy(sp)}
                                        className="rpg-back-link"
                                        style={{ fontSize: '0.78rem', color: '#b8433a', borderColor: '#b8433a', background: 'none' }}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
