import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
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
                            <option value="all">Semua (close+range+area)</option>
                        </select>
                    </div>
                    <div className="col-4">
                        <select
                            className="form-select form-select-sm bg-dark text-light border-secondary"
                            value={slot.element_id}
                            onChange={(e) => updateSlot(i, 'element_id', e.target.value)}
                            disabled={!slot.combat_range}
                        >
                            <option value="">{slot.combat_range === 'all' ? '- Wajib pilih elemen -' : 'Elemen apapun'}</option>
                            {elements.map((el) => <option key={el.id} value={el.id}>{el.name}</option>)}
                        </select>
                        {slot.combat_range === 'all' && !slot.element_id && (
                            <p className="small mt-1 mb-0" style={{ color: '#b8433a' }}>Wajib pilih elemen kalau range "Semua"</p>
                        )}
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

function MonsterSkillsManager({ skills, setSkills, monsterId }) {
    const [uploadingAudioIdx, setUploadingAudioIdx] = useState(null);

    function addSkill() {
        setSkills([...skills, { name: '', damage_ratio: 100, effect: 'single', can_stun: false, usage_ratio: 20, physical_ratio: 100 }]);
    }

    function updateSkill(i, field, value) {
        const next = [...skills];
        next[i] = { ...next[i], [field]: value };
        setSkills(next);
    }

    function removeSkill(i) {
        setSkills(skills.filter((_, idx) => idx !== i));
    }

    // Audio custom per-skill monster - CUMA bisa diupload kalau monster udah
    // tersimpan (edit mode, ada monsterId) - skill_config index dipakai buat
    // identifikasi (entrinya emang gak punya ID sendiri, cuma posisi array).
    async function handleSkillAudioUpload(i, e) {
        const file = e.target.files[0];
        if (!file || !monsterId) return;
        setUploadingAudioIdx(i);
        try {
            const formData = new FormData();
            formData.append('audio', file);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('admin.monsters.skills.upload-audio', [monsterId, i]), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: formData,
            });
            if (!res.ok) throw new Error('Upload gagal');
            const json = await res.json();
            updateSkill(i, 'audio_path', json.path);
        } catch (err) {
            alert('Upload audio gagal, coba lagi.');
        } finally {
            setUploadingAudioIdx(null);
            e.target.value = '';
        }
    }

    async function handleSkillAudioReset(i) {
        if (!monsterId || !confirm('Reset audio custom skill monster ini ke default?')) return;
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            await fetch(route('admin.monsters.skills.reset-audio', [monsterId, i]), {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            updateSkill(i, 'audio_path', undefined);
        } catch (err) {
            alert('Reset gagal, coba lagi.');
        }
    }

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="rpg-skill-group-title" style={{ fontSize: '0.75rem', color: '#c9a24b' }}>Skill Monster</div>
                <button type="button" onClick={addSkill} className="rpg-back-link" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                    + Tambah Skill
                </button>
            </div>
            <p className="text-secondary small mb-2">
                Monster SELALU nyerang lewat skill di sini (minimal 1, wajib biar jelas physical/magic-nya - kalau
                kosong monster otomatis dikasih 1 skill default pas seeding). Tiap ronde, skill dicek berurutan
                pakai Skill Ratio-nya (peluang % dipakai ronde itu).
            </p>
            {skills.length === 0 && (
                <p className="small fst-italic" style={{ color: '#c9a24b' }}>
                    ⚠ Belum ada skill - monster ini gak bakal bisa nyerang sama sekali di battle. Tambah minimal 1.
                </p>
            )}
            {skills.map((skill, i) => (
                <div key={i} className="rpg-card mb-2" style={{ '--accent': '#c9a24b', padding: '0.85rem' }}>
                    <div className="row g-2 align-items-end">
                        <div className="col-md-3">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>Nama Skill</label>
                            <input
                                className="form-control form-control-sm bg-dark text-light border-secondary"
                                value={skill.name}
                                onChange={(e) => updateSkill(i, 'name', e.target.value)}
                                placeholder="misal: Cakar Beracun"
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>Damage (% stat)</label>
                            <input
                                type="number" min="0" max="100"
                                className="form-control form-control-sm bg-dark text-light border-secondary"
                                value={skill.damage_ratio}
                                onChange={(e) => updateSkill(i, 'damage_ratio', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>
                                Physical % <span className="text-secondary">(0=magic, 100=physical)</span>
                            </label>
                            <input
                                type="number" min="0" max="100"
                                className="form-control form-control-sm bg-dark text-light border-secondary"
                                value={skill.physical_ratio ?? 100}
                                onChange={(e) => updateSkill(i, 'physical_ratio', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>Effect</label>
                            <select
                                className="form-select form-select-sm bg-dark text-light border-secondary"
                                value={skill.effect}
                                onChange={(e) => updateSkill(i, 'effect', e.target.value)}
                            >
                                <option value="single">Single</option>
                                <option value="area">Area (semua)</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>Skill Ratio (%/ronde)</label>
                            <input
                                type="number" min="0" max="100"
                                className="form-control form-control-sm bg-dark text-light border-secondary"
                                value={skill.usage_ratio}
                                onChange={(e) => updateSkill(i, 'usage_ratio', e.target.value)}
                            />
                        </div>
                        <div className="col-md-1 form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={!!skill.can_stun}
                                onChange={(e) => updateSkill(i, 'can_stun', e.target.checked)}
                                id={`stun-${i}`}
                            />
                            <label className="form-check-label text-secondary" htmlFor={`stun-${i}`} style={{ fontSize: '0.65rem' }}>Stun</label>
                        </div>
                        <div className="col-md-8">
                            <label className="rpg-stat-label d-block mb-1" style={{ fontSize: '0.65rem' }}>
                                Audio Custom (opsional - kosong pakai setting global/sintesis)
                            </label>
                            {monsterId ? (
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    {skill.audio_path && (
                                        <>
                                            <audio id={`monster-skill-audio-${i}`} src={skill.audio_path} preload="none" />
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById(`monster-skill-audio-${i}`)?.play()}
                                                className="rpg-back-link"
                                                style={{ fontSize: '0.7rem' }}
                                            >
                                                ▶ Play
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSkillAudioReset(i)}
                                                className="rpg-back-link"
                                                style={{ fontSize: '0.7rem', color: '#b8433a', borderColor: '#b8433a' }}
                                            >
                                                Reset
                                            </button>
                                        </>
                                    )}
                                    <label className="btn btn-sm btn-outline-light mb-0" style={{ cursor: uploadingAudioIdx === i ? 'wait' : 'pointer', fontSize: '0.7rem' }}>
                                        {uploadingAudioIdx === i ? 'Mengupload...' : skill.audio_path ? 'Ganti Audio' : 'Upload Audio'}
                                        <input
                                            type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
                                            onChange={(e) => handleSkillAudioUpload(i, e)}
                                            disabled={uploadingAudioIdx === i}
                                            hidden
                                        />
                                    </label>
                                </div>
                            ) : (
                                <p className="text-secondary small fst-italic mb-0">Simpan monster ini dulu, baru bisa upload audio per-skill.</p>
                            )}
                        </div>
                        <div className="col-md-4 text-end">
                            <button type="button" onClick={() => removeSkill(i)} className="rpg-back-link" style={{ fontSize: '0.7rem', color: '#b8433a', borderColor: '#b8433a', background: 'none' }}>
                                Hapus
                            </button>
                        </div>
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
        skills_config: monster?.skills_config ?? [],
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

                    <MonsterSkillsManager
                        skills={data.skills_config}
                        setSkills={(v) => setData('skills_config', v)}
                        monsterId={monster?.id}
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
