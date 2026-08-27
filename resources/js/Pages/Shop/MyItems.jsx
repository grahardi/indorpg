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

const TIERS = [0, 20, 40, 60, 80, 100];

// Sama persis kayak Item::accessionEffectiveValue() di backend.
function accessionEffectiveValue(item, level) {
    if (item.category !== 'accession' || level <= 0) return item.effect_value;
    const tierIndex = Math.floor(level / 20);
    return Math.round(item.effect_value * (1 + tierIndex * 0.25));
}

function RecipePanel({ character, targetItem, recipe, materialsById, onClose }) {
    const [submitting, setSubmitting] = useState(false);
    const nextTier = TIERS.find((t) => t > targetItem.pivot.accession_level);
    const partNumber = TIERS.indexOf(nextTier);

    if (!recipe) {
        return (
            <div className="rpg-card mt-2 mb-3" style={{ '--accent': '#b8433a', padding: '1rem' }}>
                <p className="text-secondary small mb-0">Belum ada resep buat tier {nextTier} - hubungi admin.</p>
                <button onClick={onClose} className="rpg-back-link mt-2" style={{ fontSize: '0.7rem' }}>Tutup</button>
            </div>
        );
    }

    const requirements = Object.entries(recipe.materials).map(([materialId, qtyNeeded]) => {
        const material = materialsById[materialId];
        const have = character.materialQuantities[materialId] ?? 0;
        return { material, qtyNeeded, have, enough: have >= qtyNeeded };
    });

    const canCraft = requirements.every((r) => r.enough) && requirements.length > 0;

    function submit() {
        if (!canCraft || submitting) return;
        setSubmitting(true);
        router.post(route('accession.level-up'), {
            character_id: character.id,
            character_item_id: targetItem.pivot.id,
        }, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="rpg-card mt-2 mb-3" style={{ '--accent': '#8b5cf6', padding: '1.25rem', background: 'var(--bg-panel-hover)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="rpg-subclass-name" style={{ fontSize: '0.95rem', color: '#8b5cf6' }}>
                    Craft Part {partNumber}: {targetItem.name} → Tier {nextTier}
                </div>
                <button onClick={onClose} className="rpg-back-link" style={{ fontSize: '0.7rem' }}>Tutup</button>
            </div>

            <p className="text-secondary small mb-2">Butuh material berikut buat naik ke tier {nextTier}:</p>

            <div className="d-flex flex-column gap-2 mb-3">
                {requirements.map((r, i) => (
                    <div key={i} className="d-flex align-items-center gap-2">
                        {r.material && (
                            <img src={r.material.icon_path} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        )}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{r.material?.name ?? `Material #${Object.keys(materialsById)}`}</span>
                        <span
                            className="ms-auto"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: r.enough ? '#4a9960' : '#b8433a' }}
                        >
                            {r.have} / {r.qtyNeeded}
                        </span>
                    </div>
                ))}
            </div>

            <button
                onClick={submit}
                disabled={!canCraft || submitting}
                className="btn btn-sm w-100"
                style={{
                    background: canCraft ? 'rgba(139,92,246,0.2)' : 'transparent',
                    border: `1px solid ${canCraft ? '#8b5cf6' : 'var(--border-subtle)'}`,
                    color: canCraft ? '#8b5cf6' : 'var(--text-muted)',
                }}
            >
                {submitting ? 'Memproses...' : canCraft ? `Craft ke Tier ${nextTier}` : 'Material Belum Cukup'}
            </button>
        </div>
    );
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
                    Tier {item.pivot.accession_level} / 100 {item.pivot.accession_level > 0 && `(Part ${TIERS.indexOf(item.pivot.accession_level)})`}
                </div>
            )}
        </div>
    );
}

