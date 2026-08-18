import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../../Layout';

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="rpg-stat-label d-block mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Form({ map }) {
    const isEdit = !!map;
    const { data, setData, post, put, processing, errors } = useForm({
        name: map?.name ?? '',
        description: map?.description ?? '',
        min_level: map?.min_level ?? 1,
        max_level: map?.max_level ?? 5,
    });
    const [uploading, setUploading] = useState(false);

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.maps.update', map.id));
        } else {
            post(route('admin.maps.store'));
        }
    }

    function uploadBackground(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        router.post(route('admin.maps.background', map.id), { image: file }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
        });
    }

    const inputClass = 'form-control bg-dark text-light border-secondary';

    return (
        <Layout>
            <Head title={isEdit ? `Edit ${map.name}` : 'Map Baru'} />
            <div className="container py-5" style={{ maxWidth: 600 }}>
                <Link href={route('admin.maps.index')} className="rpg-back-link mb-3">&larr; Map</Link>
                <h1 className="rpg-hero-title display-6 mt-3 mb-4">{isEdit ? `Edit: ${map.name}` : 'Map Baru'}</h1>

                {isEdit && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#c9a24b' }}>
                        <div className="rpg-skill-group-title mb-2" style={{ fontSize: '0.75rem' }}>Background</div>
                        {map.background_path && (
                            <img src={map.background_path} alt={map.name} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />
                        )}
                        <input type="file" accept="image/*" className="form-control form-control-sm bg-dark text-light border-secondary" onChange={uploadBackground} disabled={uploading} />
                        {uploading && <p className="text-secondary small mt-1 mb-0">Mengupload...</p>}
                    </div>
                )}

                <form onSubmit={submit}>
                    <Field label="Nama">
                        <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                    </Field>

                    <Field label="Deskripsi">
                        <textarea className={inputClass} rows={2} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                    </Field>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <Field label="Level Minimum">
                                <input type="number" className={inputClass} value={data.min_level} onChange={(e) => setData('min_level', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Level Maximum">
                                <input type="number" className={inputClass} value={data.max_level} onChange={(e) => setData('max_level', e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-outline-light mt-2" disabled={processing}>
                        {processing ? 'Menyimpan...' : isEdit ? 'Update Map' : 'Buat Map'}
                    </button>
                </form>

                {isEdit && (
                    <p className="text-secondary small mt-4">
                        Setelah map dibuat, atur spawn point-nya di halaman{' '}
                        <Link href={route('admin.maps.spawn-points.index', map.id)}>Spawn Points</Link>.
                    </p>
                )}
            </div>
        </Layout>
    );
}
