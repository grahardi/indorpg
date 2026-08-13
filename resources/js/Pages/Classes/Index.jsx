import { Link, Head } from '@inertiajs/react';

const statBar = (label, value, max = 50, colorClass) => (
    <div className="mb-1">
        <div className="d-flex justify-content-between small">
            <span>{label}</span>
            <span>{value}</span>
        </div>
        <div className="progress" style={{ height: '6px' }}>
            <div
                className={`progress-bar ${colorClass}`}
                role="progressbar"
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            />
        </div>
    </div>
);

export default function Index({ classes }) {
    return (
        <>
            <Head title="Classes & Subclasses" />
            <div className="container py-5">
                <h1 className="mb-1">IndoRPG — Character Classes</h1>
                <p className="text-secondary mb-5">
                    Data browser sementara (belum ada login/auth). Klik subclass untuk lihat skill.
                </p>

                {classes.map((gameClass) => (
                    <div key={gameClass.id} className="mb-5">
                        <h3 className="border-bottom border-secondary pb-2">
                            {gameClass.name}
                            <small className="text-secondary ms-2 fs-6">{gameClass.description}</small>
                        </h3>
                        <div className="row g-3">
                            {gameClass.subclasses.map((sub) => (
                                <div className="col-md-6 col-lg-3" key={sub.id}>
                                    <Link
                                        href={route('subclass.show', sub.id)}
                                        className="card bg-dark text-decoration-none text-light h-100 border-secondary"
                                    >
                                        <div className="card-body">
                                            <h5 className="card-title d-flex justify-content-between align-items-center">
                                                {sub.name}
                                                {sub.element && (
                                                    <span className="badge bg-info text-dark">{sub.element.name}</span>
                                                )}
                                            </h5>
                                            <p className="small text-secondary">{sub.power_type}</p>
                                            {statBar('Phys DMG', sub.base_physical_damage, 50, 'bg-danger')}
                                            {statBar('Phys DEF', sub.base_physical_defense, 50, 'bg-warning')}
                                            {statBar('Magic DMG', sub.base_magic_damage, 50, 'bg-primary')}
                                            {statBar('Magic DEF', sub.base_magic_defense, 50, 'bg-success')}
                                            {sub.flavor_bonus && (
                                                <p className="small text-info mt-2 mb-0">{sub.flavor_bonus}</p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