export default function MyItems({ characters, recipes, allMaterials = [] }) {
    const { props } = usePage();
    const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? null);
    const [craftingItemId, setCraftingItemId] = useState(null);

    const character = characters.find((c) => c.id === selectedCharacterId);
    const rawAccessionItems = character?.items.filter((i) => i.category === 'accession') ?? [];
    const artifactItems = character?.items.filter((i) => i.category === 'artifact') ?? [];
    const materialItems = character?.items.filter((i) => i.category === 'material') ?? [];

    // Kuantitas material milik karakter ini, dikelompokkin per item_id (bisa
    // numpuk di beberapa baris kalau kebetulan gitu, dijumlahin).
    const materialQuantities = {};
    materialItems.forEach((m) => {
        materialQuantities[m.id] = (materialQuantities[m.id] ?? 0) + (m.pivot.quantity ?? 1);
    });
    // Dari SEMUA material yang ADA di game (bukan cuma yang dipunya karakter) -
    // biar panel resep tetap bisa nampilin nama/ikon walau karakter punya 0.
    const materialsById = {};
    allMaterials.forEach((m) => { materialsById[m.id] = m; });

    // Enrich character object dengan materialQuantities biar gampang dipass ke RecipePanel.
    const enrichedCharacter = character ? { ...character, materialQuantities } : null;

    return (
        <Layout>
            <Head title="Item Saya" />
            <div className="container py-5">
                <Link href={route('shop.index')} className="rpg-back-link mb-3">&larr; Shop</Link>
                <h1 className="rpg-hero-title display-5 mb-2 mt-3">🎒 Item Saya</h1>
                <p className="rpg-tagline mb-4">Kelola item & craft Accession Item ke tier berikutnya pakai resep material.</p>

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
                                onChange={(e) => { setSelectedCharacterId(Number(e.target.value)); setCraftingItemId(null); }}
                            >
                                {characters.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold</option>
                                ))}
                            </select>
                        </div>

                        <h4 className="rpg-skill-group-title mb-3" style={{ color: '#8b5cf6' }}>💠 Accession Item ({rawAccessionItems.length})</h4>
                        {rawAccessionItems.length === 0 ? (
                            <p className="text-secondary small mb-4">
                                Belum punya Accession Item. <Link href={route('shop.category', 'accession')}>Beli di sini</Link>.
                            </p>
                        ) : (
                            <div className="row g-3 mb-4">
                                {rawAccessionItems.map((item) => {
                                    const nextTier = TIERS.find((t) => t > item.pivot.accession_level);
                                    const recipe = recipes[item.id]?.find((r) => r.tier === nextTier);
                                    return (
                                        <div className="col-md-6" key={item.pivot.id}>
                                            <ItemCard item={item} isAccession />
                                            {craftingItemId === item.pivot.id ? (
                                                <RecipePanel
                                                    character={enrichedCharacter}
                                                    targetItem={item}
                                                    recipe={recipe}
                                                    materialsById={materialsById}
                                                    onClose={() => setCraftingItemId(null)}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setCraftingItemId(item.pivot.id)}
                                                    className="rpg-back-link mt-2 w-100"
                                                    style={{ fontSize: '0.75rem', color: '#8b5cf6', borderColor: '#8b5cf6' }}
                                                    disabled={!nextTier}
                                                >
                                                    {!nextTier ? 'Tier Maksimal' : `⬆ Craft ke Tier ${nextTier}`}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <h4 className="rpg-skill-group-title mb-3">🧪 Material ({materialItems.length})</h4>
                        {materialItems.length === 0 ? (
                            <p className="text-secondary small mb-4">Belum punya material. Beli di halaman Accession Item atau dapetin dari battle.</p>
                        ) : (
                            <div className="row g-2 mb-4">
                                {Object.values(materialsById).map((m) => (
                                    <div className="col-6 col-md-3" key={m.id}>
                                        <div className="rpg-card d-flex align-items-center gap-2" style={{ '--accent': RARITY_ACCENT[m.rarity], padding: '0.6rem' }}>
                                            <img src={m.icon_path} alt={m.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                            <div>
                                                <div style={{ fontSize: '0.78rem' }}>{m.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>x{materialQuantities[m.id]}</div>
                                            </div>
                                        </div>
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
