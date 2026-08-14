import { Link, Head, useForm, router } from '@inertiajs/react';
import { useRef } from 'react';
import Layout from '../../Layout';

const CLASS_META = {
    warrior: { accent: '#b8433a' },
    tanker: { accent: '#3f8c94' },
    mage: { accent: '#7269d1' },
    saint: { accent: '#c9a24b' },
};

function ArtUploadSlot({ label, spec, currentUrl, fieldName, uploadUrl, aspect, background }) {
    const inputRef = useRef(null);
    const { setData, progress, errors } = useForm({ [fieldName]: null });

    function handleFile(file) {
        if (!file) return;
        setData(fieldName, file);
        router.post(uploadUrl, { [fieldName]: file }, {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function openPicker(e) {
        e.stopPropagation();
        inputRef.current?.click();
    }

    return (
        <div>
            <div className="rpg-skill-group-title d-flex justify-content-between">
                <span>{label}</span>
                <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>{spec}</span>
            </div>
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files[0]);
                }}
                style={{
                    position: 'relative',
                    aspectRatio: aspect,
                    background,
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    overflow: 'hidden',
                }}
            >
                {currentUrl && (
                    <img
                        src={currentUrl}
                        alt={label}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                )}
                {!currentUrl && (
                    <div
                        onClick={openPicker}
                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'rgba(11,12,18,0.35)' }}
                    >
                        Klik atau drop gambar di sini
                    </div>
                )}
                {currentUrl && (
                    <button
                        type="button"
                        onClick={openPicker}
                        className="btn btn-sm"
                        style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(11,12,18,0.85)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '5px 12px', borderRadius: 6 }}
                    >
                        ✎ Ganti Gambar
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={(e) => handleFile(e.target.files[0])} />
            {progress && (
                <div className="progress mt-2" style={{ height: 4 }}>
                    <div className="progress-bar" style={{ width: `${progress.percentage}%` }} />
                </div>
            )}
            {errors[fieldName] && <div className="text-danger small mt-1">{errors[fieldName]}</div>}
        </div>
    );
}

