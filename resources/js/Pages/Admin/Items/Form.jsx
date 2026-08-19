import { Head, useForm, Link } from '@inertiajs/react';
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

export default function Form({ item, elements = [] }) {
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
    });

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

                    <button type="submit" className="btn btn-outline-light mt-2" disabled={processing}>
                        {processing ? 'Menyimpan...' : isEdit ? 'Update Item' : 'Buat Item'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
