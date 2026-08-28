import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

const RARITY_ACCENT = {
    common: '#8f96a3',
    rare: '#8b5cf6',
    sr: '#4a90e2',
    ur: '#e8c547',
    legendary: '#ef7d6f',
};

const RARITY_LABEL = { common: 'Common', rare: 'Rare', sr: 'SR', ur: 'UR', legendary: 'Legendary' };

const STAT_LABEL = {
    physical_damage: 'Physical Attack', physical_defense: 'Physical Defense',
    magic_damage: 'Magic Attack', magic_defense: 'Magic Defense',
    accuracy: 'Accuracy', evasion: 'Evasion', critical_hit: 'Critical Hit', critical_luck: 'Critical Luck',
    hp: 'HP', hp_regen: 'HP Regen', mp_regen: 'MP Regen', sp_regen: 'SP Regen',
    elemental_damage: 'Elemental Damage',
};

function statLabel(item, elementName) {
    if (item.effect_stat === 'elemental_damage') {
        return `${elementName ?? item.element?.name ?? ''} Damage`.trim();
    }
    return STAT_LABEL[item.effect_stat] ?? item.effect_stat;
}

const CATALYST_BY_RARITY = {
    common: 'Accession Stone',
    rare: 'Accession Crystal',
    sr: 'Accession Orb',
    ur: 'Accession Core',
    legendary: 'Accession Relic',
};

const RARITY_POINTS = { common: 1, rare: 3, ur: 8 };
const TIERS = [0, 20, 40, 60, 80, 100];

// Total bonus stat tertentu di level tertentu - SAMA PERSIS
// Item::allBonusesAtLevel() di backend (base + tiap Part yang tercapai,
// ADITIF, stat sama dijumlah, stat beda tetep kepisah).
function allBonusesAtLevel(item, level, growthRatio = 1.0) {
    const bonuses = [{ stat: item.effect_stat, value: item.effect_value, element_id: item.effect_element_id }];
    if (item.category === 'artifact' && level > 0) {
        for (const b of item.accession_bonuses ?? []) {
            if (b.tier <= level && b.stat && b.value) {
                bonuses.push({ stat: b.stat, value: b.value, element_id: b.element_id ?? null });
            }
        }
    }
    const grouped = {};
    for (const b of bonuses) {
        const key = `${b.stat}-${b.element_id ?? 'x'}`;
        if (!grouped[key]) grouped[key] = { ...b, value: 0 };
        grouped[key].value += b.value;
    }
    // Growth kontinyu per level (bagian 85) - SAMA PERSIS Item::allBonusesAtLevel() backend.
    if (item.category === 'artifact' && level > 0) {
        const multiplier = 1 + (level * (growthRatio / 100));
        for (const key in grouped) {
            grouped[key].value = Math.round(grouped[key].value * multiplier);
        }
    }
    return Object.values(grouped);
}

// Bagian mana dari bonus di atas yang datang dari Part MANA - dipakai buat
// nampilin breakdown "Base +10, Part 1 +5, Part 2 (HP) +5" di detail view.
function bonusBreakdown(item) {
    const rows = [{ label: 'Base', stat: item.effect_stat, value: item.effect_value, element_id: item.effect_element_id }];
    (item.accession_bonuses ?? []).forEach((b, i) => {
        if (b.stat && b.value) {
            rows.push({ label: `Part ${TIERS.indexOf(b.tier)} (Lv.${b.tier})`, stat: b.stat, value: b.value, element_id: b.element_id ?? null });
        }
    });
    return rows;
}

