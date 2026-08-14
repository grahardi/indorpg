import { Head, useForm, Link } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Create({ subclasses }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        subclass_id: '',
    });

    const grouped = subclasses.reduce((acc, s) => {
        const className = s.gameClass?.name ?? 'Lainnya';
        acc[className] = acc[className] || [];
        acc[className].push(s);
        return acc;
    }, {});

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
                <p className="rpg-class-desc mb-4">Pilih subclass, kasih nama, avatar & full body bisa diupload setelah karakter dibuat.</p>

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

                    <div className="mb-4">
                        <label className="rpg-stat-label d-block mb-1">Subclass</label>
                        <select
                            className="form-select bg-dark text-light border-secondary"
                            value={data.subclass_id}
                            onChange={(e) => setData('subclass_id', e.target.value)}
                        >
                            <option value="">-- pilih subclass --</option>
                            {Object.entries(grouped).map(([className, list]) => (
                                <optgroup label={className} key={className}>
                                    {list.map((s) => (
                                        <option value={s.id} key={s.id}>{s.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {errors.subclass_id && <div className="text-danger small mt-1">{errors.subclass_id}</div>}
                    </div>

                    <button type="submit" className="btn btn-outline-light w-100" disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Buat Karakter'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
