import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../../Layout';

const RARITIES = ['common', 'rare', 'sr', 'ur', 'legendary'];
const RARITY_LABEL = { common: 'Common', rare: 'Rare', sr: 'SR', ur: 'UR', legendary: 'Legendary' };
const EFFECT_STATS = [
    'physical_damage', 'physical_defense', 'magic_damage', 'magic_defense',
    'accuracy', 'evasion', 'critical_hit', 'critical_luck',
    'hp', 'hp_regen', 'mp_regen', 'sp_regen',
    'elemental_damage',
];
const STAT_LABEL = {
    physical_damage: 'Physical Attack', physical_defense: 'Physical Defense',
    magic_damage: 'Magic Attack', magic_defense: 'Magic Defense',
    accuracy: 'Accuracy', evasion: 'Evasion',
    critical_hit: 'Critical Hit', critical_luck: 'Critical Luck',
    hp: 'HP (max)', hp_regen: 'HP Regen/ronde', mp_regen: 'MP Regen/ronde', sp_regen: 'SP Regen/ronde',
    elemental_damage: 'Elemental Damage (pilih elemen)',
};

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="rpg-stat-label d-block mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Form({ item, elements = [], availableIcons = [] }) {
    const isEdit = !!item;
    const { data, setData, post, put, processing, errors } = useForm({
        name: item?.name ?? '',
        description: item?.description ?? '',
        rarity: item?.rarity ?? 'common',
        price: item?.price ?? 50,
        effect_stat: item?.effect_stat ?? 'physical_damage',
        effect_element_id: item?.effect_element_id ?? '',
        effect_value: item?.effect_value ?? 10,
        drop_rate: item?.drop_rate ?? 10,
        icon_path: item?.icon_path ?? '',
    });

    // Kalau lagi edit item yang UDAH punya icon_path, ikon itu sendiri gak
    // muncul di "availableIcons" (soalnya dianggap "dipakai" oleh item ini),
    // jadi ditambahin manual biar tetap kepilih/keliatan di picker.
    const iconChoices = item?.icon_path && !availableIcons.includes(item.icon_path)
        ? [item.icon_path, ...availableIcons]
        : availableIcons;

    const [uploading, setUploading] = useState(false);

    // Upload manual - pakai fetch() langsung (bukan Inertia visit), biar gak
    // reload halaman/ilangin isian form lain. Hasilnya langsung set ke icon_path.
    async function handleUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('admin.items.upload-icon'), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: formData,
            });
            if (!res.ok) throw new Error('Upload gagal');
            const json = await res.json();
            setData('icon_path', json.path);
        } catch (err) {
            alert('Upload gambar gagal, coba lagi.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.items.update', item.id));
        } else {
            post(route('admin.items.store'));
        }
    }

    const inputClass = 'form-control bg-dark text-light border-secondary';

    return (
        <Layout>
            <Head title={isEdit ? `Edit ${item.name}` : 'Item Baru'} />
            <div className="container py-5" style={{ maxWidth: 600 }}>
                <Link href={route('admin.items.index')} className="rpg-back-link mb-3">&larr; Item</Link>
                <h1 className="rpg-hero-title display-6 mt-3 mb-4">{isEdit ? `Edit: ${item.name}` : 'Item Baru'}</h1>

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
                            <Field label="Rarity">
                                <select className={inputClass} value={data.rarity} onChange={(e) => setData('rarity', e.target.value)}>
                                    {RARITIES.map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Harga (Gold)">
                                <input type="number" min="1" className={inputClass} value={data.price} onChange={(e) => setData('price', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Stat yang Ditambah">
                                <select className={inputClass} value={data.effect_stat} onChange={(e) => setData('effect_stat', e.target.value)}>
                                    {EFFECT_STATS.map((s) => <option key={s} value={s}>{STAT_LABEL[s]}</option>)}
                                </select>
                                {data.effect_stat === 'elemental_damage' && (
                                    <p className="text-secondary small mt-1 mb-0">
                                        Bonus damage cuma nambah kalau skill yang dipakai elemennya sama kayak item ini.
                                    </p>
                                )}
                            </Field>
                        </div>
                        {data.effect_stat === 'elemental_damage' && (
                            <div className="col-md-6">
                                <Field label="Elemen">
                                    <select className={inputClass} value={data.effect_element_id} onChange={(e) => setData('effect_element_id', e.target.value)}>
                                        <option value="">- Pilih elemen -</option>
                                        {elements.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                                    </select>
                                    {errors.effect_element_id && <div className="text-danger small mt-1">{errors.effect_element_id}</div>}
                                </Field>
                            </div>
                        )}
                        <div className="col-md-6">
                            <Field label="Jumlah Bonus">
                                <input type="number" min="1" className={inputClass} value={data.effect_value} onChange={(e) => setData('effect_value', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Drop Rate (% per battle menang)">
                                <input type="number" step="0.1" min="0" max="100" className={inputClass} value={data.drop_rate} onChange={(e) => setData('drop_rate', e.target.value)} />
                                <p className="text-secondary small mt-1 mb-0">Makin tinggi rarity, biasanya makin kecil angka ini.</p>
                            </Field>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Gambar Item</label>

                        <div className="d-flex align-items-center gap-3 mb-3">
                            {data.icon_path && (
                                <img
                                    src={data.icon_path}
                                    alt="Preview"
                                    style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, border: '2px solid #c9a24b', background: 'var(--bg-panel-hover)' }}
                                />
                            )}
                            <div>
                                <label className="btn btn-sm btn-outline-light mb-0" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
                                    {uploading ? 'Mengupload...' : 'Upload Gambar Sendiri'}
                                    <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} hidden />
                                </label>
                                {data.icon_path && (
                                    <button
                                        type="button"
                                        onClick={() => setData('icon_path', '')}
                                        className="rpg-back-link ms-2"
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        Hapus Gambar
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-secondary small mb-2">
                            Atau pilih dari {iconChoices.length} ikon yang belum kepakai (dari game-icons.net). Klik buat pilih, klik lagi buat batal pilih (pakai default kategori).
                        </p>
                        {iconChoices.length === 0 ? (
                            <p className="text-secondary small fst-italic">
                                Semua ikon pool udah kepakai. Item ini bakal fallback ke ikon kategori otomatis.
                            </p>
                        ) : (
                            <div
                                className="rpg-card"
                                style={{
                                    '--accent': '#c9a24b', maxHeight: 280, overflowY: 'auto',
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '0.5rem',
                                }}
                            >
                                {iconChoices.map((path) => {
                                    const isSelected = data.icon_path === path;
                                    return (
                                        <button
                                            key={path}
                                            type="button"
                                            onClick={() => setData('icon_path', isSelected ? '' : path)}
                                            title={path.split('/').pop()}
                                            style={{
                                                width: 56, height: 56, padding: 2, borderRadius: 8,
                                                background: 'var(--bg-panel-hover)', cursor: 'pointer',
                                                border: `2px solid ${isSelected ? '#c9a24b' : 'transparent'}`,
                                            }}
                                        >
                                            <img src={path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-outline-light mt-2" disabled={processing}>
                        {processing ? 'Menyimpan...' : isEdit ? 'Update Item' : 'Buat Item'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
