import { Head, useForm, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import Layout from '../../Layout';

export default function Create({ subclasses }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        class_id: '',
        subclass_id: '',
    });

    const classes = useMemo(() => {
        const map = new Map();
        subclasses.forEach((s) => {
            if (s.gameClass && !map.has(s.gameClass.id)) {
                map.set(s.gameClass.id, s.gameClass);
            }
        });
        return Array.from(map.values());
    }, [subclasses]);

    const subclassOptions = useMemo(
        () => subclasses.filter((s) => String(s.class_id) === String(data.class_id)),
        [subclasses, data.class_id]
    );

    function handleClassChange(classId) {
        setData((prev) => ({ ...prev, class_id: classId, subclass_id: '' }));
    }

    function submit(e) {
        e.preventDefault();
        post(route('characters.store'));
    }

    return (
        <Layout>
            <Head title="Buat Karakter" />
            <div className="container py-5" style={{ maxWidth: 560 }}>
                <Link href={route('characters.index')} className="rpg-back-link mb-4">
                    &larr; Roster
                </Link>

                <h1 className="rpg-class-title mt-4" style={{ fontSize: '1.7rem' }}>Buat Karakter Baru</h1>
                <p className="rpg-class-desc mb-4">Pilih class, lalu subclass. Avatar & full body bisa diupload setelah karakter dibuat.</p>

                <form onSubmit={submit} className="rpg-card" style={{ '--accent': '#8890a4' }}>
                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Nama Karakter</label>
                        <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Misal: Arka Wijaya"
                        />
                        {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                    </div>

                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Class</label>
                        <select
                            className="form-select bg-dark text-light border-secondary"
                            value={data.class_id}
                            onChange={(e) => handleClassChange(e.target.value)}
                        >
                            <option value="">-- pilih class --</option>
                            {classes.map((c) => (
                                <option value={c.id} key={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="rpg-stat-label d-block mb-1">Subclass</label>
                        <select
                            className="form-select bg-dark text-light border-secondary"
                            value={data.subclass_id}
                            onChange={(e) => setData('subclass_id', e.target.value)}
                            disabled={!data.class_id}
                        >
                            <option value="">
                                {data.class_id ? '-- pilih subclass --' : 'Pilih class dulu'}
                            </option>
                            {subclassOptions.map((s) => (
                                <option value={s.id} key={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {errors.subclass_id && <div className="text-danger small mt-1">{errors.subclass_id}</div>}
                    </div>

                    <button type="submit" className="btn btn-outline-light w-100" disabled={processing || !data.subclass_id}>
                        {processing ? 'Menyimpan...' : 'Buat Karakter'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
