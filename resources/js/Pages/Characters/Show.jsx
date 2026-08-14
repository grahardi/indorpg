import { Head, useForm, Link, router } from '@inertiajs/react';
import { useRef } from 'react';
import Layout from '../../Layout';

const CLASS_ACCENT = {
    warrior: '#b8433a',
    tanker: '#3f8c94',
    mage: '#7269d1',
    saint: '#c9a24b',
};

function ImageUploadSlot({ label, spec, currentUrl, fieldName, uploadUrl, aspect }) {
    const inputRef = useRef(null);
    const { setData, post, progress, errors } = useForm({ [fieldName]: null });

    function handleFile(file) {
        if (!file) return;
        setData(fieldName, file);
        router.post(uploadUrl, { [fieldName]: file }, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <div>
            <div className="rpg-skill-group-title d-flex justify-content-between">
                <span>{label}</span>
                <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>{spec}</span>
            </div>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files[0]);
                }}
                style={{
                    aspectRatio: aspect,
                    background: currentUrl ? `#000 url(${currentUrl}) center/cover no-repeat` : 'var(--bg-panel)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                }}
            >
                {!currentUrl && <span>Klik atau drop gambar di sini</span>}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={(e) => handleFile(e.target.files[0])}
            />
            {progress && (
                <div className="progress mt-2" style={{ height: 4 }}>
                    <div className="progress-bar" style={{ width: `${progress.percentage}%` }} />
                </div>
            )}
            {errors[fieldName] && <div className="text-danger small mt-1">{errors[fieldName]}</div>}
        </div>
    );
}

export default function Show({ character }) {
    const accent = CLASS_ACCENT[character.subclass?.gameClass?.slug] ?? '#8890a4';

    return (
        <Layout>
            <Head title={character.name} />
            <div className="container py-5">
                <Link href={route('characters.index')} className="rpg-back-link mb-4">
                    &larr; Roster
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-4">
                    <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                        {character.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{character.name}</h1>
                        <p className="rpg-power-type mb-0">
                            Level {character.level} &middot; {character.subclass?.name} &middot; {character.subclass?.gameClass?.name}
                        </p>
                    </div>
                </div>

                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <ImageUploadSlot
                            label="Avatar"
                            spec="256×256, crop bahu ke atas"
                            currentUrl={character.avatar_url}
                            fieldName="avatar"
                            uploadUrl={route('characters.avatar', character.id)}
                            aspect="1 / 1"
                        />
                    </div>
                    <div className="col-md-4">
                        <ImageUploadSlot
                            label="Full Body"
                            spec="512×1024, telapak kaki di bawah"
                            currentUrl={character.full_body_url}
                            fieldName="full_body"
                            uploadUrl={route('characters.fullbody', character.id)}
                            aspect="1 / 2"
                        />
                    </div>
                    <div className="col-md-4">
                        <div className="rpg-skill-group-title">Resource</div>
                        <div className="rpg-card" style={{ '--accent': accent }}>
                            {[
                                ['HP', character.current_hp, '#b8433a'],
                                ['Stamina', character.current_stamina, '#c98a3a'],
                                ['Mana', character.current_mana, '#7269d1'],
                            ].map(([label, val, color]) => (
                                <div key={label} className="rpg-stat-row">
                                    <div className="rpg-stat-label"><span>{label}</span><span>{val}</span></div>
                                </div>
                            ))}
                            <p className="small text-secondary mt-2 mb-0">EXP: {character.exp}</p>
                        </div>
                    </div>
                </div>

                <div className="rpg-skill-group-title">Skill Terbuka</div>
                {character.skills.length === 0 ? (
                    <p className="text-secondary small">Belum ada skill yang di-assign ke karakter ini.</p>
                ) : (
                    <div className="row g-3">
                        {character.skills.map((s) => (
                            <div className="col-md-6" key={s.id}>
                                <div className="rpg-skill-card">
                                    {s.icon_path && <img src={s.icon_path} alt={s.name} className="rpg-skill-icon" />}
                                    <div>
                                        <div className="rpg-skill-name">{s.name}</div>
                                        <p className="rpg-skill-desc">{s.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
