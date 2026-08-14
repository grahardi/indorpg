import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

function Bar({ current, max, color }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    return (
        <div className="rpg-stat-track" style={{ height: 10 }}>
            <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

function ResourceRow({ label, current, max, color }) {
    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color }}>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span>{current} / {max}</span>
            </div>
            <Bar current={current} max={max} color={color} />
        </div>
    );
}

// Model "FIFA card" - label kiri, bar horizontal isi proporsional, angka kanan.
function FifaStatBar({ label, value, max = 100, color, suffix = '' }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
        <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 170, fontSize: '0.95rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
            <div className="flex-grow-1 rpg-stat-track" style={{ height: 12 }}>
                <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div style={{ width: 56, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color, flexShrink: 0 }}>
                {value}{suffix}
            </div>
        </div>
    );
}

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

                <div className="d-flex align-items-center gap-3 mt-4 mb-5">
                    {subclass?.avatar_path ? (
                        <img
                            src={subclass.avatar_path}
                            alt={character.name}
                            style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${accent}` }}
                        />
                    ) : (
                        <div className="rpg-badge-hex" style={{ '--accent': accent, width: 76, height: 76, fontSize: '1.9rem' }}>
                            {character.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="rpg-class-title mb-1" style={{ fontSize: '2.3rem' }}>{character.name}</h1>
                        <p className="rpg-power-type mb-0" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                            Level {character.level} &middot; {subclass?.name} &middot; {subclass?.game_class?.name}
                        </p>
                    </div>
                </div>

                <div className="row g-4 mb-5 align-items-start">
                    {subclass?.full_body_path && (
                        <div className="col-md-4">
                            <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Full View</div>
                            <img
                                src={subclass.full_body_path}
                                alt={subclass.name}
                                style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}
                            />
                        </div>
                    )}
                    <div className={subclass?.full_body_path ? 'col-md-8' : 'col-12'}>
                        {/* Resources */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Resource</div>
                        <div className="rpg-card mb-4" style={{ '--accent': accent, padding: '1.5rem' }}>
                            <ResourceRow label="HP" current={character.current_hp} max={subclass?.base_hp ?? character.current_hp} color="#b8433a" />
                            <ResourceRow label="SP (Stamina)" current={character.current_stamina} max={subclass?.base_sp ?? character.current_stamina} color="#c98a3a" />
                            <ResourceRow label="MP (Mana)" current={character.current_mana} max={subclass?.base_mp ?? character.current_mana} color="#7269d1" />
                            <p className="mb-0 mt-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                EXP: {character.exp}
                            </p>
                        </div>

                        {/* Base Stats - langsung di bawah Resource, model bar ala FIFA */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Base Stats</div>
                        <div className="rpg-card" style={{ '--accent': accent, padding: '1.5rem' }}>
                            <FifaStatBar label="Base HP" value={subclass?.base_hp} max={100} color="#b8433a" />
                            <FifaStatBar label="Base MP" value={subclass?.base_mp} max={100} color="#7269d1" />
                            <FifaStatBar label="Base SP" value={subclass?.base_sp} max={100} color="#c98a3a" />
                            <FifaStatBar label="Physical Attack" value={subclass?.base_physical_damage} max={100} color="#b8433a" />
                            <FifaStatBar label="Physical Defense" value={subclass?.base_physical_defense} max={100} color="#c98a3a" />
                            <FifaStatBar label="Magic Attack" value={subclass?.base_magic_damage} max={100} color="#7269d1" />
                            <FifaStatBar label="Magic Defense" value={subclass?.base_magic_defense} max={100} color="#3f8c94" />
                            <FifaStatBar label="Mana Regeneration" value={subclass?.mana_regen} max={20} color="#7269d1" />
                            <FifaStatBar label="Stamina Regeneration" value={subclass?.stamina_regen} max={20} color="#c98a3a" />
                            <FifaStatBar label="Agility" value={subclass?.agility} max={100} color="#3f8c94" />
                            <FifaStatBar label="Evasion" value={subclass?.evasion} max={100} color="#3f8c94" />
                            <FifaStatBar label="Critical Hit" value={subclass?.critical_hit_bonus} max={100} color="#c9a24b" suffix="%" />
                            <FifaStatBar label="Critical Luck" value={subclass?.critical_luck} max={100} color="#c9a24b" suffix="%" />
                        </div>
                    </div>
                </div>

                <div className="rpg-skill-group-title mb-3" style={{ fontSize: '0.85rem' }}>Skill Terbuka</div>
                {character.skills.length === 0 ? (
                    <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                        Belum ada skill yang di-assign ke karakter ini. Fitur assign skill per-karakter belum dibangun —
                        battle sekarang otomatis pakai seluruh skill pool subclass.
                    </p>
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