function SkillCard({ skill, accent }) {
    const isUltimate = skill.tier === 3;
    return (
        <div className="col-md-6" key={skill.id}>
            <div className={`rpg-skill-card ${isUltimate ? 'is-ultimate' : ''}`}>
                {skill.icon_path ? (
                    <img src={skill.icon_path} alt={skill.name} className="rpg-skill-icon" />
                ) : (
                    <div
                        className="rpg-skill-icon d-flex align-items-center justify-content-center"
                        style={{ background: 'var(--bg-panel-hover)', color: accent, fontFamily: 'var(--font-display)' }}
                    >
                        {skill.name.charAt(0)}
                    </div>
                )}
                <div className="flex-grow-1">
                    <div className="rpg-skill-name">
                        {skill.name}
                        {isUltimate && (
                            <span className="rpg-element-badge ms-2" style={{ '--accent': '#c9a24b', color: '#c9a24b' }}>
                                ULTIMATE
                            </span>
                        )}
                    </div>
                    <p className="rpg-skill-desc">{skill.description}</p>
                    <div className="rpg-skill-cost">
                        {skill.stamina_cost > 0 && <span>⚡ {skill.stamina_cost} Stamina</span>}
                        {skill.mana_cost > 0 && <span>🔷 {skill.mana_cost} Mana</span>}
                        <span>⏱ {skill.cooldown_seconds}s CD</span>
                        <span>×{skill.base_multiplier} DMG</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Show({ subclass }) {
    const accent = CLASS_META[subclass.gameClass?.slug]?.accent ?? '#8890a4';

    const physicalSkills = subclass.skills.filter((s) => s.tier !== 3 && s.scaling_stat === 'physical');
    const magicSkills = subclass.skills.filter((s) => s.tier !== 3 && s.scaling_stat === 'magic');
    const ultimateSkills = subclass.skills.filter((s) => s.tier === 3);

    // Avatar & Full Body sama-sama pakai background scene yang diupload user (shared asset).
    const avatarBackground = "url('/images/subclasses/backgrounds/avatar-bg.jpg') center/cover no-repeat";
    const fullBodyBackground = "url('/images/subclasses/backgrounds/fullbody-bg.jpg') center/cover no-repeat";

    return (
        <Layout>
            <Head title={subclass.name} />
            <div className="container py-5">
                <Link href={route('classes.index')} className="rpg-back-link mb-4">
                    &larr; Kembali ke Codex
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-2">
                    {subclass.avatar_path ? (
                        <img
                            src={subclass.avatar_path}
                            alt={subclass.name}
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0, background: 'var(--bg-panel)' }}
                        />
                    ) : (
                        <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                            {subclass.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{subclass.name}</h1>
                        <p className="rpg-power-type mb-0">
                            {subclass.gameClass?.name} &middot; {subclass.power_type}
                            {subclass.element && <> &middot; Elemen {subclass.element.name}</>}
                        </p>
                    </div>
                </div>
                <p className="rpg-class-desc mt-3">{subclass.description}</p>
                {subclass.flavor_bonus && (
                    <p className="rpg-flavor-note" style={{ color: accent }}>{subclass.flavor_bonus}</p>
                )}

                {/* Avatar bersebelahan dengan Stats */}
                <div className="row g-4 my-4 align-items-stretch">
                    <div className="col-md-4">
                        <ArtUploadSlot
                            label="Avatar"
                            spec="256×256"
                            currentUrl={subclass.avatar_path}
                            fieldName="avatar"
                            uploadUrl={route('subclass.avatar', subclass.id)}
                            aspect="1 / 1"
                            background={avatarBackground}
                        />
                    </div>
                    <div className="col-md-8">
                        <div className="rpg-skill-group-title">Stats</div>
                        <div className="row g-3 h-100">
                            {[
                                ['Physical Damage', subclass.base_physical_damage, '#b8433a'],
                                ['Physical Defense', subclass.base_physical_defense, '#c98a3a'],
                                ['Magic Damage', subclass.base_magic_damage, '#7269d1'],
                                ['Magic Defense', subclass.base_magic_defense, '#3f8c94'],
                            ].map(([label, val, color]) => (
                                <div className="col-6" key={label}>
                                    <div className="rpg-card text-center" style={{ '--accent': color }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 600, color }}>
                                            {val}
                                        </div>
                                        <div className="rpg-power-type mt-1">{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="rpg-loadout-note" style={{ '--accent': accent, borderColor: accent }}>
                    Default penggunaan tempur: pilih 3 dari Skill Fisik / Magic, ditambah 1 Ultimate.
                </p>

                {/* Full Body bersebelahan dengan Skill/Magic/Ultimate */}
                <div className="row g-4">
                    <div className="col-md-4">
                        <div style={{ position: 'sticky', top: 90 }}>
                            <ArtUploadSlot
                                label="Full Body"
                                spec="512×1024"
                                currentUrl={subclass.full_body_path}
                                fieldName="full_body"
                                uploadUrl={route('subclass.fullbody', subclass.id)}
                                aspect="1 / 2"
                                background={fullBodyBackground}
                            />
                        </div>
                    </div>
                    <div className="col-md-8">
                        {physicalSkills.length > 0 && (
                            <div className="mb-4">
                                <div className="rpg-skill-group-title">Skill Fisik</div>
                                <div className="row g-3">
                                    {physicalSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                                </div>
                            </div>
                        )}

                        {magicSkills.length > 0 && (
                            <div className="mb-4">
                                <div className="rpg-skill-group-title">Magic</div>
                                <div className="row g-3">
                                    {magicSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                                </div>
                            </div>
                        )}

                        {ultimateSkills.length > 0 && (
                            <div className="mb-4">
                                <div className="rpg-skill-group-title">Ultimate</div>
                                <div className="row g-3">
                                    {ultimateSkills.map((s) => <SkillCard skill={s} accent={accent} key={s.id} />)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
