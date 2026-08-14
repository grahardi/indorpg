import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

const UPGRADE_MULTIPLIER = {
    physical_damage: 15, physical_defense: 15, magic_damage: 15, magic_defense: 15,
    agility: 15, evasion: 15, critical_hit: 25, critical_luck: 25,
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
// Kalau `statKey` dikasih dan karakter ini milik user yang login, muncul tombol "+".
function FifaStatBar({ label, value, totalValue, max = 100, color, suffix = '', statKey, character, isOwner, upgrading, onUpgrade }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const bonusValue = statKey ? (character[`bonus_${statKey}`] ?? 0) : 0;
    const cost = statKey ? (bonusValue + 1) * UPGRADE_MULTIPLIER[statKey] : 0;
    const canAfford = statKey && character.exp >= cost;

    return (
        <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 170, fontSize: '0.95rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
            <div className="flex-grow-1 rpg-stat-track" style={{ height: 12 }}>
                <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color }}>
                    {value}{suffix}
                </div>
                {totalValue !== undefined && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Total: {totalValue}{suffix}
                    </div>
                )}
            </div>
            {statKey && isOwner && (
                <button
                    onClick={() => onUpgrade(statKey)}
                    disabled={!canAfford || upgrading}
                    title={`Upgrade +1 (${cost} EXP)`}
                    className="btn btn-sm"
                    style={{
                        width: 30, height: 30, padding: 0, flexShrink: 0,
                        background: canAfford ? 'var(--bg-panel-hover)' : 'transparent',
                        border: `1px solid ${canAfford ? color : 'var(--border-subtle)'}`,
                        color: canAfford ? color : 'var(--text-muted)',
                        borderRadius: 6, fontSize: '0.9rem', lineHeight: 1,
                    }}
                >
                    +
                </button>
            )}
        </div>
    );
}

function LevelProgress({ character, accent }) {
    const current = character.exp_for_current_level;
    const next = character.exp_for_next_level;
    const total = character.total_exp;
    const pct = next > current ? Math.max(0, Math.min(100, ((total - current) / (next - current)) * 100)) : 100;

    return (
        <div style={{ maxWidth: 280 }}>
            <div className="d-flex justify-content-between mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Menuju Level {character.level + 1}</span>
                <span>{total} / {next} XP</span>
            </div>
            <div className="rpg-stat-track" style={{ height: 6 }}>
                <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: accent }} />
            </div>
        </div>
    );
}

