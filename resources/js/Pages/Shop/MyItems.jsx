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

function itemStatLabel(item) {
    if (item.effect_stat === 'elemental_damage') {
        return `${item.element?.name ?? ''} Damage`.trim();
    }
    return STAT_LABEL[item.effect_stat] ?? item.effect_stat;
}

// Poin sacrifice per rarity (harus sama kayak AccessionController::levelUp()).
const RARITY_POINTS = { common: 1, rare: 3, ur: 8 };

// Simulasi kalkulasi level baru di CLIENT (buat preview real-time) - rumus
// SAMA PERSIS kayak backend (AccessionController::levelUp()), biar preview
// akurat sebelum submit.
function simulateLevelUp(currentLevel, points, maxLevel) {
    let level = currentLevel;
    let remaining = points;
    while (remaining > 0 && level < maxLevel) {
        const cost = level + 1;
        if (remaining < cost) break;
        remaining -= cost;
        level++;
    }
    return level;
}

function LevelUpPanel({ character, targetItem, onClose }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [mithril, setMithril] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Kandidat sacrifice: item Artifact biasa (bukan Accession), bukan SR/
    // Legendary, gak lagi di-equip, bukan item target itu sendiri.
    const candidates = character.items.filter((i) =>
        i.category !== 'accession' &&
        !['sr', 'legendary'].includes(i.rarity) &&
        !i.pivot.is_equipped &&
        i.pivot.id !== targetItem.pivot.id
    );

    function toggle(pivotId) {
        setSelectedIds((prev) => prev.includes(pivotId) ? prev.filter((id) => id !== pivotId) : [...prev, pivotId]);
    }

    const selectedItems = candidates.filter((i) => selectedIds.includes(i.pivot.id));
    const points = selectedItems.reduce((sum, i) => sum + (RARITY_POINTS[i.rarity] ?? 1), 0) + Number(mithril || 0);
    const currentLevel = targetItem.pivot.accession_level;
    const previewLevel = simulateLevelUp(currentLevel, points, 100);
    const willLevelUp = previewLevel > currentLevel;

    function submit() {
        if (!willLevelUp || submitting) return;
        setSubmitting(true);
        router.post(route('accession.level-up'), {
            character_id: character.id,
            character_item_id: targetItem.pivot.id,
            sacrifice_character_item_ids: selectedIds,
            mithril: Number(mithril || 0),
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => { setSelectedIds([]); setMithril(0); onClose(); },
        });
    }

    return (
        <div className="rpg-card mt-2 mb-3" style={{ '--accent': '#8b5cf6', padding: '1.25rem', background: 'var(--bg-panel-hover)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="rpg-subclass-name" style={{ fontSize: '0.95rem', color: '#8b5cf6' }}>
                    Level Up: {targetItem.name} (Lv.{currentLevel} → <span style={{ color: willLevelUp ? '#4a9960' : 'var(--text-muted)' }}>Lv.{previewLevel}</span>)
                </div>
                <button onClick={onClose} className="rpg-back-link" style={{ fontSize: '0.7rem' }}>Tutup</button>
            </div>

            <p className="text-secondary small mb-2">
                Pilih item Artifact yang mau dikorbanin (SR/Legendary & item yang lagi di-equip gak bisa dipilih), dan/atau isi Mithril.
            </p>

            <div className="row g-2 mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {candidates.length === 0 ? (
                    <p className="text-secondary small fst-italic">Gak ada item yang bisa dikorbanin (semua di-equip/SR/Legendary/kosong).</p>
                ) : candidates.map((item) => {
                    const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
                    const isSelected = selectedIds.includes(item.pivot.id);
                    return (
                        <div className="col-6 col-md-4" key={item.pivot.id}>
                            <button
                                onClick={() => toggle(item.pivot.id)}
                                className="w-100 text-start p-2"
                                style={{
                                    background: isSelected ? 'rgba(139,92,246,0.2)' : 'var(--bg-panel)',
                                    border: `2px solid ${isSelected ? '#8b5cf6' : 'var(--border-subtle)'}`,
                                    borderRadius: 8, fontSize: '0.72rem',
                                }}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <img src={item.icon_path ?? '/images/items/placeholder.png'} alt="" style={{ width: 28, height: 28, objectFit: 'contain', background: accent, borderRadius: 4, padding: 3 }} />
                                    <div style={{ minWidth: 0 }}>
                                        <div className="text-truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                                        <div style={{ color: accent, fontSize: '0.62rem' }}>{RARITY_LABEL[item.rarity]} · +{RARITY_POINTS[item.rarity] ?? 1}pt</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
                <label className="d-flex align-items-center gap-2 mb-0">
                    <span className="rpg-stat-label mb-0">Mithril:</span>
                    <input
                        type="number" min="0" max={character.mithril}
                        value={mithril}
                        onChange={(e) => setMithril(Math.max(0, Math.min(character.mithril, Number(e.target.value))))}
                        className="form-control form-control-sm bg-dark text-light border-secondary"
                        style={{ width: 90 }}
                    />
                    <span className="text-secondary small">/ {character.mithril} punya</span>
                </label>
                <span className="text-secondary small">Total poin: <strong style={{ color: '#8b5cf6' }}>{points}</strong></span>
                <button
                    onClick={submit}
                    disabled={!willLevelUp || submitting}
                    className="btn btn-sm ms-auto"
                    style={{
                        background: willLevelUp ? 'rgba(139,92,246,0.2)' : 'transparent',
                        border: `1px solid ${willLevelUp ? '#8b5cf6' : 'var(--border-subtle)'}`,
                        color: willLevelUp ? '#8b5cf6' : 'var(--text-muted)',
                    }}
                >
                    {submitting ? 'Memproses...' : 'Konfirmasi Level Up'}
                </button>
            </div>
        </div>
    );
}

// Sama persis kayak Item::accessionEffectiveValue() di backend - dihitung di
// client karena backend gak nge-expose ini sebagai field JSON otomatis.
function accessionEffectiveValue(item, level) {
    if (item.category !== 'accession' || level <= 1) return item.effect_value;
    const milestonesPassed = Math.floor(level / 20);
    const linearBonus = 1 + (level - 1) * 0.02;
    const milestoneBonus = 1 + milestonesPassed * 0.15;
    return Math.round(item.effect_value * linearBonus * milestoneBonus);
}

function ItemCard({ item, isAccession }) {
    const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
    return (
        <div className="rpg-card h-100" style={{ '--accent': accent, opacity: item.pivot.is_equipped ? 1 : 0.8 }}>
            <div className="d-flex align-items-center gap-2 mb-1">
                <img src={item.icon_path ?? '/images/items/placeholder.png'} alt={item.name} style={{ width: 40, height: 40, objectFit: 'contain', background: accent, borderRadius: 6, padding: 4 }} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.name}</div>
                    <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.55rem' }}>{RARITY_LABEL[item.rarity]}</span>
                    {item.pivot.is_equipped && <span className="ms-1" style={{ color: '#c9a24b', fontSize: '0.6rem' }}>★ Equipped</span>}
                </div>
            </div>
            <div className="rpg-power-type mb-1" style={{ fontSize: '0.72rem' }}>
                +{isAccession ? accessionEffectiveValue(item, item.pivot.accession_level) : item.effect_value} {itemStatLabel(item)}
            </div>
            {isAccession && (
                <div style={{ fontSize: '0.68rem', color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                    Level {item.pivot.accession_level} / 100
                </div>
            )}
        </div>
    );
}

export default function MyItems({ characters }) {
    const { props } = usePage();
    const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? null);
    const [levelingItemId, setLevelingItemId] = useState(null);

    const character = characters.find((c) => c.id === selectedCharacterId);
    const accessionItems = character?.items.filter((i) => i.category === 'accession') ?? [];
    const artifactItems = character?.items.filter((i) => i.category !== 'accession') ?? [];

    return (
        <Layout>
            <Head title="Item Saya" />
            <div className="container py-5">
                <Link href={route('shop.index')} className="rpg-back-link mb-3">&larr; Shop</Link>
                <h1 className="rpg-hero-title display-5 mb-2 mt-3">🎒 Item Saya</h1>
                <p className="rpg-tagline mb-4">Kelola item & level-up Accession Item dengan korbanin item Artifact + Mithril.</p>

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
                                onChange={(e) => { setSelectedCharacterId(Number(e.target.value)); setLevelingItemId(null); }}
                            >
                                {characters.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold / {c.mithril} Mithril</option>
                                ))}
                            </select>
                        </div>

                        <h4 className="rpg-skill-group-title mb-3" style={{ color: '#8b5cf6' }}>💠 Accession Item ({accessionItems.length})</h4>
                        {accessionItems.length === 0 ? (
                            <p className="text-secondary small mb-4">
                                Belum punya Accession Item. <Link href={route('shop.category', 'accession')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-3 mb-4">
                                {accessionItems.map((item) => (
                                    <div className="col-md-6" key={item.pivot.id}>
                                        <ItemCard item={item} isAccession />
                                        {levelingItemId === item.pivot.id ? (
                                            <LevelUpPanel character={character} targetItem={item} onClose={() => setLevelingItemId(null)} />
                                        ) : (
                                            <button
                                                onClick={() => setLevelingItemId(item.pivot.id)}
                                                className="rpg-back-link mt-2 w-100"
                                                style={{ fontSize: '0.75rem', color: '#8b5cf6', borderColor: '#8b5cf6' }}
                                                disabled={item.pivot.accession_level >= 100}
                                            >
                                                {item.pivot.accession_level >= 100 ? 'Level Maksimal' : '⬆ Level Up'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 className="rpg-skill-group-title mb-3">🗿 Artifact Item ({artifactItems.length})</h4>
                        {artifactItems.length === 0 ? (
                            <p className="text-secondary small">
                                Belum punya Artifact Item. <Link href={route('shop.category', 'artifact')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-3">
                                {artifactItems.map((item) => (
                                    <div className="col-md-4 col-lg-3" key={item.pivot.id}>
                                        <ItemCard item={item} isAccession={false} />
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
