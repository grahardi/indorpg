import { Head, Link, useForm, usePage } from '@inertiajs/react';
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

const ITEMS_PER_PAGE = 10;
const RARITY_FILTERS = ['all', 'common', 'rare', 'sr', 'ur', 'legendary'];

export default function Category({ items, materials = [], characters, category }) {
    const { props } = usePage();
    const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? null);
    const [rarityFilter, setRarityFilter] = useState('all');
    const [page, setPage] = useState(0);
    const { post, processing } = useForm({});

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
    const isAccession = category === 'accession';

    const filteredItems = rarityFilter === 'all' ? items : items.filter((i) => i.rarity === rarityFilter);
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
    const pageItems = filteredItems.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

    function selectRarity(r) {
        setRarityFilter(r);
        setPage(0);
    }

    function buy(item, quantity = 1) {
        if (!selectedCharacterId) return;
        const totalPrice = item.price * quantity;
        if (!confirm(`Beli "${item.name}"${quantity > 1 ? ` x${quantity}` : ''} seharga ${totalPrice} Gold buat ${selectedCharacter?.name}?`)) return;
        post(route('shop.buy'), {
            data: { item_id: item.id, character_id: selectedCharacterId, quantity },
            preserveScroll: true,
        });
    }

    return (
        <Layout>
            <Head title={isAccession ? 'Accession Item' : 'Artifact Item'} />
            <div className="container py-5">
                <Link href={route('shop.index')} className="rpg-back-link mb-3">&larr; Shop</Link>
                <h1 className="rpg-hero-title display-5 mb-2 mt-3">{isAccession ? '💠 Accession Item' : '🗿 Artifact Item'}</h1>
                <p className="rpg-tagline mb-4">
                    {isAccession
                        ? 'Catalyst sekali pakai - konsumsi buat nembus batas kelipatan 20 level pas nge-level-in Artifact Item di "Item Saya" (via sacrifice).'
                        : 'Item standar - bonus stat langsung, bisa di-level lewat sacrifice item lain di "Item Saya".'}
                </p>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}
                {props.errors?.gold && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        {props.errors.gold}
                    </div>
                )}

                {characters.length === 0 ? (
                    <p className="text-secondary">Belum ada karakter. Buat karakter dulu buat bisa belanja.</p>
                ) : (
                    <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                        <label className="rpg-stat-label mb-0">Belanja buat:</label>
                        <select
                            className="form-select form-select-sm bg-dark text-light border-secondary"
                            style={{ maxWidth: 260 }}
                            value={selectedCharacterId ?? ''}
                            onChange={(e) => setSelectedCharacterId(Number(e.target.value))}
                        >
                            {characters.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold{isAccession ? ` / ${c.mithril} Mithril` : ''}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="d-flex gap-2 flex-wrap mb-4">
                    {RARITY_FILTERS.map((r) => {
                        const isActive = rarityFilter === r;
                        const accent = r === 'all' ? '#c9a24b' : RARITY_ACCENT[r];
                        return (
                            <button
                                key={r}
                                onClick={() => selectRarity(r)}
                                className="btn btn-sm"
                                style={{
                                    background: isActive ? 'var(--bg-panel-hover)' : 'transparent',
                                    border: `1px solid ${isActive ? accent : 'var(--border-subtle)'}`,
                                    color: isActive ? accent : 'var(--text-muted)',
                                }}
                            >
                                {r === 'all' ? 'Semua' : RARITY_LABEL[r]}
                            </button>
                        );
                    })}
                </div>

                {filteredItems.length === 0 ? (
                    <p className="text-secondary">
                        {isAccession ? 'Belum ada Accession Item tersedia - cek lagi nanti.' : 'Gak ada item di rarity ini.'}
                    </p>
                ) : (
                    <div className="row g-3">
                        {pageItems.map((item) => {
                            const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
                            const canAfford = selectedCharacter && selectedCharacter.gold >= item.price;
                            return (
                                <div className="col-md-6 col-lg-4" key={item.id}>
                                    <div className="rpg-card h-100" style={{ '--accent': accent }}>
                                        <div className="d-flex align-items-center gap-3 mb-2">
                                            <div style={{ width: 56, height: 56, borderRadius: 8, background: accent, flexShrink: 0, padding: 6, display: 'flex' }}>
                                                <img
                                                    src={item.icon_path ?? '/images/items/placeholder.png'}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="rpg-subclass-name" style={{ fontSize: '1rem' }}>{item.name}</div>
                                                </div>
                                                <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.6rem' }}>
                                                    {RARITY_LABEL[item.rarity]}
                                                </span>
                                                {isAccession && (
                                                    <span className="rpg-element-badge ms-1" style={{ '--accent': '#8b5cf6', color: '#8b5cf6', fontSize: '0.6rem' }}>
                                                        Catalyst
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-secondary small mb-2">{item.description}</p>
                                        {!isAccession && (
                                            <div className="rpg-power-type mb-2">
                                                +{item.effect_value} {itemStatLabel(item)}
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#c9a24b' }}>
                                                {item.price} Gold{isAccession && '/pcs'}
                                            </span>
                                            {isAccession ? (
                                                <div className="d-flex gap-1">
                                                    <button
                                                        onClick={() => buy(item, 1)}
                                                        className="btn btn-sm"
                                                        disabled={!canAfford || processing}
                                                        style={{ background: canAfford ? 'var(--bg-panel-hover)' : 'transparent', border: `1px solid ${canAfford ? accent : 'var(--border-subtle)'}`, color: canAfford ? accent : 'var(--text-muted)' }}
                                                    >
                                                        x1
                                                    </button>
                                                    <button
                                                        onClick={() => buy(item, 10)}
                                                        className="btn btn-sm"
                                                        disabled={!selectedCharacter || selectedCharacter.gold < item.price * 10 || processing}
                                                        style={{ background: 'var(--bg-panel-hover)', border: `1px solid ${accent}`, color: accent }}
                                                    >
                                                        x10
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => buy(item)}
                                                    className="btn btn-sm"
                                                    disabled={!canAfford || processing}
                                                    style={{
                                                        background: canAfford ? 'var(--bg-panel-hover)' : 'transparent',
                                                        border: `1px solid ${canAfford ? accent : 'var(--border-subtle)'}`,
                                                        color: canAfford ? accent : 'var(--text-muted)',
                                                    }}
                                                >
                                                    Beli
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="rpg-back-link"
                            style={{ opacity: page === 0 ? 0.4 : 1 }}
                        >
                            &larr;
                        </button>
                        <span className="text-secondary small" style={{ fontFamily: 'var(--font-mono)' }}>
                            Halaman {page + 1} / {totalPages} ({filteredItems.length} item)
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="rpg-back-link"
                            style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}
                        >
                            &rarr;
                        </button>
                    </div>
                )}

                {isAccession && materials.length > 0 && (
                    <>
                        <h4 className="rpg-skill-group-title mt-5 mb-3">🧪 Bahan Crafting (buat naik tier Accession Item)</h4>
                        <div className="row g-3">
                            {materials.map((mat) => {
                                const accent = RARITY_ACCENT[mat.rarity] ?? '#8890a4';
                                const canAfford = selectedCharacter && selectedCharacter.gold >= mat.price;
                                return (
                                    <div className="col-md-6 col-lg-4" key={mat.id}>
                                        <div className="rpg-card h-100" style={{ '--accent': accent }}>
                                            <div className="d-flex align-items-center gap-3 mb-2">
                                                <img
                                                    src={mat.icon_path ?? '/images/items/placeholder.png'}
                                                    alt={mat.name}
                                                    style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }}
                                                />
                                                <div className="flex-grow-1">
                                                    <div className="rpg-subclass-name" style={{ fontSize: '0.95rem' }}>{mat.name}</div>
                                                    <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.58rem' }}>
                                                        {RARITY_LABEL[mat.rarity]}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#c9a24b' }}>
                                                    {mat.price} Gold/pcs
                                                </span>
                                                <div className="d-flex gap-1">
                                                    <button
                                                        onClick={() => buy(mat, 1)}
                                                        className="btn btn-sm"
                                                        disabled={!canAfford || processing}
                                                        style={{ background: canAfford ? 'var(--bg-panel-hover)' : 'transparent', border: `1px solid ${canAfford ? accent : 'var(--border-subtle)'}`, color: canAfford ? accent : 'var(--text-muted)' }}
                                                    >
                                                        x1
                                                    </button>
                                                    <button
                                                        onClick={() => buy(mat, 10)}
                                                        className="btn btn-sm"
                                                        disabled={!selectedCharacter || selectedCharacter.gold < mat.price * 10 || processing}
                                                        style={{ background: 'var(--bg-panel-hover)', border: `1px solid ${accent}`, color: accent }}
                                                    >
                                                        x10
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
