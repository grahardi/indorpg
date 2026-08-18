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
    accuracy: 15, evasion: 15, critical_hit: 25, critical_luck: 25,
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

// Bar gabungan: segmen "base" (warna utama) + segmen "bonus" (emas) dalam 1 bar,
// angka format "base + bonus = total". Kalau statKey gak dikasih (stat auto tanpa
// bonus, misal Base HP/Regen), tampil bar polos + angka tunggal.
function StatBar({ label, baseValue, max = 100, color, suffix = '', statKey, character, isOwner, upgrading, onUpgrade }) {
    const bonusValue = statKey ? (character[`bonus_${statKey}`] ?? 0) : 0;
    const total = baseValue + bonusValue;
    const basePct = Math.max(0, Math.min(100, (baseValue / max) * 100));
    const bonusPct = Math.max(0, Math.min(100 - basePct, (bonusValue / max) * 100));
    const hasFreePoint = character.stat_points > 0;
    const cost = statKey ? (bonusValue + 1) * UPGRADE_MULTIPLIER[statKey] : 0;
    const canAfford = statKey && (hasFreePoint || character.exp >= cost);
    const bonusColor = '#c9a24b';

    return (
        <div className="d-flex align-items-center gap-3 mb-3">
            <div style={{ width: 150, fontSize: '0.92rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
            <div className="flex-grow-1 rpg-stat-track" style={{ height: 12, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${basePct}%`, background: color }} />
                {bonusValue > 0 && <div style={{ width: `${bonusPct}%`, background: bonusColor }} />}
            </div>
            <div
                style={{
                    width: bonusValue > 0 ? 118 : 60, textAlign: 'right', flexShrink: 0,
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: bonusValue > 0 ? '0.85rem' : '1.05rem', color,
                }}
            >
                {bonusValue > 0 ? (
                    <>
                        {baseValue} <span style={{ color: bonusColor }}>+{bonusValue}</span> = {total}{suffix}
                    </>
                ) : (
                    <>{total}{suffix}</>
                )}
            </div>
            {statKey && isOwner && (
                <button
                    onClick={() => onUpgrade(statKey)}
                    disabled={!canAfford || upgrading}
                    title={hasFreePoint ? 'Upgrade +1 (gratis, pakai stat point)' : `Upgrade +1 (${cost} EXP)`}
                    className="btn btn-sm"
                    style={{
                        width: 30, height: 30, padding: 0, flexShrink: 0,
                        background: canAfford ? 'var(--bg-panel-hover)' : 'transparent',
                        border: `1px solid ${canAfford ? bonusColor : 'var(--border-subtle)'}`,
                        color: canAfford ? bonusColor : 'var(--text-muted)',
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
                            <p className="mb-0 mt-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: character.stat_points > 0 ? '#c9a24b' : 'var(--text-secondary)' }}>
                                Stat Point Gratis: {character.stat_points}{isOwner && character.stat_points > 0 && ' — klik + di stat buat pakai (gratis!)'}
                            </p>
                            <p className="mb-0 mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#c9a24b' }}>
                                Gold: {character.gold}
                            </p>
                        </div>

                        {/* Stats gabungan - base (naik otomatis dari level) + bonus (upgrade EXP) dalam 1 bar */}
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Stats</div>
                        <p className="text-secondary small mb-2">
                            Physical/Magic Attack &amp; Defense naik otomatis tiap level (sesuai profil {subclass?.name}).
                            Semua stat bisa ditambah lagi pakai EXP (klik +) — bar emas nunjukkin bagian dari upgrade.
                        </p>
                        <div className="rpg-card" style={{ '--accent': accent, padding: '1.5rem' }}>
                            <StatBar label="Base HP" baseValue={character.effective_base_hp} max={150} color="#b8433a" character={character} />
                            <StatBar label="Base MP" baseValue={character.effective_base_mp} max={150} color="#7269d1" character={character} />
                            <StatBar label="Base SP" baseValue={character.effective_base_sp} max={150} color="#c98a3a" character={character} />
                            <StatBar
                                label="Physical Attack" baseValue={character.effective_physical_damage - character.bonus_physical_damage} max={80} color="#b8433a"
                                statKey="physical_damage" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Physical Defense" baseValue={character.effective_physical_defense - character.bonus_physical_defense} max={80} color="#c98a3a"
                                statKey="physical_defense" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Magic Attack" baseValue={character.effective_magic_damage - character.bonus_magic_damage} max={80} color="#7269d1"
                                statKey="magic_damage" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Magic Defense" baseValue={character.effective_magic_defense - character.bonus_magic_defense} max={80} color="#3f8c94"
                                statKey="magic_defense" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar label="HP Regeneration" baseValue={character.effective_hp_regen} max={20} color="#b8433a" character={character} />
                            <StatBar label="Mana Regeneration" baseValue={character.effective_mana_regen} max={20} color="#7269d1" character={character} />
                            <StatBar label="Stamina Regeneration" baseValue={character.effective_stamina_regen} max={20} color="#c98a3a" character={character} />
                            <StatBar
                                label="Accuracy" baseValue={character.effective_accuracy - character.bonus_accuracy} max={80} color="#3f8c94"
                                statKey="accuracy" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Evasion" baseValue={character.effective_evasion - character.bonus_evasion} max={80} color="#3f8c94"
                                statKey="evasion" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Critical Hit" baseValue={character.effective_critical_hit - character.bonus_critical_hit} max={60} color="#c9a24b" suffix="%"
                                statKey="critical_hit" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                            <StatBar
                                label="Critical Luck" baseValue={character.effective_critical_luck - character.bonus_critical_luck} max={60} color="#c9a24b" suffix="%"
                                statKey="critical_luck" character={character} isOwner={isOwner} upgrading={upgrading} onUpgrade={upgrade}
                            />
                        </div>
                    </div>
                </div>

                <InventorySection character={character} isOwner={isOwner} />

                <LoadoutSection character={character} isOwner={isOwner} />
            </div>
        </Layout>
    );
}

const RARITY_ACCENT = {
    common: '#8890a4',
    rare: '#3f8c94',
    sr: '#7269d1',
    ur: '#c9a24b',
    legendary: '#b8433a',
};

const RARITY_LABEL = {
    common: 'Common',
    rare: 'Rare',
    sr: 'SR',
    ur: 'UR',
    legendary: 'Legendary',
};

const STAT_LABEL = {
    physical_damage: 'Physical Attack',
    physical_defense: 'Physical Defense',
    magic_damage: 'Magic Attack',
    magic_defense: 'Magic Defense',
    accuracy: 'Accuracy',
    evasion: 'Evasion',
    critical_hit: 'Critical Hit',
    critical_luck: 'Critical Luck',
};

function InventorySection({ character, isOwner }) {
    const [togglingId, setTogglingId] = useState(null);
    const items = character.items ?? [];
    const equippedCount = items.filter((i) => i.pivot?.is_equipped).length;

    function toggleEquip(item) {
        setTogglingId(item.id);
        router.post(route('characters.items.toggle-equip', [character.id, item.id]), {}, {
            preserveScroll: true,
            onFinish: () => setTogglingId(null),
        });
    }

    return (
        <div className="mb-5">
            <div className="d-flex justify-content-between align-items-end mb-2">
                <div className="rpg-skill-group-title" style={{ fontSize: '0.85rem' }}>
                    Inventory ({equippedCount}/4 ke-equip)
                </div>
                {isOwner && (
                    <Link href={route('shop.index')} className="rpg-back-link" style={{ color: '#c9a24b' }}>
                        + Belanja di Shop
                    </Link>
                )}
            </div>
            <p className="text-secondary small mb-3">
                Maksimal 4 item bisa di-equip sekaligus. Item yang di-equip otomatis nambah stat karakter di battle.
            </p>

            {items.length === 0 ? (
                <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                    Belum punya item. {isOwner && <>Coba menang battle (kadang drop) atau beli di <Link href={route('shop.index')}>Shop</Link>.</>}
                </p>
            ) : (
                <div className="row g-3">
                    {items.map((item) => {
                        const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
                        const isEquipped = item.pivot?.is_equipped;
                        return (
                            <div className="col-md-6" key={item.id}>
                                <div className="rpg-card" style={{ '--accent': accent, opacity: isEquipped ? 1 : 0.7 }}>
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="rpg-subclass-name" style={{ fontSize: '0.92rem' }}>{item.name}</div>
                                        <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.58rem' }}>
                                            {RARITY_LABEL[item.rarity]}
                                        </span>
                                    </div>
                                    <div className="rpg-power-type mb-2">
                                        +{item.effect_value} {STAT_LABEL[item.effect_stat] ?? item.effect_stat}
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => toggleEquip(item)}
                                            disabled={togglingId === item.id}
                                            className="rpg-back-link"
                                            style={{
                                                fontSize: '0.72rem',
                                                color: isEquipped ? '#c9a24b' : 'var(--text-secondary)',
                                                borderColor: isEquipped ? '#c9a24b' : 'var(--border-subtle)',
                                            }}
                                        >
                                            {isEquipped ? '★ Ter-equip (klik buat lepas)' : 'Equip'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function LoadoutSection({ character, isOwner }) {
    const subclassSkills = character.subclass?.skills ?? [];
    const tier1Skills = subclassSkills.filter((s) => s.tier === 1);
    const tier3Skills = subclassSkills.filter((s) => s.tier === 3);
    const hasManualLoadout = character.skills.length === 5;

    const [selected, setSelected] = useState(() => character.skills.map((s) => s.id));
    const [saving, setSaving] = useState(false);
    const [allocatingId, setAllocatingId] = useState(null);

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

    function allocate(skillId) {
        setAllocatingId(skillId);
        router.post(route('characters.skills.allocate', [character.id, skillId]), {}, {
            preserveScroll: true,
            onFinish: () => setAllocatingId(null),
        });
    }

    const canSave = selectedTier1Count === 4 && selectedTier3Count === 1;

    return (
        <>
            {/* Skill Point Allocation - cuma muncul kalau loadout manual udah diset (5 skill).
                Tiap poin invest EXP: +1% damage & -1% cooldown skill itu spesifik. */}
            {hasManualLoadout && (
                <>
                    <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem' }}>Skill Point Allocation</div>
                    <p className="text-secondary small mb-3">
                        Invest EXP ke skill spesifik: tiap poin +1% damage &amp; -1% cooldown skill itu (bukan stat karakter umum).
                    </p>
                    <div className="row g-3 mb-4">
                        {character.skills.map((s) => {
                            const bonus = s.pivot?.bonus_level ?? 0;
                            const cost = (bonus + 1) * 10;
                            const canAfford = character.exp >= cost;
                            return (
                                <div className="col-md-6" key={s.id}>
                                    <div className={`rpg-skill-card ${s.tier === 3 ? 'is-ultimate' : ''}`}>
                                        {s.icon_path && <img src={s.icon_path} alt={s.name} className="rpg-skill-icon" />}
                                        <div className="flex-grow-1">
                                            <div className="rpg-skill-name d-flex justify-content-between align-items-center gap-2">
                                                <span>{s.name}</span>
                                                {bonus > 0 && (
                                                    <span style={{ color: '#c9a24b', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                                                        +{bonus}% dmg / -{bonus}% cd
                                                    </span>
                                                )}
                                            </div>
                                            <p className="rpg-skill-desc">{s.description}</p>
                                            {isOwner && (
                                                <button
                                                    className="rpg-back-link"
                                                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}
                                                    onClick={() => allocate(s.id)}
                                                    disabled={!canAfford || allocatingId === s.id}
                                                >
                                                    {allocatingId === s.id ? '...' : `+ Allocate (${cost} EXP)`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {!isOwner ? (
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
            ) : (
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
            )}
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
