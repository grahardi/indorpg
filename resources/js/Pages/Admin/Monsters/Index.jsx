import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layout';

export default function Index({ monsters }) {
    const { props } = usePage();

    function destroy(monster) {
        if (!confirm(`Hapus monster "${monster.name}"?\n\nPERINGATAN: ini juga bakal ikut menghapus SEMUA encounter & battle history yang pernah lawan monster ini (relasi database di-cascade). Kalau cuma mau monster ini gak dipakai lagi tanpa hilangin histori, edit statnya jadi gak dipasang di spawn point manapun aja, jangan dihapus.`)) return;
        router.delete(route('admin.monsters.destroy', monster.id));
    }

    return (
        <Layout>
            <Head title="Admin - Monster" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Monster Editor</h1>
                    <div className="d-flex gap-3 align-items-center">
                        <Link href={route('admin.settings.index')} className="rpg-back-link">Settings</Link>
                        <Link href={route('admin.skills.index')} className="rpg-back-link">Skill</Link>
                        <Link href={route('admin.maps.index')} className="rpg-back-link">Map</Link>
                        <Link href={route('admin.monsters.create')} className="rpg-back-link" style={{ color: '#c9a24b' }}>+ Monster Baru</Link>
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
                                <th>Kelas</th>
                                <th>Lv</th>
                                <th>Type</th>
                                <th>Elemen</th>
                                <th>HP</th>
                                <th>PATK</th>
                                <th>MATK</th>
                                <th>EXP</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {monsters.map((m) => (
                                <tr key={m.id}>
                                    <td className="rpg-subclass-name" style={{ fontSize: '0.9rem' }}>{m.name}</td>
                                    <td style={{ color: '#c9a24b', fontWeight: 700 }}>{m.class_rank}</td>
                                    <td>{m.level}</td>
                                    <td>{m.type}</td>
                                    <td>{m.element?.name ?? '-'}</td>
                                    <td>{m.hp}</td>
                                    <td>{m.physical_damage}</td>
                                    <td>{m.magic_damage}</td>
                                    <td>{m.exp_reward}</td>
                                    <td className="text-end">
                                        <Link href={route('admin.monsters.edit', m.id)} className="rpg-back-link me-2" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => destroy(m)}
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
