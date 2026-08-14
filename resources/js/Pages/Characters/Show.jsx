import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

export default function Show({ character }) {
    const accent = CLASS_ACCENT[character.subclass?.game_class?.slug] ?? '#8890a4';
    const subclass = character.subclass;

    return (
        <Layout>
            <Head title={character.name} />
            <div className="container py-5">
                <Link href={route('characters.index')} className="rpg-back-link mb-4">
                    &larr; Roster
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-4">
                    {subclass?.avatar_path ? (
                        <img
                            src={subclass.avatar_path}
                            alt={character.name}
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}` }}
                        />
                    ) : (
                        <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                            {character.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{character.name}</h1>
                        <p className="rpg-power-type mb-0">
                            Level {character.level} &middot; {subclass?.name} &middot; {subclass?.game_class?.name}
                        </p>
                    </div>
                </div>

                <div className="row g-4 mb-5">
                    {subclass?.full_body_path && (
                        <div className="col-md-4">
                            <div className="rpg-skill-group-title">Full View</div>
                            <img
                                src={subclass.full_body_path}
                                alt={subclass.name}
                                style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                            />
                        </div>
                    )}
                    <div className={subclass?.full_body_path ? 'col-md-8' : 'col-12'}>
                        <div className="rpg-skill-group-title">Resource</div>
                        <div className="rpg-card" style={{ '--accent': accent }}>
                            {[
                                ['HP', character.current_hp, '#b8433a'],
                                ['Stamina', character.current_stamina, '#c98a3a'],
                                ['Mana', character.current_mana, '#7269d1'],
                            ].map(([label, val, color]) => (
                                <div key={label} className="rpg-stat-row">
                                    <div className="rpg-stat-label"><span>{label}</span><span>{val}</span></div>
                                </div>
                            ))}
                            <p className="small text-secondary mt-2 mb-0">EXP: {character.exp}</p>
                        </div>
                    </div>
                </div>

                <div className="rpg-skill-group-title">Skill Terbuka</div>
                {character.skills.length === 0 ? (
                    <p className="text-secondary small">Belum ada skill yang di-assign ke karakter ini.</p>
                ) : (
                    <div className="row g-3">
                        {character.skills.map((s) => (
                            <div className="col-md-6" key={s.id}>
                                <div className="rpg-skill-card">
                                    {s.icon_path && <img src={s.icon_path} alt={s.name} className="rpg-skill-icon" />}
                                    <div>
                                        <div className="rpg-skill-name">{s.name}</div>
                                        <p className="rpg-skill-desc">{s.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
