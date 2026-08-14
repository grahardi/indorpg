import { Link, Head } from '@inertiajs/react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

export default function Index({ characters }) {
    return (
        <Layout>
            <Head title="Karakter" />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-end mb-4">
                    <div>
                        <h1 className="rpg-hero-title display-5 mb-2">Roster Karakter</h1>
                        <p className="rpg-tagline mb-0">
                            {characters.length} karakter dibuat. Belum ada login — roster ini bersama untuk semua tester.
                        </p>
                    </div>
                    <Link href={route('characters.create')} className="rpg-back-link">
                        + Buat Karakter
                    </Link>
                </div>

                {characters.length === 0 && (
                    <p className="text-secondary">Belum ada karakter. Klik "Buat Karakter" untuk mulai.</p>
                )}

                <div className="row g-3">
                    {characters.map((c) => {
                        const accent = CLASS_ACCENT[c.subclass?.game_class?.slug] ?? '#8890a4';
                        return (
                            <div className="col-md-6 col-lg-3" key={c.id}>
                                <Link href={route('characters.show', c.id)} className="rpg-card" style={{ '--accent': accent }}>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {c.subclass?.avatar_path ? (
                                            <img
                                                src={c.subclass?.avatar_path}
                                                alt={c.name}
                                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}` }}
                                            />
                                        ) : (
                                            <div className="rpg-badge-hex" style={{ '--accent': accent }}>
                                                {c.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="rpg-subclass-name d-flex align-items-center gap-2">
                                                {c.name}
                                                {c.is_npc && (
                                                    <span className="rpg-element-badge" style={{ '--accent': '#8890a4', fontSize: '0.6rem' }}>
                                                        NPC
                                                    </span>
                                                )}
                                            </div>
                                            <div className="rpg-power-type">
                                                Lv.{c.level} &middot; {c.subclass?.name}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
