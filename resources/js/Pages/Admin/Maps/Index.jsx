import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layout';

export default function Index({ maps }) {
    const { props } = usePage();

    function destroy(map) {
        if (!confirm(`Hapus map "${map.name}"?\n\nPERINGATAN: ini juga ngehapus SEMUA spawn point di map ini (relasi cascade).`)) return;
        router.delete(route('admin.maps.destroy', map.id));
    }

    return (
        <Layout>
            <Head title="Admin - Map" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Map Editor</h1>
                    <div className="d-flex gap-3 align-items-center">
                        <Link href={route('admin.settings.index')} className="rpg-back-link">Settings</Link>
                        <Link href={route('admin.monsters.index')} className="rpg-back-link">Monster</Link>
                        <Link href={route('admin.skills.index')} className="rpg-back-link">Skill</Link>
                        <Link href={route('admin.items.index')} className="rpg-back-link">Item</Link>
                        <Link href={route('admin.maps.create')} className="rpg-back-link" style={{ color: '#c9a24b' }}>+ Map Baru</Link>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}

                <div className="row g-3">
                    {maps.map((m) => (
                        <div className="col-md-6" key={m.id}>
                            <div className="rpg-card" style={{ '--accent': '#c9a24b' }}>
                                <div className="d-flex align-items-center gap-3">
                                    {m.background_path && (
                                        <img src={m.background_path} alt={m.name} style={{ width: 70, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                                    )}
                                    <div className="flex-grow-1">
                                        <div className="rpg-subclass-name">{m.name}</div>
                                        <div className="rpg-power-type">
                                            Lv.{m.min_level}-{m.max_level} &middot; {m.spawn_points_count} spawn point
                                        </div>
                                    </div>
                                </div>
                                <div className="d-flex gap-2 mt-3">
                                    <Link href={route('admin.maps.spawn-points.index', m.id)} className="rpg-back-link" style={{ fontSize: '0.78rem' }}>
                                        Spawn Points
                                    </Link>
                                    <Link href={route('admin.maps.edit', m.id)} className="rpg-back-link" style={{ fontSize: '0.78rem' }}>
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => destroy(m)}
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
