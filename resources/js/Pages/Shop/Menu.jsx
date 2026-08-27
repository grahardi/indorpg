import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Menu() {
    const menuItems = [
        {
            href: route('accession.index'),
            icon: '🎒',
            label: 'Item Saya',
            desc: 'Lihat semua item kamu, kelola equip, dan level-up Accession Item.',
            accent: '#4a90e2',
        },
        {
            href: route('shop.category', 'artifact'),
            icon: '🗿',
            label: 'Beli Artifact Item',
            desc: 'Item standar - bonus stat langsung, gak bisa di-level.',
            accent: '#e8c547',
        },
        {
            href: route('shop.category', 'accession'),
            icon: '💠',
            label: 'Beli Accession Item',
            desc: 'Item spesial - bisa di-level sampai 100, makin kuat makin lama dipakai.',
            accent: '#8b5cf6',
        },
    ];

    return (
        <Layout>
            <Head title="Shop" />
            <div className="container py-5" style={{ maxWidth: 640 }}>
                <h1 className="rpg-hero-title display-5 mb-2">Shop</h1>
                <p className="rpg-tagline mb-5">Belanja perlengkapan, atau kelola & level-up item yang udah kamu punya.</p>

                <div className="d-flex flex-column gap-3">
                    {menuItems.map((m) => (
                        <Link
                            key={m.label}
                            href={m.href}
                            className="rpg-card text-decoration-none d-flex align-items-center gap-3"
                            style={{ '--accent': m.accent, padding: '1.25rem' }}
                        >
                            <div
                                style={{
                                    width: 56, height: 56, borderRadius: 12, background: 'var(--bg-panel-hover)',
                                    border: `2px solid ${m.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.6rem', flexShrink: 0,
                                }}
                            >
                                {m.icon}
                            </div>
                            <div>
                                <div className="rpg-subclass-name" style={{ fontSize: '1.1rem', color: m.accent }}>{m.label}</div>
                                <p className="text-secondary small mb-0">{m.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
