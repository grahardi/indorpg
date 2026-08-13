import { Link, Head } from '@inertiajs/react';

const CLASS_META = {
    warrior: { accent: '#b8433a' },
    tanker: { accent: '#3f8c94' },
    mage: { accent: '#7269d1' },
    saint: { accent: '#c9a24b' },
};

function SkillCard({ skill, accent }) {
    const isUltimate = skill.tier === 3;
    return (
        <div className="col-md-6" key={skill.id}>
            <div className={`rpg-skill-card ${isUltimate ? 'is-ultimate' : ''}`}>
                {skill.icon_path ? (
                    <img src={skill.icon_path} alt={skill.name} className="rpg-skill-icon" />
                ) : (
                    <div
                        className="rpg-skill-icon d-flex align-items-center justify-content-center"
                        style={{ background: 'var(--bg-panel-hover)', color: accent, fontFamily: 'var(--font-display)' }}
                    >
                        {skill.name.charAt(0)}
                    </div>
                )}
                <div className="flex-grow-1">
                    <div className="rpg-skill-name">
                        {skill.name}
                        {isUltimate && (
                            <span className="rpg-element-badge ms-2" style={{ '--accent': '#c9a24b', color: '#c9a24b' }}>
                                ULTIMATE
                            </span>
                        )}
                    </div>
                    <p className="rpg-skill-desc">{skill.description}</p>
                    <div className="rpg-skill-cost">
                        {skill.stamina_cost > 0 && <span>⚡ {skill.stamina_cost} Stamina</span>}
                        {skill.mana_cost > 0 && <span>🔷 {skill.mana_cost} Mana</span>}
                        <span>⏱ {skill.cooldown_seconds}s CD</span>
                        <span>×{skill.base_multiplier} DMG</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Show({ subclass }) {
    const accent = CLASS_META[subclass.gameClass?.slug]?.accent ?? '#8890a4';

    const physicalSkills = subclass.skills.filter((s) => s.tier !== 3 && s.scaling_stat === 'physical');
    const magicSkills = subclass.skills.filter((s) => s.tier !== 3 && s.scaling_stat === 'magic');
    const ultimateSkills = subclass.skills.filter((s) => s.tier === 3);

    return (
        <>
            <Head title={subclass.name} />
            <div className="container py-5">
                <Link href={route('classes.index')} className="rpg-back-link mb-4">
                    &larr; Kembali ke Codex
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-2">
                    <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                        {subclass.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{subclass.name}</h1>
                        <p className="rpg-power-type mb-0">
                            {subclass.gameClass?.name} &middot; {subclass.power_type}
                            {subclass.element && <> &middot; Elemen {subclass.element.name}</>}
                        </p>
                    </div>
                </div>
                <p className="rpg-class-desc mt-3">{subclass.description}</p>
                {subclass.flavor_bonus && (
                    <p className="rpg-flavor-note" style={{ color: accent }}>{subclass.flavor_bonus}</p>
                )}

                <div className="row g-3 my-4">
                    {[
                        ['Physical Damage', subclass.base_physical_damage, '#b8433a'],
                        ['Physical Defense', subclass.base_physical_defense, '#c98a3a'],
                        ['Magic Damage', subclass.base_magic_damage, '#7269d1'],
                        ['Magic Defense', subclass.base_magic_defense, '#3f8c94'],
                    ].map(([label, val, color]) => (
                        <div className="col-6 col-md-3" key={label}>
                            <div className="rpg-card text-center" style={{ '--accent': color }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 600, color }}>
                                    {val}
                                </div>
                                <div className="rpg-power-type mt-1">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="rpg-loadout-note" style={{ '--accent': accent, borderColor: accent }}>
                    Default penggunaan tempur: pilih 3 dari Skill Fisik / Magic, ditambah 1 Ultimate.
                </p>

                {physicalSkills.length > 0 && (
                    <div className="mb-4">
                        <div className="rpg-skill-group-title">Skill Fisik</div>
                        <div className="row g-3">
                            {physicalSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                        </div>
                    </div>
                )}

                {magicSkills.length > 0 && (
                    <div className="mb-4">
                        <div className="rpg-skill-group-title">Magic</div>
                        <div className="row g-3">
                            {magicSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                        </div>
                    </div>
                )}

                {ultimateSkills.length > 0 && (
                    <div className="mb-4">
                        <div className="rpg-skill-group-title">Ultimate</div>
                        <div className="row g-3">
                            {ultimateSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
