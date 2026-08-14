import { Link, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

export default function Index({ characters }) {
    const { props } = usePage();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);

    function toggle(id) {
        setSelected((prev) => prev.includes(id)
            ? prev.filter((c) => c !== id)
            : prev.length < 3 ? [...prev, id] : prev);
    }

    function quickMission() {
        setLoading(true);
        router.post(route('guild.quick-mission'), { character_ids: selected }, {
            onFinish: () => setLoading(false),
        });
    }

    const canProceed = selected.length >= 2;

    return (
        <Layout>
            <Head title="Guild Adventure" />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                <h1 className="rpg-hero-title display-5 mb-2">Guild Adventure</h1>
                <p className="rpg-tagline mb-5">Pilih 2-3 karakter dulu, baru tentukan mau ambil misi cepat atau jelajah peta sendiri.</p>

                {props.errors?.mission && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        {props.errors.mission}
                    </div>
                )}

                <h4 className="rpg-skill-group-title mb-3">1. Pilih Party</h4>

                {characters.length === 0 && (
                    <p className="text-secondary">
                        Belum ada karakter. <Link href={route('characters.create')}>Buat karakter dulu</Link>.
                    </p>
                )}

                <div className="row g-3 mb-5">
                    {characters.map((c) => {
                        const accent = CLASS_ACCENT[c.subclass?.game_class?.slug] ?? '#8890a4';
                        const isSelected = selected.includes(c.id);
                        return (
                            <div className="col-md-4" key={c.id}>
                                <div
                                    onClick={() => toggle(c.id)}
                                    className="rpg-card"
                                    style={{ '--accent': accent, cursor: 'pointer', outline: isSelected ? `2px solid ${accent}` : 'none' }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        {c.subclass?.avatar_path ? (
                                            <img src={c.subclass?.avatar_path} alt={c.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="rpg-badge-hex" style={{ '--accent': accent, width: 40, height: 40, fontSize: '0.9rem' }}>
                                                {c.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="rpg-subclass-name d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                                            {c.name}
                                            {c.is_npc && (
                                                <span className="rpg-element-badge" style={{ '--accent': '#8890a4', fontSize: '0.58rem' }}>NPC</span>
                                            )}
                                        </div>
                                            <div className="rpg-power-type">Lv.{c.level} &middot; {c.subclass?.name}</div>
                                        </div>
                                        {isSelected && <span className="ms-auto" style={{ color: accent }}>✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <h4 className="rpg-skill-group-title mb-3">2. Pilih Aksi ({selected.length}/3 dipilih)</h4>

                <div className="row g-3">
                    <div className="col-md-6">
                        <button
                            onClick={quickMission}
                            disabled={!canProceed || loading}
                            className="rpg-card w-100 text-start"
                            style={{ '--accent': '#c9a24b', border: 'none', opacity: canProceed ? 1 : 0.5 }}
                        >
                            <div className="rpg-subclass-name">⚡ Misi Cepat</div>
                            <p className="rpg-skill-desc mt-1 mb-0">
                                {loading ? 'Mencari lawan...' : 'Langsung dicariin monster yang levelnya cocok sama party. Battle otomatis jalan begitu ketemu.'}
                            </p>
                        </button>
                    </div>
                    <div className="col-md-6">
                        <button
                            onClick={() => router.post(route('guild.explore'), { character_ids: selected })}
                            disabled={!canProceed}
                            className="rpg-card w-100 text-start"
                            style={{ '--accent': '#3f8c94', border: 'none', opacity: canProceed ? 1 : 0.5 }}
                        >
                            <div className="rpg-subclass-name">🗺️ Jelajahi Peta</div>
                            <p className="rpg-skill-desc mt-1 mb-0">
                                Pilih sendiri map dan titik spawn mana yang mau dijelajahi.
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
