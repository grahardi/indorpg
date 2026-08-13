import { Link, Head } from '@inertiajs/react';

export default function Show({ subclass }) {
    return (
        <>
            <Head title={subclass.name} />
            <div className="container py-5">
                <Link href={route('classes.index')} className="btn btn-outline-secondary btn-sm mb-4">
                    &larr; Kembali
                </Link>

                <div className="d-flex align-items-center gap-3 mb-2">
                    <div
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                        style={{ width: 64, height: 64, fontSize: 24 }}
                    >
                        {subclass.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="mb-0">{subclass.name}</h1>
                        <p className="text-secondary mb-0">
                            {subclass.gameClass?.name} &middot; {subclass.power_type}
                            {subclass.element && <> &middot; Elemen: {subclass.element.name}</>}
                        </p>
                    </div>
                </div>
                <p className="mt-3">{subclass.description}</p>
                {subclass.flavor_bonus && (
                    <p className="text-info">Bonus: {subclass.flavor_bonus}</p>
                )}

                <div className="row g-3 my-3">
                    {[
                        ['Physical Damage', subclass.base_physical_damage, 'danger'],
                        ['Physical Defense', subclass.base_physical_defense, 'warning'],
                        ['Magic Damage', subclass.base_magic_damage, 'primary'],
                        ['Magic Defense', subclass.base_magic_defense, 'success'],
                    ].map(([label, val, color]) => (
                        <div className="col-6 col-md-3" key={label}>
                            <div className={`card bg-dark border-${color} text-center`}>
                                <div className="card-body">
                                    <div className={`text-${color} fs-3 fw-bold`}>{val}</div>
                                    <div className="small text-secondary">{label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <h4 className="mt-5">Skills (Tier 1)</h4>
                <div className="row g-3">
                    {subclass.skills.map((skill) => (
                        <div className="col-md-6" key={skill.id}>
                            <div className="card bg-dark border-secondary h-100">
                                <div className="card-body">
                                    <h5 className="card-title d-flex justify-content-between">
                                        {skill.name}
                                        <span className="badge bg-secondary">{skill.scaling_stat}</span>
                                    </h5>
                                    <p className="small text-secondary mb-2">{skill.description}</p>
                                    <div className="d-flex gap-3 small">
                                        {skill.stamina_cost > 0 && <span>⚡ {skill.stamina_cost} Stamina</span>}
                                        {skill.mana_cost > 0 && <span>🔷 {skill.mana_cost} Mana</span>}
                                        <span>⏱ {skill.cooldown_seconds}s CD</span>
                                        <span>x{skill.base_multiplier} DMG</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
