import { Head, useForm, Link } from '@inertiajs/react';
import Layout from '../../../Layout';

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="rpg-stat-label d-block mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Form({ monster, elements, combatPatterns }) {
    const isEdit = !!monster;
    const { data, setData, post, put, processing, errors } = useForm({
        name: monster?.name ?? '',
        level: monster?.level ?? 1,
        type: monster?.type ?? '',
        element_id: monster?.element_id ?? '',
        strong_against: monster?.strong_against ?? '',
        weak_against: monster?.weak_against ?? '',
        hp: monster?.hp ?? 30,
        physical_damage: monster?.physical_damage ?? 10,
        physical_defense: monster?.physical_defense ?? 5,
        magic_damage: monster?.magic_damage ?? 5,
        magic_defense: monster?.magic_defense ?? 5,
        agility: monster?.agility ?? 50,
        accuracy: monster?.accuracy ?? 80,
        exp_reward: monster?.exp_reward ?? 10,
        min_party_level: monster?.min_party_level ?? 1,
        special_skill_name: monster?.special_skill_name ?? '',
        special_skill_description: monster?.special_skill_description ?? '',
        description: monster?.description ?? '',
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.monsters.update', monster.id));
        } else {
            post(route('admin.monsters.store'));
        }
    }

    const inputClass = 'form-control bg-dark text-light border-secondary';

    return (
        <Layout>
            <Head title={isEdit ? `Edit ${monster.name}` : 'Monster Baru'} />
            <div className="container py-5" style={{ maxWidth: 700 }}>
                <Link href={route('admin.monsters.index')} className="rpg-back-link mb-3">&larr; Monster</Link>
                <h1 className="rpg-hero-title display-6 mt-3 mb-4">{isEdit ? `Edit: ${monster.name}` : 'Monster Baru'}</h1>

                <form onSubmit={submit}>
                    <div className="row g-3">
                        <div className="col-md-8">
                            <Field label="Nama">
                                <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Level Dasar">
                                <input type="number" className={inputClass} value={data.level} onChange={(e) => setData('level', e.target.value)} />
                            </Field>
                        </div>

                        <div className="col-md-6">
                            <Field label="Type (misal: Beast, Undead, Elemental)">
                                <input className={inputClass} value={data.type} onChange={(e) => setData('type', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Elemen">
                                <select className={inputClass} value={data.element_id} onChange={(e) => setData('element_id', e.target.value)}>
                                    <option value="">- Tanpa elemen -</option>
                                    {elements.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="col-md-6">
                            <Field label="Lemah Terhadap (weak_against)">
                                <select className={inputClass} value={data.weak_against} onChange={(e) => setData('weak_against', e.target.value)}>
                                    <option value="">- Tidak ada -</option>
                                    {combatPatterns.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Kuat Terhadap (strong_against)">
                                <select className={inputClass} value={data.strong_against} onChange={(e) => setData('strong_against', e.target.value)}>
                                    <option value="">- Tidak ada -</option>
                                    {combatPatterns.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </Field>
                        </div>

                        <div className="col-md-4">
                            <Field label="HP">
                                <input type="number" className={inputClass} value={data.hp} onChange={(e) => setData('hp', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Physical Damage">
                                <input type="number" className={inputClass} value={data.physical_damage} onChange={(e) => setData('physical_damage', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Physical Defense">
                                <input type="number" className={inputClass} value={data.physical_defense} onChange={(e) => setData('physical_defense', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Magic Damage">
                                <input type="number" className={inputClass} value={data.magic_damage} onChange={(e) => setData('magic_damage', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Magic Defense">
                                <input type="number" className={inputClass} value={data.magic_defense} onChange={(e) => setData('magic_defense', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Agility (evasion monster)">
                                <input type="number" className={inputClass} value={data.agility} onChange={(e) => setData('agility', e.target.value)} />
                            </Field>
                        </div>

                        <div className="col-md-6">
                            <Field label="Accuracy">
                                <input type="number" className={inputClass} value={data.accuracy} onChange={(e) => setData('accuracy', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-3">
                            <Field label="EXP Reward (di level dasar)">
                                <input type="number" className={inputClass} value={data.exp_reward} onChange={(e) => setData('exp_reward', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-3">
                            <Field label="Min Party Level">
                                <input type="number" className={inputClass} value={data.min_party_level} onChange={(e) => setData('min_party_level', e.target.value)} />
                            </Field>
                        </div>

                        <div className="col-md-6">
                            <Field label="Nama Skill Spesial (opsional, flavor text)">
                                <input className={inputClass} value={data.special_skill_name} onChange={(e) => setData('special_skill_name', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Deskripsi Skill Spesial">
                                <input className={inputClass} value={data.special_skill_description} onChange={(e) => setData('special_skill_description', e.target.value)} />
                            </Field>
                        </div>

                        <div className="col-12">
                            <Field label="Deskripsi Monster">
                                <textarea className={inputClass} rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    <p className="text-secondary small mt-3">
                        Catatan: HP/damage/defense/EXP di atas adalah nilai di <strong>level dasar</strong>.
                        Stat aktual pas battle di-scale otomatis sesuai level encounter (lihat Settings buat atur rasio kenaikannya).
                        Avatar/full body diatur lewat halaman detail monster (upload gambar), bukan di sini.
                    </p>

                    <button type="submit" className="btn btn-outline-light mt-2" disabled={processing}>
                        {processing ? 'Menyimpan...' : isEdit ? 'Update Monster' : 'Buat Monster'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
