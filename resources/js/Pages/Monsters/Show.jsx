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

export default function Show({ monster }) {
    const accent = TYPE_ACCENT[monster.type] ?? '#8890a4';

    return (
        <Layout>
            <Head title={monster.name} />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                <Link href={route('monsters.index')} className="rpg-back-link mb-4">
                    &larr; Bestiary
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-2">
                    <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                        {monster.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{monster.name}</h1>
                        <p className="rpg-power-type mb-0">
                            Level {monster.level} &middot; {monster.type}
                            {monster.element && <> &middot; Elemen {monster.element.name}</>}
                        </p>
                    </div>
                </div>
                <p className="rpg-class-desc mt-3">{monster.description}</p>

                <div className="row g-3 my-4">
                    {[
                        ['HP', monster.hp, '#3f8c94'],
                        ['Physical DMG', monster.physical_damage, '#b8433a'],
                        ['Physical DEF', monster.physical_defense, '#c98a3a'],
                        ['Magic DMG', monster.magic_damage, '#7269d1'],
                        ['Magic DEF', monster.magic_defense, '#3f8c94'],
                        ['EXP Reward', monster.exp_reward, '#c9a24b'],
                    ].map(([label, val, color]) => (
                        <div className="col-4" key={label}>
                            <div className="rpg-card text-center" style={{ '--accent': color }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color }}>
                                    {val}
                                </div>
                                <div className="rpg-power-type mt-1">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <div className="rpg-card h-100" style={{ '--accent': '#3f8c94' }}>
                            <div className="rpg-skill-group-title mb-2" style={{ color: '#3f8c94' }}>▲ Kuat Melawan</div>
                            <div className="rpg-subclass-name">{patternLabel(monster.strong_against)}</div>
                            <p className="rpg-skill-desc mt-2 mb-0">
                                Damage dari pola serangan ini akan dikurangi saat menyerang {monster.name}.
                            </p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="rpg-card h-100" style={{ '--accent': '#b8433a' }}>
                            <div className="rpg-skill-group-title mb-2" style={{ color: '#b8433a' }}>▼ Lemah Melawan</div>
                            <div className="rpg-subclass-name">{patternLabel(monster.weak_against)}</div>
                            <p className="rpg-skill-desc mt-2 mb-0">
                                Damage dari pola serangan ini akan diperbesar saat menyerang {monster.name}.
                            </p>
                        </div>
                    </div>
                </div>

                {monster.special_skill_name && (
                    <div className="rpg-skill-card is-ultimate mb-4">
                        <div
                            className="rpg-skill-icon d-flex align-items-center justify-content-center"
                            style={{ background: 'var(--bg-panel-hover)', color: accent, fontFamily: 'var(--font-display)' }}
                        >
                            ★
                        </div>
                        <div>
                            <div className="rpg-skill-name">{monster.special_skill_name}</div>
                            <p className="rpg-skill-desc mb-0">{monster.special_skill_description}</p>
                        </div>
                    </div>
                )}

                <p className="rpg-loadout-note" style={{ '--accent': accent, borderColor: accent }}>
                    Disarankan melawan monster ini dengan party level {monster.min_party_level}+ (pilih 2-3 karakter).
                </p>
            </div>
        </Layout>
    );
}
