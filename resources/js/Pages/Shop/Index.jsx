import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

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

export default function Index({ items, characters }) {
    const { props } = usePage();
    const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id ?? null);
    const { post, processing } = useForm({});

    const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

    function buy(item) {
        if (!selectedCharacterId) return;
        if (!confirm(`Beli "${item.name}" seharga ${item.price} Gold buat ${selectedCharacter?.name}?`)) return;
        post(route('shop.buy'), {
            data: { item_id: item.id, character_id: selectedCharacterId },
            preserveScroll: true,
        });
    }

    return (
        <Layout>
            <Head title="Shop" />
            <div className="container py-5">
                <h1 className="rpg-hero-title display-5 mb-2">Shop</h1>
                <p className="rpg-tagline mb-4">Beli item pakai Gold hasil menang battle. Harga & kelangkaan naik seiring rarity.</p>

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
                            style={{ maxWidth: 220 }}
                            value={selectedCharacterId ?? ''}
                            onChange={(e) => setSelectedCharacterId(Number(e.target.value))}
                        >
                            {characters.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — {c.gold} Gold</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="row g-3">
                    {items.map((item) => {
                        const accent = RARITY_ACCENT[item.rarity] ?? '#8890a4';
                        const canAfford = selectedCharacter && selectedCharacter.gold >= item.price;
                        return (
                            <div className="col-md-6 col-lg-4" key={item.id}>
                                <div className="rpg-card h-100" style={{ '--accent': accent }}>
                                    <div className="d-flex align-items-center gap-3 mb-2">
                                        <img
                                            src={item.icon_path ?? '/images/items/placeholder.png'}
                                            alt={item.name}
                                            style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="rpg-subclass-name" style={{ fontSize: '1rem' }}>{item.name}</div>
                                            </div>
                                            <span className="rpg-element-badge" style={{ '--accent': accent, color: accent, fontSize: '0.6rem' }}>
                                                {RARITY_LABEL[item.rarity]}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-secondary small mb-2">{item.description}</p>
                                    <div className="rpg-power-type mb-2">
                                        +{item.effect_value} {STAT_LABEL[item.effect_stat] ?? item.effect_stat}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#c9a24b' }}>
                                            {item.price} Gold
                                        </span>
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
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
}