export default function Show({ character }) {
    const { props } = usePage();
    const accent = CLASS_ACCENT[character.subclass?.game_class?.slug] ?? '#8890a4';
    const subclass = character.subclass;
    const isOwner = props.auth?.user?.id && character.user_id === props.auth.user.id;
    const [upgrading, setUpgrading] = useState(false);

    function upgrade(stat) {
        setUpgrading(true);
        router.post(route('characters.upgrade', character.id), { stat }, {
            preserveScroll: true,
            onFinish: () => setUpgrading(false),
        });
    }

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
                        <p className="rpg-power-type mb-2" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                            Level {character.level} &middot; {subclass?.name} &middot; {subclass?.game_class?.name}
                        </p>
                        <LevelProgress character={character} accent={accent} />
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
                            <ResourceRow label="HP" current={character.current_hp} max={character.effective_base_hp} color="#b8433a" />
                            <ResourceRow label="SP (Stamina)" current={character.current_stamina} max={character.effective_base_sp} color="#c98a3a" />
                            <ResourceRow label="MP (Mana)" current={character.current_mana} max={character.effective_base_mp} color="#7269d1" />
                            <p className="mb-0 mt-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                EXP (bisa dipakai upgrade): {character.exp}{isOwner && ' — klik tombol + di stat buat upgrade'}
                            </p>
                        </div>

                        {/* Base Stats - langsung di bawah Resource, model bar ala FIFA */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Base Stats</div>
                        <div className="rpg-card" style={{ '--accent': accent, padding: '1.5rem' }}>
                            {/* Base Stats - naik otomatis dari level, GAK bisa di-upgrade manual */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Base Stats</div>
                        <p className="text-secondary small mb-2">Naik otomatis tiap level, sesuai profil {subclass?.name} — stat yang tinggi naik cepat, yang rendah naik lambat.</p>
                        <div className="rpg-card mb-4" style={{ '--accent': accent, padding: '1.5rem' }}>
                            <FifaStatBar label="Base HP" value={character.effective_base_hp} max={150} color="#b8433a" />
                            <FifaStatBar label="Base MP" value={character.effective_base_mp} max={150} color="#7269d1" />
                            <FifaStatBar label="Base SP" value={character.effective_base_sp} max={150} color="#c98a3a" />
                            <FifaStatBar label="Physical Attack" value={character.leveled_physical_damage} max={100} color="#b8433a" />
                            <FifaStatBar label="Physical Defense" value={character.leveled_physical_defense} max={100} color="#c98a3a" />
                            <FifaStatBar label="Magic Attack" value={character.leveled_magic_damage} max={100} color="#7269d1" />
                            <FifaStatBar label="Magic Defense" value={character.leveled_magic_defense} max={100} color="#3f8c94" />
                            <FifaStatBar label="Mana Regeneration" value={character.effective_mana_regen} max={20} color="#7269d1" />
                            <FifaStatBar label="Stamina Regeneration" value={character.effective_stamina_regen} max={20} color="#c98a3a" />
                        </div>

                        {/* Bonus Stats - hasil upgrade pakai EXP. Total di battle = Base Stats + Bonus ini. */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Bonus Stats</div>
                        <p className="text-secondary small mb-2">
                            Ditambah pakai EXP (klik +). Total dipakai di battle = Base Stats + Bonus.
                        </p>
                        <div className="rpg-card" style={{ '--accent': accent, padding: '1.5rem' }}>
                            <FifaStatBar
                                label="Bonus Physical Attack" value={character.bonus_physical_damage} totalValue={character.effective_physical_damage} max={50} color="#b8433a"
                                statKey="physical_damage" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Physical Defense" value={character.bonus_physical_defense} totalValue={character.effective_physical_defense} max={50} color="#c98a3a"
                                statKey="physical_defense" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Magic Attack" value={character.bonus_magic_damage} totalValue={character.effective_magic_damage} max={50} color="#7269d1"
                                statKey="magic_damage" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Magic Defense" value={character.bonus_magic_defense} totalValue={character.effective_magic_defense} max={50} color="#3f8c94"
                                statKey="magic_defense" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Agility" value={character.bonus_agility} totalValue={character.effective_agility} max={50} color="#3f8c94"
                                statKey="agility" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Evasion" value={character.bonus_evasion} totalValue={character.effective_evasion} max={50} color="#3f8c94"
                                statKey="evasion" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Critical Hit" value={character.bonus_critical_hit} totalValue={character.effective_critical_hit} max={50} color="#c9a24b" suffix="%"
                                statKey="critical_hit" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <FifaStatBar
                                label="Bonus Critical Luck" value={character.bonus_critical_luck} totalValue={character.effective_critical_luck} max={50} color="#c9a24b" suffix="%"
                                statKey="critical_luck" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                        </div>
                    </div>
                </div>

                <LoadoutSection character={character} isOwner={isOwner} />
            </div>
        </Layout>
    );
}

function LoadoutSection({ character, isOwner }) {
    const subclassSkills = character.subclass?.skills ?? [];
    const tier1Skills = subclassSkills.filter((s) => s.tier === 1);
    const tier3Skills = subclassSkills.filter((s) => s.tier === 3);

    const [selected, setSelected] = useState(() => character.skills.map((s) => s.id));
    const [saving, setSaving] = useState(false);

    const selectedTier1Count = useMemo(
        () => selected.filter((id) => tier1Skills.some((s) => s.id === id)).length,
        [selected, tier1Skills]
    );
    const selectedTier3Count = useMemo(
        () => selected.filter((id) => tier3Skills.some((s) => s.id === id)).length,
        [selected, tier3Skills]
    );

    function toggle(skill) {
        const isSelected = selected.includes(skill.id);
        if (isSelected) {
            setSelected((prev) => prev.filter((id) => id !== skill.id));
            return;
        }
        if (skill.tier === 1 && selectedTier1Count >= 4) return;
        if (skill.tier === 3 && selectedTier3Count >= 1) return;
        setSelected((prev) => [...prev, skill.id]);
    }

    function save() {
        setSaving(true);
        router.post(route('characters.loadout', character.id), { skill_ids: selected }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    }

    const canSave = selectedTier1Count === 4 && selectedTier3Count === 1;

    if (!isOwner) {
        return (
            <>
                <div className="rpg-skill-group-title mb-3" style={{ fontSize: '0.85rem' }}>Loadout Battle</div>
                {character.skills.length === 0 ? (
                    <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                        Belum diatur manual — battle otomatis pakai 4 skill + 1 ultimate acak dari subclass ini.
                    </p>
                ) : (
                    <div className="row g-3">
                        {character.skills.map((s) => (
                            <SkillCard key={s.id} skill={s} />
                        ))}
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-end mb-3">
                <div>
                    <div className="rpg-skill-group-title" style={{ fontSize: '0.85rem' }}>Loadout Battle</div>
                    <p className="text-secondary small mb-0">
                        Pilih 4 skill biasa + 1 ultimate ({selectedTier1Count}/4 skill, {selectedTier3Count}/1 ultimate).
                        Belum diatur? Battle otomatis random 4+1.
                    </p>
                </div>
                <button className="rpg-back-link" onClick={save} disabled={!canSave || saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Loadout'}
                </button>
            </div>

            <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.72rem' }}>Skill Biasa (pilih 4)</div>
            <div className="row g-3 mb-4">
                {tier1Skills.map((s) => (
                    <SkillCard key={s.id} skill={s} selectable selected={selected.includes(s.id)} onClick={() => toggle(s)} />
                ))}
            </div>

            <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.72rem' }}>Ultimate (pilih 1)</div>
            <div className="row g-3">
                {tier3Skills.map((s) => (
                    <SkillCard key={s.id} skill={s} selectable selected={selected.includes(s.id)} onClick={() => toggle(s)} />
                ))}
            </div>
        </>
    );
}

function SkillCard({ skill, selectable = false, selected = false, onClick }) {
    return (
        <div className="col-md-6" key={skill.id}>
            <div
                className={`rpg-skill-card ${skill.tier === 3 ? 'is-ultimate' : ''}`}
                onClick={selectable ? onClick : undefined}
                style={{
                    cursor: selectable ? 'pointer' : 'default',
                    outline: selected ? '2px solid #c9a24b' : 'none',
                }}
            >
                {skill.icon_path && <img src={skill.icon_path} alt={skill.name} className="rpg-skill-icon" />}
                <div>
                    <div className="rpg-skill-name">
                        {skill.name} {selected && <span style={{ color: '#c9a24b' }}>✓</span>}
                    </div>
                    <p className="rpg-skill-desc">{skill.description}</p>
                </div>
            </div>
        </div>
    );
}
