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

// Catalyst yang cocok per rarity - HARUS SAMA PERSIS kayak
// AccessionController::CATALYST_BY_RARITY di backend.
const CATALYST_BY_RARITY = {
    common: 'Accession Stone',
    rare: 'Accession Crystal',
    sr: 'Accession Orb',
    ur: 'Accession Core',
    legendary: 'Accession Relic',
};

const RARITY_POINTS = { common: 1, rare: 3, ur: 8 };

// Sama persis kayak Item::accessionEffectiveValue() di backend.
function accessionEffectiveValue(item, level) {
    if (item.category !== 'artifact' || level <= 0) return item.effect_value;
    const tierIndex = Math.floor(level / 20);
    return Math.round(item.effect_value * (1 + tierIndex * 0.25));
}

function LevelUpPanel({ character, targetItem, onClose }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Kandidat sacrifice: item ARTIFACT lain (bukan diri sendiri), bukan SR/
    // Legendary, gak lagi di-equip.
    const candidates = character.items.filter((i) =>
        i.category === 'artifact' &&
        !['sr', 'legendary'].includes(i.rarity) &&
        !i.pivot.is_equipped &&
        i.pivot.id !== targetItem.pivot.id
    );

    function toggle(pivotId) {
        setSelectedIds((prev) => prev.includes(pivotId) ? prev.filter((id) => id !== pivotId) : [...prev, pivotId]);
    }

    const selectedItems = candidates.filter((i) => selectedIds.includes(i.pivot.id));
    const points = selectedItems.reduce((sum, i) => sum + (RARITY_POINTS[i.rarity] ?? 1), 0);

    const currentLevel = targetItem.pivot.accession_level;
    const unlockedTier = targetItem.pivot.unlocked_tier ?? 20;
    const catalystName = CATALYST_BY_RARITY[targetItem.rarity] ?? 'Accession Stone';
    const ownedCatalyst = character.items.find((i) => i.name === catalystName && i.category === 'accession');
    const catalystQty = ownedCatalyst ? (ownedCatalyst.pivot.quantity ?? 1) : 0;

    // Simulasi preview level di client - SEDERHANA & PASTI BENAR: cuma
    // simulasi sampai unlockedTier (gak coba nebak-nebak perpanjangan
    // catalyst di sini, biar gak ada celah beda sama logic backend yang
    // sebenarnya). Kalau masih ada sisa poin abis mentok DAN punya catalyst,
    // kasih tau aja infonya - backend yang beneran proses perpanjangannya.
    let previewLevel = currentLevel;
    let remaining = points;
    while (remaining > 0 && previewLevel < unlockedTier) {
        const cost = previewLevel + 1;
        if (remaining < cost) break;
        remaining -= cost;
        previewLevel++;
    }
    const hitCapWithPointsLeft = previewLevel >= unlockedTier && remaining > 0 && unlockedTier < 100;
    const willNeedCatalyst = hitCapWithPointsLeft && catalystQty > 0;
    const willLevelUp = previewLevel > currentLevel || willNeedCatalyst;

    function submit() {
        if (!willLevelUp || submitting) return;
        setSubmitting(true);
        router.post(route('accession.level-up'), {
            character_id: character.id,
            character_item_id: targetItem.pivot.id,
            sacrifice_character_item_ids: selectedIds,
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => { setSelectedIds([]); onClose(); },
        });
    }

    return (
        <div className="rpg-card mt-2 mb-3" style={{ '--accent': '#8b5cf6', padding: '1.25rem', background: 'var(--bg-panel-hover)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="rpg-subclass-name" style={{ fontSize: '0.95rem', color: '#8b5cf6' }}>
                    Level Up: {targetItem.name} (Lv.{currentLevel} → <span style={{ color: willLevelUp ? '#4a9960' : 'var(--text-muted)' }}>Lv.{previewLevel}{willNeedCatalyst ? '+' : ''}</span>)
                </div>
                <button onClick={onClose} className="rpg-back-link" style={{ fontSize: '0.7rem' }}>Tutup</button>
            </div>

            <p className="text-secondary small mb-1">
                Bebas naik sampai level <strong>{unlockedTier}</strong> lewat sacrifice item Artifact lain (SR/Legendary & yang di-equip gak bisa dipilih).
            </p>
            <p className="text-secondary small mb-2">
                Buat nembus ke level {unlockedTier + 1}+, butuh 1 <strong style={{ color: '#8b5cf6' }}>{catalystName}</strong> (punya: {catalystQty}).
                {catalystQty === 0 && <> <Link href={route('shop.category', 'accession')}>Beli di sini</Link>.</>}
            </p>

            <div className="row g-2 mb-3" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {candidates.length === 0 ? (
                    <p className="text-secondary small fst-italic">Gak ada item Artifact yang bisa dikorbanin (semua di-equip/SR/Legendary/kosong).</p>
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
                <span className="text-secondary small">Total poin: <strong style={{ color: '#8b5cf6' }}>{points}</strong></span>
                {willNeedCatalyst && (
                    <span className="text-secondary small">🌟 Bakal pakai 1 {catalystName}</span>
                )}
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

function ItemCard({ item, showLevel }) {
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
                +{showLevel ? accessionEffectiveValue(item, item.pivot.accession_level) : item.effect_value} {itemStatLabel(item)}
            </div>
            {showLevel && item.pivot.accession_level > 0 && (
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
    // Item yang lagi di-equip ditampilin DULUAN (di atas).
    const byEquippedFirst = (a, b) => (b.pivot.is_equipped ? 1 : 0) - (a.pivot.is_equipped ? 1 : 0);
    const artifactItems = (character?.items.filter((i) => i.category === 'artifact') ?? []).sort(byEquippedFirst);
    const catalystItems = character?.items.filter((i) => i.category === 'accession') ?? [];
    const materialItems = character?.items.filter((i) => i.category === 'material') ?? [];

    return (
        <Layout>
            <Head title="Item Saya" />
            <div className="container py-5">
                <Link href={route('shop.index')} className="rpg-back-link mb-3">&larr; Shop</Link>
                <h1 className="rpg-hero-title display-5 mb-2 mt-3">🎒 Item Saya</h1>
                <p className="rpg-tagline mb-4">
                    Kelola item. Level-up Artifact Item pakai sacrifice item lain — naik bebas sampai kelipatan 20,
                    abis itu wajib konsumsi 1 Accession Item (catalyst) yang cocok rarity-nya buat nembus ke blok berikutnya.
                </p>

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
                                    <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold</option>
                                ))}
                            </select>
                        </div>

                        <h4 className="rpg-skill-group-title mb-3">🗿 Artifact Item ({artifactItems.length})</h4>
                        {artifactItems.length === 0 ? (
                            <p className="text-secondary small mb-4">
                                Belum punya Artifact Item. <Link href={route('shop.category', 'artifact')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-3 mb-4">
                                {artifactItems.map((item) => (
                                    <div className="col-md-6" key={item.pivot.id}>
                                        <ItemCard item={item} showLevel />
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
                                            <img src={item.icon_path} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                            <div>
                                                <div style={{ fontSize: '0.78rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>x{item.pivot.quantity ?? 1}</div>
                                            </div>
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
                                            <img src={item.icon_path} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                            <div>
                                                <div style={{ fontSize: '0.78rem' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>x{item.pivot.quantity ?? 1}</div>
                                            </div>
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
