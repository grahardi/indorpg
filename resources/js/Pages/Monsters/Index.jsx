import { Link, Head } from '@inertiajs/react';
import Layout from '../../Layout';

const TYPE_ACCENT = {
    Slime: '#3f8c94',
    Beast: '#b8433a',
    Undead: '#5b6178',
    Humanoid: '#c98a3a',
    Insect: '#3f8c94',
    Spirit: '#7269d1',
    Elemental: '#b8433a',
    Construct: '#8890a4',
};

function patternLabel(pattern) {
    if (!pattern) return '-';
    const [range, dmg] = pattern.split('_');
    const rangeLabel = { close: 'Jarak Dekat', range: 'Jarak Jauh', area: 'Area' }[range] ?? range;
    const dmgLabel = { physical: 'Fisik', magic: 'Sihir' }[dmg] ?? dmg;
    return `${rangeLabel} · ${dmgLabel}`;
}

export default function Index({ monsters }) {
    return (
        <Layout>
            <Head title="Bestiary" />
            <div className="container py-5">
                <h1 className="rpg-hero-title display-5 mb-2">Bestiary</h1>
                <p className="rpg-tagline mb-5">
                    {monsters.length} monster tercatat. Data untuk battle system round-based (pilih 2-3 karakter untuk melawan).
                </p>

                <div className="row g-3">
                    {monsters.map((m) => {
                        const accent = TYPE_ACCENT[m.type] ?? '#8890a4';
                        return (
                            <div className="col-md-6 col-lg-4" key={m.id}>
                                <Link href={route('monsters.show', m.id)} className="rpg-card" style={{ '--accent': accent }}>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            {m.avatar_path ? (
                                                <img
                                                    src={m.avatar_path}
                                                    alt={m.name}
                                                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0 }}
                                                />
                                            ) : null}
                                            <div>
                                                <div className="rpg-subclass-name">{m.name}</div>
                                                <div className="rpg-power-type">
                                                    Lv.{m.level} &middot; {m.type}
                                                    {m.element && <> &middot; {m.element.name}</>}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="rpg-element-badge" style={{ '--accent': accent }}>
                                            {m.exp_reward} EXP
                                        </span>
                                    </div>

                                    <div className="rpg-skill-cost mb-2" style={{ fontSize: '0.72rem' }}>
                                        <span style={{ color: '#3f8c94' }}>▲ Kuat: {patternLabel(m.strong_against)}</span>
                                    </div>
                                    <div className="rpg-skill-cost" style={{ fontSize: '0.72rem' }}>
                                        <span style={{ color: '#b8433a' }}>▼ Lemah: {patternLabel(m.weak_against)}</span>
                                    </div>

                                    {m.special_skill_name && (
                                        <p className="rpg-flavor-note" style={{ color: accent }}>
                                            {m.special_skill_name}
                                        </p>
                                    )}
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
