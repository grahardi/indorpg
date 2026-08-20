import { Head, useForm, usePage } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Index({ defaultBattleMode }) {
    const { props } = usePage();
    const { data, setData, post, processing } = useForm({
        default_battle_mode: defaultBattleMode,
    });

    function submit(e) {
        e.preventDefault();
        post(route('settings.update'), { preserveScroll: true });
    }

    return (
        <Layout>
            <Head title="Pengaturan" />
            <div className="container py-5" style={{ maxWidth: 560 }}>
                <h1 className="rpg-hero-title display-6 mb-4">Pengaturan</h1>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#4a9960', color: '#4a9960' }}>
                        {props.flash.success}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', padding: '1.5rem' }}>
                        <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.85rem', color: '#3f8c94' }}>Mode Battle Default</div>
                        <p className="text-secondary small mb-3">
                            Mode yang otomatis kepilih pas mulai battle baru (masih bisa diganti manual di halaman Frontman tiap battle).
                        </p>
                        <div className="row g-2">
                            <div className="col-6">
                                <button
                                    type="button"
                                    onClick={() => setData('default_battle_mode', 'auto')}
                                    className="w-100 text-start p-2"
                                    style={{
                                        background: data.default_battle_mode === 'auto' ? 'var(--bg-panel-hover)' : 'transparent',
                                        border: `2px solid ${data.default_battle_mode === 'auto' ? '#3f8c94' : 'var(--border-subtle)'}`,
                                        borderRadius: 8, color: data.default_battle_mode === 'auto' ? '#3f8c94' : 'var(--text-secondary)',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ Auto</div>
                                    <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Server jalanin semua otomatis.</div>
                                </button>
                            </div>
                            <div className="col-6">
                                <button
                                    type="button"
                                    onClick={() => setData('default_battle_mode', 'manual')}
                                    className="w-100 text-start p-2"
                                    style={{
                                        background: data.default_battle_mode === 'manual' ? 'var(--bg-panel-hover)' : 'transparent',
                                        border: `2px solid ${data.default_battle_mode === 'manual' ? '#3f8c94' : 'var(--border-subtle)'}`,
                                        borderRadius: 8, color: data.default_battle_mode === 'manual' ? '#3f8c94' : 'var(--text-secondary)',
                                    }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🎮 Manual</div>
                                    <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Kontrol skill sendiri (klik/keyboard).</div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-outline-light" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
