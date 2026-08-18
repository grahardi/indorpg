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

export default function Form({ map, spawnPoint, monsters }) {
    const isEdit = !!spawnPoint;
    const initialMonsters = isEdit
        ? spawnPoint.monsters.map((m) => ({ id: m.id, weight: m.pivot.weight }))
        : [];

    const { data, setData, post, put, processing, errors } = useForm({
        name: spawnPoint?.name ?? '',
        description: spawnPoint?.description ?? '',
        pos_x: spawnPoint?.pos_x ?? 50,
        pos_y: spawnPoint?.pos_y ?? 50,
        min_monster_level: spawnPoint?.min_monster_level ?? 1,
        respawn_seconds: spawnPoint?.respawn_seconds ?? 300,
        monsters: initialMonsters,
    });

    function toggleMonster(monsterId) {
        const exists = data.monsters.find((m) => m.id === monsterId);
        if (exists) {
            setData('monsters', data.monsters.filter((m) => m.id !== monsterId));
        } else {
            setData('monsters', [...data.monsters, { id: monsterId, weight: 5 }]);
        }
    }

    function updateWeight(monsterId, weight) {
        setData('monsters', data.monsters.map((m) => (m.id === monsterId ? { ...m, weight } : m)));
    }

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.maps.spawn-points.update', [map.id, spawnPoint.id]));
        } else {
            post(route('admin.maps.spawn-points.store', map.id));
        }
    }

    const inputClass = 'form-control bg-dark text-light border-secondary';

    return (
        <Layout>
            <Head title={isEdit ? `Edit ${spawnPoint.name}` : 'Spawn Point Baru'} />
            <div className="container py-5" style={{ maxWidth: 650 }}>
                <Link href={route('admin.maps.spawn-points.index', map.id)} className="rpg-back-link mb-3">&larr; Spawn Points ({map.name})</Link>
                <h1 className="rpg-hero-title display-6 mt-3 mb-4">{isEdit ? `Edit: ${spawnPoint.name}` : 'Spawn Point Baru'}</h1>

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
                            <Field label="Posisi X (%)">
                                <input type="number" step="0.1" min="0" max="100" className={inputClass} value={data.pos_x} onChange={(e) => setData('pos_x', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Posisi Y (%)">
                                <input type="number" step="0.1" min="0" max="100" className={inputClass} value={data.pos_y} onChange={(e) => setData('pos_y', e.target.value)} />
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Min Monster Level (gerbang masuk)">
                                <input type="number" min="1" className={inputClass} value={data.min_monster_level} onChange={(e) => setData('min_monster_level', e.target.value)} />
                                <p className="text-secondary small mt-1 mb-0">
                                    1 = semua level boleh masuk. 10 = butuh level tertinggi karaktermu + bonus admin minimal 10.
                                </p>
                            </Field>
                        </div>
                        <div className="col-md-6">
                            <Field label="Respawn (detik)">
                                <input type="number" min="0" className={inputClass} value={data.respawn_seconds} onChange={(e) => setData('respawn_seconds', e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    <div className="rpg-skill-group-title mt-4 mb-2" style={{ fontSize: '0.85rem' }}>Monster di Titik Ini</div>
                    <p className="text-secondary small mb-2">
                        Centang monster yang bisa muncul, atur bobot (semakin besar, semakin sering muncul relatif ke monster lain).
                    </p>
                    {errors.monsters && <div className="text-danger small mb-2">{errors.monsters}</div>}

                    <div className="rpg-card" style={{ '--accent': '#c9a24b', maxHeight: 320, overflowY: 'auto' }}>
                        {monsters.map((m) => {
                            const selected = data.monsters.find((dm) => dm.id === m.id);
                            return (
                                <div className="d-flex align-items-center gap-2 mb-2" key={m.id}>
                                    <input
                                        type="checkbox"
                                        checked={!!selected}
                                        onChange={() => toggleMonster(m.id)}
                                        id={`monster-${m.id}`}
                                    />
                                    <label htmlFor={`monster-${m.id}`} className="flex-grow-1 mb-0" style={{ fontSize: '0.9rem' }}>
                                        {m.name} <span className="text-secondary">(Lv.{m.level} &middot; Kelas {m.class_rank})</span>
                                    </label>
                                    {selected && (
                                        <input
                                            type="number" min="1"
                                            className="form-control form-control-sm bg-dark text-light border-secondary"
                                            style={{ width: 70 }}
                                            value={selected.weight}
                                            onChange={(e) => updateWeight(m.id, e.target.value)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button type="submit" className="btn btn-outline-light mt-3" disabled={processing}>
                        {processing ? 'Menyimpan...' : isEdit ? 'Update Spawn Point' : 'Buat Spawn Point'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
