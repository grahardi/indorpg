import { Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

function NavDropdown({ label, labelHref, items, accent = 'var(--text-secondary)' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Link href={labelHref} className="text-decoration-none" style={{ color: accent, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {label}
            </Link>
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={`Buka menu ${label}`}
                style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: accent, fontSize: '0.55rem', lineHeight: 1,
                }}
            >
                {open ? '▲' : '▼'}
            </button>
            {open && (
                <div
                    style={{
                        position: 'absolute', top: '100%', left: 0, marginTop: 10,
                        background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                        borderRadius: 8, minWidth: 170, padding: '0.4rem 0', zIndex: 30,
                        boxShadow: '0 10px 24px rgba(0,0,0,0.55)',
                    }}
                >
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="text-decoration-none d-block"
                            style={{
                                padding: '0.45rem 1rem', color: item.color ?? 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Layout({ children }) {
    const { props } = usePage();
    const user = props.auth?.user;

    const bermainItems = [
        { href: route('guild.index'), label: 'Guild' },
        { href: route('monsters.index'), label: 'Monster' },
        { href: route('maps.index'), label: 'Peta' },
        { href: route('guide.index'), label: 'Cara Main' },
    ];

    const karakterItems = [
        { href: route('characters.index'), label: 'Karaktermu' },
        { href: route('characters.create'), label: '+ Buat Karakter Baru', color: 'var(--accent-saint)' },
        ...(user?.is_admin ? [{ href: route('admin.settings.index'), label: 'Admin', color: '#b8433a' }] : []),
    ];

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
                <div className="container d-flex align-items-center justify-content-between py-3 flex-wrap gap-3">
                    <Link
                        href={route('classes.index')}
                        className="text-decoration-none"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}
                    >
                        IndoRPG
                    </Link>
                    <div className="d-flex align-items-center gap-4">
                        <NavDropdown label="Bermain" labelHref={route('classes.index')} items={bermainItems} accent="var(--accent-saint)" />

                        {user ? (
                            <>
                                <NavDropdown label="Karakter" labelHref={route('characters.index')} items={karakterItems} />
                                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                    {user.username}
                                </span>
                                <button
                                    onClick={() => router.post(route('logout'))}
                                    className="text-decoration-none"
                                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="d-flex align-items-center gap-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                <Link href={route('login')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                                    Login
                                </Link>
                                <Link href={route('register')} className="text-decoration-none" style={{ color: 'var(--accent-saint)' }}>
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
}
