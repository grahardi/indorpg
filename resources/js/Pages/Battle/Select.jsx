import { Link, Head, useForm, usePage } from '@inertiajs/react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

export default function Select({ encounter, characters, preselected = [] }) {
    const { props } = usePage();
    const { data, setData, post, processing, errors } = useForm({
        character_ids: preselected,
        frontman_character_id: null,
    });

    function toggle(id, isUnavailable) {
        if (isUnavailable) return;
        const next = data.character_ids.includes(id)
            ? data.character_ids.filter((c) => c !== id)
            : data.character_ids.length < 3 ? [...data.character_ids, id] : data.character_ids;
        setData('character_ids', next);
        // Kalau frontman yang dipilih ke-un-select, reset pilihan frontman.
        if (!next.includes(data.frontman_character_id)) {
            setData('frontman_character_id', null);
        }
    }

    function submit(e) {
        e.preventDefault();
        post(route('encounters.start', encounter.id));
    }

    const selectedCharacters = characters.filter((c) => data.character_ids.includes(c.id));

    return (
        <Layout>
            <Head title="Pilih Party" />
            <div className="container py-5" style={{ maxWidth: 720 }}>
                <Link href={route('maps.index')} className="rpg-back-link mb-4">
                    &larr; Peta
                </Link>

                <div className="rpg-card mb-4" style={{ '--accent': '#b8433a' }}>
                    <div className="rpg-subclass-name">{encounter.monster.name} muncul!</div>
                    <p className="rpg-power-type mb-0">
                        Kelas {encounter.monster.class_rank} &middot; {encounter.monster.type}
                    </p>
                </div>

                <h4 className="rpg-skill-group-title mb-3">Pilih 2-3 Karakter</h4>

                {characters.length === 0 && (
                    <p className="text-secondary">
                        Belum ada karakter. <Link href={route('characters.create')}>Buat karakter dulu</Link>.
                    </p>
                )}

                <div className="row g-3 mb-4">
                    {characters.map((c) => {
                        const accent = CLASS_ACCENT[c.subclass?.game_class?.slug] ?? '#8890a4';
                        const selected = data.character_ids.includes(c.id);
                        const isMine = props.auth?.user?.id && c.user_id === props.auth.user.id;
                        const isFainted = c.current_hp <= 0;
                        const isUnavailable = c.is_busy || isFainted;
                        return (
                            <div className="col-md-4" key={c.id}>
                                <div
                                    onClick={() => toggle(c.id, isUnavailable)}
                                    className="rpg-card"
                                    style={{
                                        '--accent': accent,
                                        cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                        outline: selected ? `2px solid ${accent}` : 'none',
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
                                                {c.is_npc && (
                                                    <span className="rpg-element-badge" style={{ '--accent': '#8890a4', fontSize: '0.58rem' }}>NPC</span>
                                                )}
                                                {isMine && (
                                                    <span className="rpg-element-badge" style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.58rem' }}>Milikmu</span>
                                                )}
                                                {c.is_busy && (
                                                    <span className="rpg-element-badge" style={{ '--accent': '#b8433a', color: '#b8433a', fontSize: '0.58rem' }}>Sedang Misi</span>
                                                )}
                                                {isFainted && (
                                                    <span className="rpg-element-badge" style={{ '--accent': '#5b6178', color: '#5b6178', fontSize: '0.58rem' }}>Tumbang</span>
                                                )}
                                            </div>
                                            <div className="rpg-power-type">
                                                {c.is_npc ? `Lv.${c.npc_display_level}` : `Lv.${c.level}`} &middot; {c.subclass?.name}
                                            </div>
                                        </div>
                                        {selected && <span className="ms-auto" style={{ color: accent }}>✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {errors.character_ids && <div className="text-danger small mb-3">{errors.character_ids}</div>}

                {/* Lineup - muncul begitu minimal 2 karakter dipilih. Tampilan party
                    vs monster + pilih Frontman (kena target lebih sering, cocok
                    buat tank yang mau "nutupin" teman). */}
                {selectedCharacters.length >= 2 && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#c9a24b', padding: '1.5rem' }}>
                        <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.85rem', color: '#c9a24b' }}>Lineup</div>
                        <p className="text-secondary small mb-3">
                            Pilih <strong>Frontman</strong> (opsional) — dia bakal kena target serangan monster{' '}
                            <strong>{selectedCharacters.length === 3 ? '~50%' : '~67%'}</strong> ronde,
                            sisanya dibagi rata ke {selectedCharacters.length === 3 ? '2 karakter lain (~25% masing-masing)' : '1 karakter lain'}.
                            Cocok buat karakter tanky yang mau "nutupin" teman yang lebih rapuh. Gak pilih = target random rata semua.
                        </p>

                        <div className="d-flex justify-content-center align-items-end gap-3 flex-wrap mb-2" style={{ position: 'relative' }}>
                            {selectedCharacters.map((c) => {
                                const isFrontman = data.frontman_character_id === c.id;
                                return (
                                    <div key={c.id} style={{ textAlign: 'center', width: 100 }}>
                                        {c.subclass?.full_body_path ? (
                                            <img
                                                src={c.subclass.full_body_path}
                                                alt={c.name}
                                                style={{
                                                    width: '100%', aspectRatio: '1 / 2', objectFit: 'contain',
                                                    background: 'var(--bg-panel)', borderRadius: 8,
                                                    border: `2px solid ${isFrontman ? '#c9a24b' : 'var(--border-subtle)'}`,
                                                }}
                                            />
                                        ) : (
                                            <div className="rpg-badge-hex mx-auto" style={{ '--accent': '#8890a4', width: 70, height: 70 }}>
                                                {c.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="text-truncate mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.name}</div>
                                        <button
                                            type="button"
                                            onClick={() => setData('frontman_character_id', isFrontman ? null : c.id)}
                                            className="rpg-back-link mt-1"
                                            style={{
                                                fontSize: '0.65rem', padding: '0.15rem 0.5rem', width: '100%',
                                                color: isFrontman ? '#c9a24b' : 'var(--text-secondary)',
                                                borderColor: isFrontman ? '#c9a24b' : 'var(--border-subtle)',
                                            }}
                                        >
                                            {isFrontman ? '★ Frontman' : 'Jadi Frontman'}
                                        </button>
                                    </div>
                                );
                            })}

                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 700, alignSelf: 'center' }}>
                                VS
                            </div>

                            <div style={{ textAlign: 'center', width: 100 }}>
                                {encounter.monster.full_body_path ? (
                                    <img
                                        src={encounter.monster.full_body_path}
                                        alt={encounter.monster.name}
                                        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', background: 'var(--bg-panel)', borderRadius: 8, border: '2px solid #b8433a' }}
                                    />
                                ) : (
                                    <div className="rpg-badge-hex mx-auto" style={{ '--accent': '#b8433a', width: 70, height: 70 }}>
                                        {encounter.monster.name.charAt(0)}
                                    </div>
                                )}
                                <div className="text-truncate mt-1" style={{ fontSize: '0.78rem', color: '#b8433a' }}>{encounter.monster.name}</div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={submit}
                    className="btn btn-outline-light w-100"
                    disabled={data.character_ids.length < 2 || processing}
                >
                    {processing ? 'Memulai...' : `Mulai Battle (${data.character_ids.length}/3 dipilih)`}
                </button>
            </div>
        </Layout>
    );
}
