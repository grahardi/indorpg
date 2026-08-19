import { Link, Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

function CharacterCard({ c, accent, isSelected, isUnavailable, onClick, badges }) {
    return (
        <div
            onClick={() => onClick(c.id, isUnavailable)}
            className="rpg-card"
            style={{
                '--accent': accent,
                cursor: isUnavailable ? 'not-allowed' : 'pointer',
                outline: isSelected ? `2px solid ${accent}` : 'none',
                opacity: isUnavailable ? 0.45 : 1,
            }}
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
                        {badges}
                    </div>
                    <div className="rpg-power-type">
                        {c.is_npc ? `Lv.${c.npc_display_level}` : `Lv.${c.level}`} &middot; {c.subclass?.name}
                    </div>
                </div>
                {isSelected && <span className="ms-auto" style={{ color: accent }}>✓</span>}
            </div>
        </div>
    );
}

export default function Index({ playerCharacters, npcCharacters }) {
    const { props } = usePage();
    // Karakter pemain: single-select (radio-style), otomatis kepilih yang
    // pertama. Kalau cuma punya 1 karakter, ya itu aja langsung "pass" -
    // gak perlu mikir milih.
    const [playerCharId, setPlayerCharId] = useState(playerCharacters[0]?.id ?? null);
    const [npcIds, setNpcIds] = useState([]);
    const [loading, setLoading] = useState(false);

    // Total party = 1 karakter pemain + sampai 2 NPC (maks 3 total).
    const selected = playerCharId ? [playerCharId, ...npcIds] : [];
    const canProceed = playerCharId !== null;

    function toggleNpc(id, isUnavailable) {
        if (isUnavailable) return;
        setNpcIds((prev) => prev.includes(id)
            ? prev.filter((c) => c !== id)
            : prev.length < 2 ? [...prev, id] : prev);
    }

    function quickMission() {
        setLoading(true);
        router.post(route('guild.quick-mission'), { character_ids: selected }, {
            onFinish: () => setLoading(false),
        });
    }

    return (
        <Layout>
            <Head title="Guild Adventure" />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                <h1 className="rpg-hero-title display-5 mb-2">Guild Adventure</h1>
                <p className="rpg-tagline mb-5">Karaktermu otomatis ikut, tinggal ajak NPC buat nemenin (opsional), baru tentukan misi cepat atau jelajah peta.</p>

                {props.errors?.mission && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        {props.errors.mission}
                    </div>
                )}
                {props.errors?.character_ids && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        {props.errors.character_ids}
                    </div>
                )}

                <h4 className="rpg-skill-group-title mb-3">Karaktermu</h4>

                {playerCharacters.length === 0 ? (
                    <p className="text-secondary mb-5">
                        Belum ada karakter. <Link href={route('characters.create')}>Buat karakter dulu</Link>.
                    </p>
                ) : playerCharacters.length === 1 ? (
                    <div className="row g-3 mb-5">
                        <div className="col-md-4">
                            <CharacterCard
                                c={playerCharacters[0]}
                                accent={CLASS_ACCENT[playerCharacters[0].subclass?.game_class?.slug] ?? '#8890a4'}
                                isSelected
                                isUnavailable={false}
                                onClick={() => {}}
                                badges={<span className="rpg-element-badge" style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.58rem' }}>Otomatis Ikut</span>}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="row g-3 mb-5">
                        {playerCharacters.map((c) => {
                            const accent = CLASS_ACCENT[c.subclass?.game_class?.slug] ?? '#8890a4';
                            const isFainted = c.current_hp <= 0;
                            return (
                                <div className="col-md-4" key={c.id}>
                                    <CharacterCard
                                        c={c}
                                        accent={accent}
                                        isSelected={playerCharId === c.id}
                                        isUnavailable={isFainted}
                                        onClick={() => !isFainted && setPlayerCharId(c.id)}
                                        badges={isFainted && (
                                            <span className="rpg-element-badge" style={{ '--accent': '#5b6178', color: '#5b6178', fontSize: '0.58rem' }}>Tumbang</span>
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                <h4 className="rpg-skill-group-title mb-3">Ajak NPC ({npcIds.length}/2, opsional)</h4>
                <p className="text-secondary small mb-3">NPC nemenin party kamu di battle, levelnya ngikutin karaktermu.</p>

                <div className="row g-3 mb-5">
                    {npcCharacters.map((c) => {
                        const isSelected = npcIds.includes(c.id);
                        const isUnavailable = c.is_busy;
                        return (
                            <div className="col-md-4" key={c.id}>
                                <CharacterCard
                                    c={c}
                                    accent="#8890a4"
                                    isSelected={isSelected}
                                    isUnavailable={isUnavailable}
                                    onClick={toggleNpc}
                                    badges={
                                        <>
                                            <span className="rpg-element-badge" style={{ '--accent': '#8890a4', fontSize: '0.58rem' }}>NPC</span>
                                            {c.is_busy && (
                                                <span className="rpg-element-badge" style={{ '--accent': '#b8433a', color: '#b8433a', fontSize: '0.58rem' }}>Sedang Misi</span>
                                            )}
                                        </>
                                    }
                                />
                            </div>
                        );
                    })}
                </div>

                <h4 className="rpg-skill-group-title mb-3">Pilih Aksi ({selected.length}/3 party)</h4>

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
                                {loading ? 'Mencari lawan...' : 'Langsung dicariin monster yang levelnya cocok sama party. Lanjut pilih Frontman sebelum battle mulai.'}
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
