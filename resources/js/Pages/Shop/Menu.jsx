import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

export default function Menu() {
    const [hovered, setHovered] = useState(null);

    // Posisi hotspot dalam PERSEN (relatif ke gambar 1376x768) - divalidasi
    // visual (generate overlay kotak warna di atas gambar asli, dicek match
    // sama tombol kayunya) sebelum di-finalize, sama polanya kayak Town Hub.
    const hotspots = [
        { id: 'item-saya', label: 'Item Saya', href: route('accession.index'), style: { left: '57%', top: '15%', width: '38%', height: '20%' } },
        { id: 'artifak', label: 'Beli Artifak Item', href: route('shop.category', 'artifact'), style: { left: '57%', top: '40%', width: '38%', height: '20%' } },
        { id: 'accession', label: 'Beli Accession Item', href: route('shop.category', 'accession'), style: { left: '57%', top: '65%', width: '38%', height: '20%' } },
    ];

    return (
        <Layout>
            <Head title="Shop" />
            <div className="container py-4">
                <div className="text-center mb-3">
                    <h1 className="rpg-hero-title display-6 mb-1">Hujan's Trading Post</h1>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Klik salah satu papan buat mulai.</p>
                </div>

                <div
                    className="mx-auto position-relative"
                    style={{ maxWidth: 1000, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                >
                    <img src="/images/ui/shop-menu-bg.jpg" alt="Hujan's Trading Post" style={{ width: '100%', display: 'block' }} />

                    {hotspots.map((h) => (
                        <Link
                            key={h.id}
                            href={h.href}
                            onMouseEnter={() => setHovered(h.id)}
                            onMouseLeave={() => setHovered((cur) => (cur === h.id ? null : cur))}
                            style={{
                                position: 'absolute',
                                ...h.style,
                                border: hovered === h.id ? '2px solid #fff' : '2px solid transparent',
                                background: hovered === h.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: 10,
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                            }}
                            aria-label={h.label}
                        />
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
