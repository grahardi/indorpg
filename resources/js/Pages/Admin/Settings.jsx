import { Head, useForm, Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Layout from '../../Layout';

export default function Settings({ settings }) {
    const { props } = usePage();
    const { data, setData, post, processing, errors } = useForm({
        settings: settings.map((s) => ({ key: s.key, value: s.value })),
    });
    const [saveError, setSaveError] = useState(null);

    // BUG FIX: form sebelumnya gak sync ulang ke data SEGAR dari server abis
    // save - kalau props `settings` berubah (misal abis save sukses & reload),
    // form perlu ngikutin, bukan tetep pegang state lokal yang lama.
    useEffect(() => {
        setData('settings', settings.map((s) => ({ key: s.key, value: s.value })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    function updateValue(key, value) {
        setData('settings', data.settings.map((s) => (s.key === key ? { ...s, value } : s)));
    }

    function submit(e) {
        e.preventDefault();
        setSaveError(null);
        post(route('admin.settings.update'), {
            // Paksa reload PENUH data settings dari server abis save (bukan
            // cuma percaya state lokal) - biar KETAUAN jelas kalau save-nya
            // beneran gagal (bakal balik ke nilai lama) vs beneran berhasil.
            onSuccess: () => {
                router.reload({ only: ['settings'] });
            },
            onError: (formErrors) => {
                // BUG FIX PENTING: sebelumnya error (422 validasi, dll) DIEMIN
                // TOTAL - gak ada tanda apapun ke user, keliatan kayak "gak
                // berubah" padahal aslinya request DITOLAK server. Sekarang
                // ditampilin + di-log ke console biar ketauan alasannya.
                console.error('[Settings] Gagal simpan:', formErrors);
                setSaveError(Object.values(formErrors).flat().join(', ') || 'Gagal menyimpan - cek console browser buat detail.');
            },
        });
    }

    return (
        <Layout>
            <Head title="Admin - Settings" />
            <div className="container py-5" style={{ maxWidth: 700 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Game Settings</h1>
                    <div className="d-flex gap-3">
                        <Link href={route('admin.monsters.index')} className="rpg-back-link">Monster</Link>
                        <Link href={route('admin.skills.index')} className="rpg-back-link">Skill</Link>
                        <Link href={route('admin.maps.index')} className="rpg-back-link">Map</Link>
                        <Link href={route('admin.items.index')} className="rpg-back-link">Item</Link>
                        <Link href={route('admin.audio.index')} className="rpg-back-link">Audio</Link>
                    </div>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#3f8c94', color: '#3f8c94' }}>
                        {props.flash.success}
                    </div>
                )}
                {saveError && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#b8433a', color: '#b8433a' }}>
                        ❌ {saveError}
                    </div>
                )}

                <form onSubmit={submit}>
                    {settings.map((s) => {
                        const current = data.settings.find((d) => d.key === s.key);
                        return (
                            <div className="rpg-card mb-3" key={s.key} style={{ '--accent': '#c9a24b', padding: '1.25rem' }}>
                                <label className="rpg-subclass-name d-block mb-1" style={{ fontSize: '0.95rem' }}>
                                    {s.key}
                                </label>
                                {s.description && (
                                    <p className="text-secondary small mb-2">{s.description}</p>
                                )}
                                <input
                                    type="text"
                                    className="form-control bg-dark text-light border-secondary"
                                    value={current?.value ?? ''}
                                    onChange={(e) => updateValue(s.key, e.target.value)}
                                    style={{ maxWidth: 200, fontFamily: 'var(--font-mono)' }}
                                />
                            </div>
                        );
                    })}

                    <button type="submit" className="btn btn-outline-light mt-2" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Semua'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
