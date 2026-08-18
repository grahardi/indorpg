import { Head, useForm, Link } from '@inertiajs/react';
import Layout from '../../../Layout';

const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
const COMBAT_RANGES = ['close', 'range', 'area'];

function Field({ label, children }) {
    return (
        <div className="mb-3">
            <label className="rpg-stat-label d-block mb-1">{label}</label>
            {children}
        </div>
    );
}

function emptySlot() {
    return { combat_range: '', element_id: '', ratio: 2 };
}

function normalizeSlots(slots) {
    const arr = Array.isArray(slots) ? slots.map((s) => ({
        combat_range: s?.combat_range ?? '',
        element_id: s?.element_id ?? '',
        ratio: s?.ratio ?? 2,
    })) : [];
    while (arr.length < 2) arr.push(emptySlot());
    return arr.slice(0, 2);
}

function MatchupSlots({ label, hint, slots, setSlots, elements, accent }) {
    function updateSlot(i, field, value) {
        const next = [...slots];
        next[i] = { ...next[i], [field]: value };
        setSlots(next);
    }

    return (
        <div className="mb-4">
            <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem', color: accent }}>{label}</div>
            <p className="text-secondary small mb-2">{hint}</p>
            {slots.map((slot, i) => (
                <div className="row g-2 mb-2" key={i}>
                    <div className="col-4">
                        <select
                            className="form-select form-select-sm bg-dark text-light border-secondary"
                            value={slot.combat_range}
                            onChange={(e) => updateSlot(i, 'combat_range', e.target.value)}
                        >
                            <option value="">- Slot kosong -</option>
                            {COMBAT_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="col-4">
                        <select
                            className="form-select form-select-sm bg-dark text-light border-secondary"
                            value={slot.element_id}
                            onChange={(e) => updateSlot(i, 'element_id', e.target.value)}
                            disabled={!slot.combat_range}
                        >
                            <option value="">Elemen apapun</option>
                            {elements.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                        </select>
                    </div>
                    <div className="col-4">
                        <input
                            type="number" step="0.1" min="0"
                            className="form-control form-control-sm bg-dark text-light border-secondary"
                            value={slot.ratio}
                            onChange={(e) => updateSlot(i, 'ratio', e.target.value)}
                            disabled={!slot.combat_range}
                            placeholder="Ratio"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Form({ monster, elements, combatPatterns }) {
    const isEdit = !!monster;
    const { data, setData, post, put, processing, errors } = useForm({
        name: monster?.name ?? '',
        level: monster?.level ?? 1,
        class_rank: monster?.class_rank ?? 'E',
        type: monster?.type ?? '',
        element_id: monster?.element_id ?? '',
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
        weak_matchups: normalizeSlots(monster?.weak_matchups),
        strong_matchups: normalizeSlots(monster?.strong_matchups),
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
                        <div className="col-md-7">
                            <Field label="Nama">
                                <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                            </Field>
                        </div>
                        <div className="col-md-3">
                            <Field label="Level Dasar">
                                <input type="number" className={inputClass} value={data.level} onChange={(e) => setData('level', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-2">
                            <Field label="Kelas">
                                <select className={inputClass} value={data.class_rank} onChange={(e) => setData('class_rank', e.target.value)}>
                                    {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
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
                    </div>

                    <hr className="my-4" style={{ borderColor: 'var(--border-subtle)' }} />

                    <MatchupSlots
                        label="Weak (Lemah Terhadap) - 2 slot"
                        hint="Serangan yang cocok slot ini kena damage dikali ratio. Contoh: Range=close, Elemen=Fire, Ratio=2 -> serangan jarak dekat elemen Api kena 2x damage."
                        slots={data.weak_matchups}
                        setSlots={(v) => setData('weak_matchups', v)}
                        elements={elements}
                        accent="#b8433a"
                    />

                    <MatchupSlots
                        label="Strong (Kuat Terhadap) - 2 slot"
                        hint="Serangan yang cocok slot ini kena damage dibagi ratio. Contoh: Range=area, Ratio=2 -> serangan area cuma kena 1/2 damage."
                        slots={data.strong_matchups}
                        setSlots={(v) => setData('strong_matchups', v)}
                        elements={elements}
                        accent="#3f8c94"
                    />

                    <div className="row g-3">
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
                        Kelas (F-S) itu label kekuatan yang ditampilin ke player, TERPISAH dari level dasar.
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
