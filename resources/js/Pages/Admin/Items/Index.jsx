import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layout';

const RARITY_LABEL = { common: 'Common', rare: 'Rare', sr: 'SR', ur: 'UR', legendary: 'Legendary' };
const CATEGORY_LABEL = { artifact: 'Artifact', accession: 'Accession (Catalyst)', material: 'Material' };
const CATEGORY_COLOR = { artifact: 'var(--text-secondary)', accession: '#8b5cf6', material: '#4a9960' };

export default function Index({ items }) {
    const { props } = usePage();

    function destroy(item) {
        if (!confirm(`Hapus item "${item.name}"? Item yang udah dimiliki/di-equip karakter juga ikut kehapus.`)) return;
        router.delete(route('admin.items.destroy', item.id));
    }

    return (
        <Layout>
            <Head title="Admin - Item" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Item Editor</h1>
                    <div className="d-flex gap-3 align-items-center">
                        <Link href={route('admin.settings.index')} className="rpg-back-link">Settings</Link>
                        <Link href={route('admin.monsters.index')} className="rpg-back-link">Monster</Link>
                        <Link href={route('admin.skills.index')} className="rpg-back-link">Skill</Link>
                        <Link href={route('admin.maps.index')} className="rpg-back-link">Map</Link>
                        <Link href={route('admin.items.create')} className="rpg-back-link" style={{ color: '#c9a24b' }}>+ Item Baru</Link>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle" style={{ fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kategori</th>
                                <th>Rarity</th>
                                <th>Harga</th>
                                <th>Efek</th>
                                <th>Drop Rate</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((i) => (
                                <tr key={i.id}>
                                    <td className="rpg-subclass-name" style={{ fontSize: '0.9rem' }}>{i.name}</td>
                                    <td style={{ color: CATEGORY_COLOR[i.category] ?? 'inherit', fontSize: '0.82rem' }}>
                                        {CATEGORY_LABEL[i.category] ?? i.category}
                                    </td>
                                    <td>{RARITY_LABEL[i.rarity]}</td>
                                    <td>{i.price} Gold</td>
                                    <td>{i.category === 'artifact' ? `+${i.effect_value} ${i.effect_stat}` : <span className="text-secondary">—</span>}</td>
                                    <td>{i.drop_rate}%</td>
                                    <td className="text-end">
                                        <Link href={route('admin.items.edit', i.id)} className="rpg-back-link me-2" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => destroy(i)}
                                            className="rpg-back-link"
                                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', color: '#b8433a', borderColor: '#b8433a', background: 'none' }}
                                        >
                                            Hapus
                                        </button>
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
