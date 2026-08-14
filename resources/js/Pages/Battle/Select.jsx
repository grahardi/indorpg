import { Link, Head, useForm } from '@inertiajs/react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

export default function Select({ encounter, characters }) {
    const { data, setData, post, processing, errors } = useForm({
        character_ids: [],
    });

    function toggle(id) {
        setData('character_ids', data.character_ids.includes(id)
            ? data.character_ids.filter((c) => c !== id)
            : data.character_ids.length < 3 ? [...data.character_ids, id] : data.character_ids);
    }

    function submit(e) {
        e.preventDefault();
        post(route('encounters.start', encounter.id));
    }

    return (
        <Layout>
            <Head title="Pilih Party" />
            <div className="container py-5" style={{ maxWidth: 720 }}>
                <Link href={route('maps.index')} className="rpg-back-link mb-4">
                    &larr; Peta
                </Link>

                <div className="rpg-card mb-4" style={{ '--accent': '#b8433a' }}>
                    <div className="rpg-subclass-name">{encounter.monster.name} muncul!</div>
                    <p className="rpg-power-type mb-0">
                        Lv.{encounter.monster.level} &middot; {encounter.monster.type} &middot; HP {encounter.monster.hp}
                    </p>
                </div>

                <h4 className="rpg-skill-group-title mb-3">Pilih 2-3 Karakter</h4>

                {characters.length === 0 && (
                    <p className="text-secondary">
                        Belum ada karakter. <Link href={route('characters.create')}>Buat karakter dulu</Link>.
                    </p>
                )}

                <div className="row g-3 mb-4">
                    {characters.map((c) => {
                        const accent = CLASS_ACCENT[c.subclass?.gameClass?.slug] ?? '#8890a4';
                        const selected = data.character_ids.includes(c.id);
                        return (
                            <div className="col-md-4" key={c.id}>
                                <div
                                    onClick={() => toggle(c.id)}
                                    className="rpg-card"
                                    style={{
                                        '--accent': accent,
                                        cursor: 'pointer',
                                        outline: selected ? `2px solid ${accent}` : 'none',
                                    }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        {c.avatar_url ? (
                                            <img src={c.avatar_url} alt={c.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="rpg-badge-hex" style={{ '--accent': accent, width: 40, height: 40, fontSize: '0.9rem' }}>
                                                {c.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="rpg-subclass-name" style={{ fontSize: '0.95rem' }}>{c.name}</div>
                                            <div className="rpg-power-type">Lv.{c.level} &middot; {c.subclass?.name}</div>
                                        </div>
                                        {selected && <span className="ms-auto" style={{ color: accent }}>✓</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {errors.character_ids && <div className="text-danger small mb-3">{errors.character_ids}</div>}

                <button
                    onClick={submit}
                    className="btn btn-outline-light w-100"
                    disabled={data.character_ids.length < 2 || processing}
                >
                    {processing ? 'Memulai...' : `Mulai Battle (${data.character_ids.length}/3 dipilih)`}
                </button>
            </div>
        </Layout>
    );
}
