import { Link, Head, useForm, usePage } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Select({ encounter, characters }) {
    const { props } = usePage();
    const { data, setData, post, processing, errors } = useForm({
        character_ids: characters.map((c) => c.id),
        frontman_character_id: null,
        mode: props.auth?.user?.default_battle_mode ?? 'auto',
    });

    function submit(e) {
        e.preventDefault();
        post(route('encounters.start', encounter.id));
    }

    return (
        <Layout>
            <Head title="Pilih Frontman" />
            <div className="container py-5" style={{ maxWidth: 620 }}>
                <Link href={route('guild.index')} className="rpg-back-link mb-4">
                    &larr; Guild
                </Link>

                <div className="rpg-card mb-4" style={{ '--accent': '#b8433a' }}>
                    <div className="rpg-subclass-name">{encounter.monster.name} muncul!</div>
                    <p className="rpg-power-type mb-0">
                        Kelas {encounter.monster.class_rank} &middot; {encounter.monster.type}
                    </p>
                </div>

                {errors.character_ids && <div className="text-danger small mb-3">{errors.character_ids}</div>}

                {/* Party udah fix (dipilih di Guild sebelumnya) - di sini cuma
                    nampilin lineup vs monster + pilih Frontman (kena target
                    lebih sering, cocok buat tank yang mau "nutupin" teman). */}
                <div className="rpg-card mb-4" style={{ '--accent': '#c9a24b', padding: '1.5rem' }}>
                    <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.85rem', color: '#c9a24b' }}>Pilih Frontman</div>
                    <p className="text-secondary small mb-3">
                        Frontman (opsional) bakal kena target serangan monster{' '}
                        <strong>{characters.length === 3 ? '~50%' : '~67%'}</strong> ronde,
                        sisanya dibagi rata ke {characters.length === 3 ? '2 karakter lain (~25% masing-masing)' : '1 karakter lain'}.
                        Cocok buat karakter tanky yang mau "nutupin" teman yang lebih rapuh. Gak pilih = target random rata semua.
                    </p>

                    <div className="d-flex justify-content-center align-items-end gap-3 flex-wrap mb-2" style={{ position: 'relative' }}>
                        {characters.map((c) => {
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
                                    <div className="text-truncate mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {c.name}{c.is_npc && <span className="text-secondary"> (NPC)</span>}
                                    </div>
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

                <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', padding: '1.25rem' }}>
                    <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.85rem', color: '#3f8c94' }}>Mode Battle</div>
                    <div className="row g-2">
                        <div className="col-6">
                            <button
                                type="button"
                                onClick={() => setData('mode', 'auto')}
                                className="w-100 text-start p-2"
                                style={{
                                    background: data.mode === 'auto' ? 'var(--bg-panel-hover)' : 'transparent',
                                    border: `2px solid ${data.mode === 'auto' ? '#3f8c94' : 'var(--border-subtle)'}`,
                                    borderRadius: 8, color: data.mode === 'auto' ? '#3f8c94' : 'var(--text-secondary)',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ Auto</div>
                                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Server jalanin semua otomatis, tinggal nonton.</div>
                            </button>
                        </div>
                        <div className="col-6">
                            <button
                                type="button"
                                onClick={() => setData('mode', 'manual')}
                                className="w-100 text-start p-2"
                                style={{
                                    background: data.mode === 'manual' ? 'var(--bg-panel-hover)' : 'transparent',
                                    border: `2px solid ${data.mode === 'manual' ? '#3f8c94' : 'var(--border-subtle)'}`,
                                    borderRadius: 8, color: data.mode === 'manual' ? '#3f8c94' : 'var(--text-secondary)',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🎮 Manual</div>
                                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Kontrol skill karaktermu sendiri (klik/keyboard).</div>
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={submit}
                    className="btn btn-outline-light w-100"
                    disabled={processing}
                >
                    {processing ? 'Memulai...' : 'Mulai Battle'}
                </button>
            </div>
        </Layout>
    );
}
