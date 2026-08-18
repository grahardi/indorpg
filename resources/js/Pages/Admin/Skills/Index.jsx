import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layout';

export default function Index({ skills, subclasses, filterSubclassId }) {
    const { props } = usePage();

    function filterBySubclass(e) {
        router.get(route('admin.skills.index'), { subclass_id: e.target.value || undefined }, { preserveState: true });
    }

    return (
        <Layout>
            <Head title="Admin - Skill" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <h1 className="rpg-hero-title display-6 mb-0">Skill Editor</h1>
                    <div className="d-flex gap-3 align-items-center">
                        <Link href={route('admin.settings.index')} className="rpg-back-link">Settings</Link>
                        <Link href={route('admin.monsters.index')} className="rpg-back-link">Monster</Link>
                        <Link href={route('admin.maps.index')} className="rpg-back-link">Map</Link>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}

                <select
                    className="form-select bg-dark text-light border-secondary mb-3"
                    style={{ maxWidth: 280 }}
                    value={filterSubclassId || ''}
                    onChange={filterBySubclass}
                >
                    <option value="">Semua Subclass</option>
                    {subclasses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle" style={{ fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Subclass</th>
                                <th>Tier</th>
                                <th>Scaling</th>
                                <th>Attribute</th>
                                <th>Stun</th>
                                <th>Range</th>
                                <th>Multiplier</th>
                                <th>SP/MP Cost</th>
                                <th>Cooldown</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {skills.map((s) => (
                                <tr key={s.id}>
                                    <td className="rpg-subclass-name" style={{ fontSize: '0.9rem' }}>{s.name}</td>
                                    <td className="text-secondary">{s.subclass?.name}</td>
                                    <td>{s.tier === 3 ? 'Ultimate' : 'Biasa'}</td>
                                    <td>{s.scaling_stat}</td>
                                    <td className="text-secondary">{s.element?.name ?? '-'}</td>
                                    <td>{s.can_stun ? <span style={{ color: '#c9a24b' }}>⚡ Ya</span> : <span className="text-secondary">-</span>}</td>
                                    <td>{s.combat_range}</td>
                                    <td>{s.base_multiplier}</td>
                                    <td>{s.stamina_cost}/{s.mana_cost}</td>
                                    <td>{s.cooldown_seconds}s</td>
                                    <td className="text-end">
                                        <Link href={route('admin.skills.edit', s.id)} className="rpg-back-link" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
