import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

export default function TownHub() {
    const { props } = usePage();
    const user = props.auth?.user;
    const [hovered, setHovered] = useState(null);

    // Posisi hotspot dalam persen (relatif ke gambar 1376x768), biar tetap
    // presisi walau gambar di-resize responsive.
    const hotspots = [
        {
            id: 'guild',
            label: 'Adventure Guild',
            desc: 'Pilih party & mulai battle',
            href: route('guild.index'),
            style: { left: '31%', top: '6%', width: '32%', height: '52%' },
        },
        {
            id: 'shop',
            label: 'Shop',
            desc: 'Belanja item pakai Gold',
            href: route('shop.index'),
            style: { left: '0%', top: '58%', width: '36%', height: '42%' },
        },
        {
            id: 'adventure',
            label: 'Pergi Adventure',
            desc: 'Jelajahi peta & lawan monster',
            href: route('maps.index'),
            style: { left: '59%', top: '2%', width: '21%', height: '35%' },
        },
        {
            id: 'inn',
            label: 'Penginapan',
            desc: 'Atur karakter & roster kamu',
            href: route('characters.index'),
            style: { left: '0%', top: '10%', width: '33%', height: '32%' },
        },
        {
            id: 'party',
            label: 'Guild Party',
            desc: 'Segera hadir: bikin party tetap, auto-adventure (skip). Sementara atur party langsung di Guild.',
            href: route('guild.index'),
            style: { left: '68%', top: '42%', width: '32%', height: '58%' },
        },
    ];

    return (
        <Layout>
            <Head title="Depan" />
            <div className="container py-4">
                <div className="text-center mb-3">
                    <h1 className="rpg-hero-title display-6 mb-1">
                        {user ? `Selamat datang, ${user.username}` : 'IndoRPG'}
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                        Klik salah satu bangunan buat mulai.
                    </p>
                </div>

                <div
                    className="mx-auto position-relative"
                    style={{ maxWidth: 1100, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                >
                    <img
                        src="/images/ui/town-hub.jpg"
                        alt="Town Hub"
                        style={{ width: '100%', display: 'block' }}
                    />

                    {hotspots.map((h) => (
                        <Link
                            key={h.id}
                            href={h.href}
                            onMouseEnter={() => setHovered(h.id)}
                            onMouseLeave={() => setHovered((cur) => (cur === h.id ? null : cur))}
                            style={{
                                position: 'absolute',
                                ...h.style,
                                border: hovered === h.id ? '2px solid #c9a24b' : '2px solid transparent',
                                background: hovered === h.id ? 'rgba(201,162,75,0.18)' : 'transparent',
                                borderRadius: 10,
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                            }}
                            aria-label={h.label}
                        />
                    ))}

                    {hotspots.map((h) => hovered === h.id && (
                        <div
                            key={`label-${h.id}`}
                            className="position-absolute"
                            style={{
                                left: h.style.left, top: `calc(${h.style.top} - 6px)`,
                                transform: 'translateY(-100%)',
                                background: 'rgba(11,12,18,0.92)',
                                border: '1px solid #c9a24b',
                                borderRadius: 8,
                                padding: '0.5rem 0.75rem',
                                maxWidth: 260,
                                pointerEvents: 'none',
                                zIndex: 10,
                            }}
                        >
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#c9a24b', fontSize: '0.9rem' }}>
                                {h.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {h.desc}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="d-flex justify-content-center gap-4 mt-3 flex-wrap" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {hotspots.map((h) => (
                        <Link key={h.id} href={h.href} className="text-decoration-none" style={{ color: hovered === h.id ? '#c9a24b' : 'var(--text-muted)' }}>
                            {h.label}
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
