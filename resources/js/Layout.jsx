import { Link } from '@inertiajs/react';

export default function Layout({ children }) {
    return (
        <div>
            <nav
                style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(11,12,18,0.85)',
                    backdropFilter: 'blur(6px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                }}
            >
                <div className="container d-flex align-items-center justify-content-between py-3">
                    <Link
                        href={route('classes.index')}
                        className="text-decoration-none"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}
                    >
                        IndoRPG
                    </Link>
                    <div className="d-flex gap-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        <Link href={route('classes.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Codex
                        </Link>
                        <Link href={route('characters.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Karakter
                        </Link>
                        <Link href={route('monsters.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Monster
                        </Link>
                        <Link href={route('characters.create')} className="text-decoration-none" style={{ color: 'var(--accent-saint)' }}>
                            + Karakter Baru
                        </Link>
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
}