function ItemDetailPanel({ character, item, elements, onClose, itemLevelGrowthRatio }) {
    const [selectedSacrifice, setSelectedSacrifice] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
    const currentLevel = item.pivot.accession_level;
    const unlockedTier = item.pivot.unlocked_tier ?? 20;
    const currentBonuses = allBonusesAtLevel(item, currentLevel, itemLevelGrowthRatio);
    const breakdown = bonusBreakdown(item);
    const elementName = (elId) => elements.find((e) => e.id === elId)?.name ?? '';

    const isMaxLevel = currentLevel >= 100;
    const candidates = character.items.filter((i) =>
        i.category === 'artifact' &&
        !['sr', 'legendary'].includes(i.rarity) &&
        !i.pivot.is_equipped &&
        i.pivot.id !== item.pivot.id
    );

    function toggleSacrifice(pivotId) {
        setSelectedSacrifice((prev) => prev.includes(pivotId) ? prev.filter((id) => id !== pivotId) : [...prev, pivotId]);
    }

    const selectedItems = candidates.filter((i) => selectedSacrifice.includes(i.pivot.id));
    const points = selectedItems.reduce((sum, i) => sum + (RARITY_POINTS[i.rarity] ?? 1), 0);

    const catalystName = CATALYST_BY_RARITY[item.rarity] ?? 'Accession Stone';
    const ownedCatalyst = character.items.find((i) => i.name === catalystName && i.category === 'accession');
    const catalystQty = ownedCatalyst ? (ownedCatalyst.pivot.quantity ?? 1) : 0;
    const atBlockBoundary = currentLevel >= unlockedTier && unlockedTier < 100;

    let previewLevel = currentLevel;
    let remaining = points;
    while (remaining > 0 && previewLevel < unlockedTier) {
        const cost = previewLevel + 1;
        if (remaining < cost) break;
        remaining -= cost;
        previewLevel++;
    }
    const hitCapWithPointsLeft = previewLevel >= unlockedTier && remaining > 0 && unlockedTier < 100;
    const willUseCatalyst = hitCapWithPointsLeft && catalystQty > 0;
    const canLevelUp = previewLevel > currentLevel || willUseCatalyst;

    // MODEL BAR PER-LEVEL: bar nunjukkin progress dari level SEKARANG ke level
    // BERIKUTNYA doang (bukan seluruh Part) - cost 1 level = level+1 poin
    // (makin tinggi levelnya, bar-nya makin panjang/butuh lebih banyak poin,
    // konsisten sama Part yang makin tinggi makin susah).
    const nextLevelCost = previewLevel + 1;
    const pointsTowardNextLevel = remaining; // sisa poin abis simulasi level-up di atas
    const barFillPct = nextLevelCost > 0 ? Math.min(100, (pointsTowardNextLevel / nextLevelCost) * 100) : 0;

    function submitLevelUp() {
        if (!canLevelUp || submitting) return;
        setSubmitting(true);
        router.post(route('accession.level-up'), {
            character_id: character.id,
            character_item_id: item.pivot.id,
            sacrifice_character_item_ids: selectedSacrifice,
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => { setSelectedSacrifice([]); },
        });
    }

    return (
        <div className="rpg-card" style={{ '--accent': accent, padding: '1.5rem' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-3">
                    <img src={item.icon_path ?? '/images/items/placeholder.png'} alt={item.name} style={{ width: 64, height: 64, objectFit: 'contain', background: accent, borderRadius: 8, padding: 6 }} />
                    <div>
                        <div className="rpg-subclass-name" style={{ fontSize: '1.15rem' }}>{item.name}</div>
                        <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.62rem' }}>{RARITY_LABEL[item.rarity]}</span>
                        {item.pivot.is_equipped && <span className="ms-1" style={{ color: '#c9a24b', fontSize: '0.65rem' }}>★ Equipped</span>}
                        {item.category === 'artifact' && (
                            <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                                Level {currentLevel} / 100
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="rpg-back-link" style={{ fontSize: '0.75rem' }}>✕ Tutup</button>
            </div>

            <p className="text-secondary small mb-3">{item.description}</p>

            <div className="mb-3">
                <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.78rem' }}>Bonus Aktif Sekarang</div>
                <div className="d-flex flex-column gap-1">
                    {currentBonuses.map((b, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            +{b.value} {statLabel({ effect_stat: b.stat }, elementName(b.element_id))}
                        </div>
                    ))}
                </div>
            </div>

            {item.category === 'artifact' && breakdown.length > 1 && (
                <div className="mb-3">
                    <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.78rem' }}>Rincian per Part (nilai dasar, sebelum growth per-level)</div>
                    <div className="d-flex flex-column gap-1">
                        {breakdown.map((b, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {b.label}: +{b.value} {statLabel({ effect_stat: b.stat }, elementName(b.element_id))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {item.category === 'artifact' && !isMaxLevel && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem', color: '#8b5cf6' }}>⬆ Level Up</div>
                    <p className="text-secondary small mb-1">
                        Bebas naik sampai level <strong>{unlockedTier}</strong> lewat sacrifice item Artifact lain (SR/Legendary & yang di-equip gak bisa dipilih).
                    </p>
                    {atBlockBoundary && (
                        <p className="text-secondary small mb-2">
                            Buat nembus ke level {unlockedTier + 1}+, butuh 1 <strong style={{ color: '#8b5cf6' }}>{catalystName}</strong> (punya: {catalystQty}).
                            {catalystQty === 0 && <> <Link href={route('shop.category', 'accession')}>Beli di sini</Link>.</>}
                        </p>
                    )}

                    <div className="row g-2 mb-3" style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {candidates.length === 0 ? (
                            <p className="text-secondary small fst-italic">Gak ada item Artifact yang bisa dikorbanin.</p>
                        ) : candidates.map((c) => {
                            const cAccent = RARITY_ACCENT[c.rarity] ?? '#8890a4';
                            const isSelected = selectedSacrifice.includes(c.pivot.id);
                            return (
                                <div className="col-6 col-md-4" key={c.pivot.id}>
                                    <button
                                        onClick={() => toggleSacrifice(c.pivot.id)}
                                        className="w-100 text-start p-2"
                                        style={{
                                            background: isSelected ? 'rgba(139,92,246,0.2)' : 'var(--bg-panel)',
                                            border: `2px solid ${isSelected ? '#8b5cf6' : 'var(--border-subtle)'}`,
                                            borderRadius: 8, fontSize: '0.7rem',
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <img src={c.icon_path ?? '/images/items/placeholder.png'} alt="" style={{ width: 26, height: 26, objectFit: 'contain', background: cAccent, borderRadius: 4, padding: 3 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <div className="text-truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                                                <div style={{ color: cAccent, fontSize: '0.6rem' }}>{RARITY_LABEL[c.rarity]} · +{RARITY_POINTS[c.rarity] ?? 1}pt</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-secondary small">
                                Progress ke Level {previewLevel + 1}
                            </span>
                            <span className="text-secondary small">{pointsTowardNextLevel} / {nextLevelCost} poin</span>
                        </div>
                        <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'var(--bg-panel)', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, width: `${barFillPct}%`, background: '#8b5cf6', borderRadius: 5, transition: 'width 0.2s' }} />
                        </div>
                        <p className="text-secondary small mt-1 mb-0" style={{ fontSize: '0.68rem' }}>
                            Butuh poin sesuai LEVEL SAAT ITU (level+1) - makin tinggi level, makin banyak sacrifice yang dibutuhin per level.
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <span className="text-secondary small">
                            Poin: <strong style={{ color: '#8b5cf6' }}>{points}</strong> → Lv.{previewLevel}{willUseCatalyst ? '+' : ''}
                        </span>
                        <button
                            onClick={submitLevelUp}
                            disabled={!canLevelUp || submitting}
                            className="btn btn-sm ms-auto"
                            style={{
                                background: canLevelUp ? 'rgba(139,92,246,0.2)' : 'transparent',
                                border: `1px solid ${canLevelUp ? '#8b5cf6' : 'var(--border-subtle)'}`,
                                color: canLevelUp ? '#8b5cf6' : 'var(--text-muted)',
                            }}
                        >
                            {submitting ? 'Memproses...' : 'Konfirmasi Level Up'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ItemGridCard({ item, isSelected, onClick }) {
    const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
    return (
        <button
            onClick={onClick}
            className="rpg-card w-100 text-start"
            style={{
                '--accent': accent, padding: '0.75rem', opacity: item.pivot.is_equipped ? 1 : 0.85,
                border: `2px solid ${isSelected ? accent : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
            }}
        >
            <div className="d-flex align-items-center gap-2">
                <img src={item.icon_path ?? '/images/items/placeholder.png'} alt={item.name} style={{ width: 36, height: 36, objectFit: 'contain', background: accent, borderRadius: 6, padding: 3, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                    <div className="text-truncate" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    {item.pivot.is_equipped && <span style={{ color: '#c9a24b', fontSize: '0.6rem' }}>★ Equipped</span>}
                    {item.category === 'artifact' && item.pivot.accession_level > 0 && (
                        <span style={{ color: '#8b5cf6', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}> Lv.{item.pivot.accession_level}</span>
                    )}
                </div>
            </div>
        </button>
    );
}

export default function MyItems({ characters, elements = [], itemLevelGrowthRatio = 1.0 }) {
    const { props } = usePage();
    const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? null);
    const [selectedItemPivotId, setSelectedItemPivotId] = useState(null);

    const character = characters.find((c) => c.id === selectedCharacterId);
    const byEquippedFirst = (a, b) => (b.pivot.is_equipped ? 1 : 0) - (a.pivot.is_equipped ? 1 : 0);
    const artifactItems = (character?.items.filter((i) => i.category === 'artifact') ?? []).sort(byEquippedFirst);
    const catalystItems = character?.items.filter((i) => i.category === 'accession') ?? [];
    const materialItems = character?.items.filter((i) => i.category === 'material') ?? [];

    const allDisplayItems = [...artifactItems, ...catalystItems, ...materialItems];
    const selectedItem = allDisplayItems.find((i) => i.pivot.id === selectedItemPivotId);

    function selectCharacter(id) {
        setSelectedCharacterId(id);
        setSelectedItemPivotId(null);
    }

    return (
        <Layout>
            <Head title="Item Saya" />
            <div className="container py-5">
                <Link href={route('shop.index')} className="rpg-back-link mb-3">&larr; Shop</Link>
                <h1 className="rpg-hero-title display-5 mb-2 mt-3">🎒 Item Saya</h1>
                <p className="rpg-tagline mb-4">Klik item buat lihat detail & level-up.</p>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#4a9960', color: '#4a9960' }}>
                        {props.flash.success}
                    </div>
                )}
                {props.errors?.accession && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        {props.errors.accession}
                    </div>
                )}

                {characters.length === 0 ? (
                    <p className="text-secondary">Belum ada karakter.</p>
                ) : (
                    <>
                        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                            <label className="rpg-stat-label mb-0">Karakter:</label>
                            <select
                                className="form-select form-select-sm bg-dark text-light border-secondary"
                                style={{ maxWidth: 260 }}
                                value={selectedCharacterId ?? ''}
                                onChange={(e) => selectCharacter(Number(e.target.value))}
                            >
                                {characters.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold</option>
                                ))}
                            </select>
                        </div>

                        {/* SINGLE VIEW: detail item yang lagi dipilih (kalau ada) muncul
                            SEKALI di atas, bukan numpuk di tiap card kayak sebelumnya. */}
                        {selectedItem && (
                            <div className="mb-4">
                                <ItemDetailPanel
                                    character={character}
                                    item={selectedItem}
                                    elements={elements}
                                    onClose={() => setSelectedItemPivotId(null)}
                                    itemLevelGrowthRatio={itemLevelGrowthRatio}
                                />
                            </div>
                        )}

                        <h4 className="rpg-skill-group-title mb-3">🗿 Artifact Item ({artifactItems.length})</h4>
                        {artifactItems.length === 0 ? (
                            <p className="text-secondary small mb-4">
                                Belum punya Artifact Item. <Link href={route('shop.category', 'artifact')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-2 mb-4">
                                {artifactItems.map((item) => (
                                    <div className="col-6 col-md-3" key={item.pivot.id}>
                                        <ItemGridCard
                                            item={item}
                                            isSelected={selectedItemPivotId === item.pivot.id}
                                            onClick={() => setSelectedItemPivotId(selectedItemPivotId === item.pivot.id ? null : item.pivot.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 className="rpg-skill-group-title mb-3" style={{ color: '#8b5cf6' }}>💠 Accession Item / Catalyst ({catalystItems.length})</h4>
                        {catalystItems.length === 0 ? (
                            <p className="text-secondary small mb-4">
                                Belum punya catalyst. <Link href={route('shop.category', 'accession')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-2 mb-4">
                                {catalystItems.map((item) => (
                                    <div className="col-6 col-md-3" key={item.pivot.id}>
                                        <div className="rpg-card d-flex align-items-center gap-2" style={{ '--accent': RARITY_ACCENT[item.rarity], padding: '0.6rem' }}>
                                            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                                                <img src={item.icon_path} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                                {/* Badge stack di pojok ikon (bukan teks "x5" terpisah lagi). */}
                                                {item.pivot.quantity > 1 && (
                                                    <span
                                                        style={{
                                                            position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16,
                                                            fontSize: '0.58rem', fontWeight: 700, color: '#0b0c12', background: '#c9a24b',
                                                            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '0 3px', fontFamily: 'var(--font-mono)', border: '1px solid var(--bg-panel)',
                                                        }}
                                                    >
                                                        {item.pivot.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.78rem' }}>{item.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 className="rpg-skill-group-title mb-3">🧪 Material ({materialItems.length})</h4>
                        {materialItems.length === 0 ? (
                            <p className="text-secondary small">Belum punya material.</p>
                        ) : (
                            <div className="row g-2">
                                {materialItems.map((item) => (
                                    <div className="col-6 col-md-3" key={item.pivot.id}>
                                        <div className="rpg-card d-flex align-items-center gap-2" style={{ '--accent': RARITY_ACCENT[item.rarity], padding: '0.6rem' }}>
                                            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                                                <img src={item.icon_path} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                                {item.pivot.quantity > 1 && (
                                                    <span
                                                        style={{
                                                            position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16,
                                                            fontSize: '0.58rem', fontWeight: 700, color: '#0b0c12', background: '#c9a24b',
                                                            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: '0 3px', fontFamily: 'var(--font-mono)', border: '1px solid var(--bg-panel)',
                                                        }}
                                                    >
                                                        {item.pivot.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.78rem' }}>{item.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
