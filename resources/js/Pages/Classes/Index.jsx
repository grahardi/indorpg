import { Link, Head } from '@inertiajs/react';

const CLASS_META = {
    warrior: { accent: '#b8433a', eyebrow: 'Damage Dealer' },
    tanker: { accent: '#3f8c94', eyebrow: 'Frontline Defense' },
    mage: { accent: '#7269d1', eyebrow: 'Elemental Ranged' },
    saint: { accent: '#c9a24b', eyebrow: 'Support' },
};

function StatBar({ label, value, max = 50, color }) {
    return (
        <div className="rpg-stat-row">
            <div className="rpg-stat-label">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <div className="rpg-stat-track">
                <div
                    className="rpg-stat-fill"
                    style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}
                />
            </div>
        </div>
    );
}

export default function Index({ classes }) {
    return (
        <>
            <Head title="Classes & Subclasses" />
            <div className="container py-5">
                <div className="mb-5">
                    <h1 className="rpg-hero-title display-4 mb-2">IndoRPG</h1>
                    <p className="rpg-tagline mb-0">
                        Character codex — 4 kelas, 14 subclass. Data browser tahap development, belum ada login.
                    </p>
                </div>

                {classes.map((gameClass) => {
                    const meta = CLASS_META[gameClass.slug] ?? { accent: '#8890a4', eyebrow: '' };
                    return (
                        <section className="rpg-class-section" key={gameClass.id}>
                            <div className="rpg-eyebrow" style={{ color: meta.accent }}>
                                {meta.eyebrow}
                            </div>
                            <h2 className="rpg-class-title">{gameClass.name}</h2>
                            <p className="rpg-class-desc">{gameClass.description}</p>
                            <div className="rpg-rune-divider">
                                <span className="rpg-rune-diamond" style={{ background: meta.accent }} />
                            </div>

                            <div className="row g-3">
                                {gameClass.subclasses.map((sub) => (
                                    <div className="col-md-6 col-lg-3" key={sub.id}>
                                        <Link
                                            href={route('subclass.show', sub.id)}
                                            className="rpg-card"
                                            style={{ '--accent': meta.accent }}
                                        >
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <div className="rpg-badge-hex" style={{ '--accent': meta.accent }}>
                                                    {sub.name.charAt(0)}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="rpg-subclass-name">{sub.name}</div>
                                                    <div className="rpg-power-type">{sub.power_type}</div>
                                                </div>
                                                {sub.element && (
                                                    <span
                                                        className="rpg-element-badge"
                                                        style={{ '--accent': meta.accent }}
                                                    >
                                                        {sub.element.name}
                                                    </span>
                                                )}
                                            </div>

                                            <StatBar label="Phys DMG" value={sub.base_physical_damage} color="#b8433a" />
                                            <StatBar label="Phys DEF" value={sub.base_physical_defense} color="#c98a3a" />
                                            <StatBar label="Magic DMG" value={sub.base_magic_damage} color="#7269d1" />
                                            <StatBar label="Magic DEF" value={sub.base_magic_defense} color="#3f8c94" />

                                            {sub.flavor_bonus && (
                                                <p className="rpg-flavor-note" style={{ '--accent': meta.accent, color: meta.accent }}>
                                                    {sub.flavor_bonus}
                                                </p>
                                            )}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </>
    );
}
