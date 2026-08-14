import { Link, Head } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Index({ maps }) {
    return (
        <Layout>
            <Head title="Peta" />
            <div className="container py-5">
                <h1 className="rpg-hero-title display-5 mb-2">Peta Petualangan</h1>
                <p className="rpg-tagline mb-5">Pilih area buat dijelajah. Tiap area punya beberapa titik spawn monster.</p>

                <div className="row g-3">
                    {maps.map((m) => (
                        <div className="col-md-6" key={m.id}>
                            <Link href={route('maps.show', m.id)} className="rpg-card" style={{ '--accent': '#c9a24b' }}>
                                <div className="rpg-subclass-name" style={{ fontSize: '1.3rem' }}>{m.name}</div>
                                <p className="rpg-skill-desc mt-2">{m.description}</p>
                                <div className="rpg-skill-cost">
                                    <span>Level {m.min_level}-{m.max_level}</span>
                                    <span>{m.spawn_points_count} titik spawn</span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
