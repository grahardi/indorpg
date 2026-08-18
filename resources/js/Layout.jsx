import { Link, usePage, router } from '@inertiajs/react';

export default function Layout({ children }) {
    const { props } = usePage();
    const user = props.auth?.user;

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
                <div className="container d-flex align-items-center justify-content-between py-3 flex-wrap gap-2">
                    <Link
                        href={route('classes.index')}
                        className="text-decoration-none"
                        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}
                    >
                        IndoRPG
                    </Link>
                    <div className="d-flex align-items-center gap-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        <Link href={route('guild.index')} className="text-decoration-none" style={{ color: 'var(--accent-saint)' }}>
                            Guild
                        </Link>
                        <Link href={route('classes.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Codex
                        </Link>
                        <Link href={route('characters.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Karakter
                        </Link>
                        <Link href={route('monsters.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Monster
                        </Link>
                        <Link href={route('maps.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Peta
                        </Link>
                        <Link href={route('guide.index')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                            Cara Main
                        </Link>

                        {user ? (
                            <>
                                {user.is_admin && (
                                    <Link href={route('admin.settings.index')} className="text-decoration-none" style={{ color: '#b8433a' }}>
                                        Admin
                                    </Link>
                                )}
                                <Link href={route('characters.create')} className="text-decoration-none" style={{ color: 'var(--accent-saint)' }}>
                                    + Karakter Baru
                                </Link>
                                <span style={{ color: 'var(--text-secondary)' }}>{user.username}</span>
                                <button
                                    onClick={() => router.post(route('logout'))}
                                    className="text-decoration-none"
                                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href={route('login')} className="text-decoration-none" style={{ color: 'var(--text-secondary)' }}>
                                    Login
                                </Link>
                                <Link href={route('register')} className="text-decoration-none" style={{ color: 'var(--accent-saint)' }}>
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
}
