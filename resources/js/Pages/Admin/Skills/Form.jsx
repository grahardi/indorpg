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

export default function Form({ skill, elements }) {
    const { data, setData, put, processing, errors } = useForm({
        name: skill.name,
        description: skill.description ?? '',
        tier: skill.tier,
        element_id: skill.element_id ?? '',
        scaling_stat: skill.scaling_stat,
        combat_range: skill.combat_range,
        stamina_cost: skill.stamina_cost,
        mana_cost: skill.mana_cost,
        cooldown_seconds: skill.cooldown_seconds,
        base_multiplier: skill.base_multiplier,
        can_stun: skill.can_stun ?? false,
        buff_type: skill.buff_type ?? 'none',
        heal_resource: skill.heal_resource ?? 'hp',
        required_level: skill.required_level,
    });

    function submit(e) {
        e.preventDefault();
        put(route('admin.skills.update', skill.id));
    }

    const inputClass = 'form-control bg-dark text-light border-secondary';

    return (
        <Layout>
            <Head title={`Edit ${skill.name}`} />
            <div className="container py-5" style={{ maxWidth: 600 }}>
                <Link href={route('admin.skills.index')} className="rpg-back-link mb-3">&larr; Skill</Link>
                <h1 className="rpg-hero-title display-6 mt-3 mb-1">{skill.name}</h1>
                <p className="text-secondary mb-4">{skill.subclass?.name}</p>

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
                            <Field label="Tier">
                                <select className={inputClass} value={data.tier} onChange={(e) => setData('tier', e.target.value)}>
                                    <option value={1}>1 - Biasa</option>
                                    <option value={3}>3 - Ultimate</option>
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Scaling Stat">
                                <select className={inputClass} value={data.scaling_stat} onChange={(e) => setData('scaling_stat', e.target.value)}>
                                    <option value="physical">Physical</option>
                                    <option value="magic">Magic</option>
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Attribute (elemen)">
                                <select className={inputClass} value={data.element_id} onChange={(e) => setData('element_id', e.target.value)}>
                                    <option value="">- Tanpa elemen -</option>
                                    {elements.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Buff Type">
                                <select className={inputClass} value={data.buff_type} onChange={(e) => setData('buff_type', e.target.value)}>
                                    <option value="none">No / Serangan Biasa</option>
                                    <option value="heal">Heal (nambah HP/MP/SP teman)</option>
                                    <option value="buff">Buff (naikin daya serang teman)</option>
                                    <option value="nerf">Nerf (debuff monster)</option>
                                </select>
                                <p className="text-secondary small mt-1 mb-0">
                                    {data.buff_type === 'heal' && 'Skill ini nyembuhin teman (bukan nyerang monster). Basis kekuatan = Magic Attack pemberi x Base Multiplier. Combat Range "Area" = kena semua teman yang hidup.'}
                                    {data.buff_type === 'buff' && 'Skill ini nambah daya serang teman buat serangan BERIKUTNYA (one-shot, abis dipakai sekali). Basis = Magic Attack pemberi (45 Magic Attack x 100% Base Multiplier = +45% damage). Combat Range "Area" = semua teman yang hidup kebagian.'}
                                    {data.buff_type === 'nerf' && 'Skill ini debuff monster (bukan nyerang langsung). Base Multiplier jadi pengali damage serangan BERIKUTNYA ke monster (siapapun yang mukul duluan).'}
                                </p>
                            </Field>
                        </div>
                        {data.buff_type === 'heal' && (
                            <div className="col-md-6">
                                <Field label="Resource yang Disembuhin">
                                    <select className={inputClass} value={data.heal_resource} onChange={(e) => setData('heal_resource', e.target.value)}>
                                        <option value="hp">HP</option>
                                        <option value="mp">MP (Mana)</option>
                                        <option value="sp">SP (Stamina)</option>
                                    </select>
                                </Field>
                            </div>
                        )}
                        <div className="col-md-6">
                            <Field label="Combat Range">
                                <select className={inputClass} value={data.combat_range} onChange={(e) => setData('combat_range', e.target.value)}>
                                    <option value="close">Close</option>
                                    <option value="range">Range</option>
                                    <option value="area">Area</option>
                                </select>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Base Multiplier">
                                <input type="number" step="0.1" className={inputClass} value={data.base_multiplier} onChange={(e) => setData('base_multiplier', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Stamina Cost">
                                <input type="number" className={inputClass} value={data.stamina_cost} onChange={(e) => setData('stamina_cost', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Mana Cost">
                                <input type="number" className={inputClass} value={data.mana_cost} onChange={(e) => setData('mana_cost', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-4">
                            <Field label="Cooldown (detik)">
                                <input type="number" className={inputClass} value={data.cooldown_seconds} onChange={(e) => setData('cooldown_seconds', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Required Level">
                                <input type="number" className={inputClass} value={data.required_level} onChange={(e) => setData('required_level', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Bisa Stun?">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="can_stun"
                                        checked={data.can_stun}
                                        onChange={(e) => setData('can_stun', e.target.checked)}
                                    />
                                    <label className="form-check-label text-secondary" htmlFor="can_stun" style={{ fontSize: '0.85rem' }}>
                                        Ya - kalau kena, monster skip ronde nyerang berikutnya
                                    </label>
                                </div>
                            </Field>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-outline-light mt-3" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Update Skill'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
