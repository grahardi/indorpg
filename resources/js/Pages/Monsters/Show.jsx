import { Link, Head, useForm, router } from '@inertiajs/react';
import { useRef } from 'react';
import Layout from '../../Layout';

const TYPE_ACCENT = {
    Slime: '#3f8c94',
    Beast: '#b8433a',
    Undead: '#5b6178',
    Humanoid: '#c98a3a',
    Insect: '#3f8c94',
    Spirit: '#7269d1',
    Elemental: '#b8433a',
    Construct: '#8890a4',
};

function patternLabel(pattern) {
    if (!pattern) return '-';
    const [range, dmg] = pattern.split('_');
    const rangeLabel = { close: 'Jarak Dekat', range: 'Jarak Jauh', area: 'Area' }[range] ?? range;
    const dmgLabel = { physical: 'Fisik', magic: 'Sihir' }[dmg] ?? dmg;
    return `${rangeLabel} · ${dmgLabel}`;
}

function ArtUploadSlot({ label, spec, currentUrl, fieldName, uploadUrl, aspect, background }) {
    const inputRef = useRef(null);
    const { setData, progress, errors } = useForm({ [fieldName]: null });

    function handleFile(file) {
        if (!file) return;
        setData(fieldName, file);
        router.post(uploadUrl, { [fieldName]: file }, { forceFormData: true, preserveScroll: true });
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
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                style={{ position: 'relative', aspectRatio: aspect, background, border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}
            >
                {currentUrl && (
                    <img src={currentUrl} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
                {!currentUrl && (
                    <div
                        onClick={openPicker}
                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
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

export default function Show({ monster, mapName }) {
    const accent = TYPE_ACCENT[monster.type] ?? '#8890a4';

    const theme = mapName?.includes('Reruntuhan') ? 'ruins' : mapName?.includes('Hutan') ? 'forest' : null;
    const fallbackBg = `radial-gradient(circle at 50% 30%, ${accent}2e, var(--bg-panel) 75%)`;
    const avatarBackground = theme ? `url('/images/monsters/backgrounds/${theme}-avatar-bg.jpg') center/cover no-repeat` : fallbackBg;
    const fullViewBackground = theme ? `url('/images/monsters/backgrounds/${theme}-fullview-bg.jpg') center/cover no-repeat` : fallbackBg;

    return (
        <Layout>
            <Head title={monster.name} />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                <Link href={route('monsters.index')} className="rpg-back-link mb-4">
                    &larr; Bestiary
                </Link>

                <div className="d-flex align-items-center gap-3 mt-4 mb-2">
                    {monster.avatar_path ? (
                        <img
                            src={monster.avatar_path}
                            alt={monster.name}
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, flexShrink: 0, background: 'var(--bg-panel)' }}
                        />
                    ) : (
                        <div className="rpg-badge-hex" style={{ '--accent': accent, width: 64, height: 64, fontSize: '1.6rem' }}>
                            {monster.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="rpg-class-title mb-0" style={{ fontSize: '2rem' }}>{monster.name}</h1>
                        <p className="rpg-power-type mb-0">
                            Level Dasar {monster.level} &middot; {monster.type}
                            {monster.element && <> &middot; Elemen {monster.element.name}</>}
                        </p>
                    </div>
                </div>
                <p className="rpg-class-desc mt-3">{monster.description}</p>
                <p className="text-secondary small" style={{ maxWidth: 480 }}>
                    Level {monster.level} di atas cuma level <strong>dasar/minimum</strong> — level asli tiap battle
                    di-acak, bisa naik sampai (level tertinggi party kamu + 3). Stat (HP, damage, EXP) ikut naik
                    otomatis sesuai level yang keluar.
                </p>

                {/* Full View - 1:1, monster di tengah frame */}
                <div className="mx-auto my-4" style={{ maxWidth: 360 }}>
                    <ArtUploadSlot
                        label="Full View"
                        spec="512×512"
                        currentUrl={monster.full_body_path}
                        fieldName="full_body"
                        uploadUrl={route('monsters.fullbody', monster.id)}
                        aspect="1 / 1"
                        background={fullViewBackground}
                    />
                </div>

                <div className="rpg-skill-group-title mt-4">Stat Level Dasar (Lv.{monster.level})</div>
                <div className="row g-3 my-3">
                    {[
                        ['HP', monster.hp, '#3f8c94'],
                        ['Physical DMG', monster.physical_damage, '#b8433a'],
                        ['Physical DEF', monster.physical_defense, '#c98a3a'],
                        ['Magic DMG', monster.magic_damage, '#7269d1'],
                        ['Magic DEF', monster.magic_defense, '#3f8c94'],
                        ['EXP Reward', monster.exp_reward, '#c9a24b'],
                    ].map(([label, val, color]) => (
                        <div className="col-4" key={label}>
                            <div className="rpg-card text-center" style={{ '--accent': color }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color }}>
                                    {val}
                                </div>
                                <div className="rpg-power-type mt-1">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <div className="rpg-card h-100" style={{ '--accent': '#3f8c94' }}>
                            <div className="rpg-skill-group-title mb-2" style={{ color: '#3f8c94' }}>▲ Kuat Melawan</div>
                            <div className="rpg-subclass-name">{patternLabel(monster.strong_against)}</div>
                            <p className="rpg-skill-desc mt-2 mb-0">
                                Damage dari pola serangan ini akan dikurangi saat menyerang {monster.name}.
                            </p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="rpg-card h-100" style={{ '--accent': '#b8433a' }}>
                            <div className="rpg-skill-group-title mb-2" style={{ color: '#b8433a' }}>▼ Lemah Melawan</div>
                            <div className="rpg-subclass-name">{patternLabel(monster.weak_against)}</div>
                            <p className="rpg-skill-desc mt-2 mb-0">
                                Damage dari pola serangan ini akan diperbesar saat menyerang {monster.name}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Avatar bersebelahan dengan Special Skill */}
                <div className="row g-4 align-items-stretch mb-4">
                    <div className="col-md-4">
                        <ArtUploadSlot
                            label="Avatar"
                            spec="256×256"
                            currentUrl={monster.avatar_path}
                            fieldName="avatar"
                            uploadUrl={route('monsters.avatar', monster.id)}
                            aspect="1 / 1"
                            background={avatarBackground}
                        />
                    </div>
                    <div className="col-md-8">
                        <div className="rpg-skill-group-title">Special Skill</div>
                        {monster.special_skill_name ? (
                            <div className="rpg-skill-card is-ultimate h-100">
                                <div
                                    className="rpg-skill-icon d-flex align-items-center justify-content-center"
                                    style={{ background: 'var(--bg-panel-hover)', color: accent, fontFamily: 'var(--font-display)' }}
                                >
                                    ★
                                </div>
                                <div>
                                    <div className="rpg-skill-name">{monster.special_skill_name}</div>
                                    <p className="rpg-skill-desc mb-0">{monster.special_skill_description}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rpg-card h-100 d-flex align-items-center justify-content-center text-secondary" style={{ '--accent': '#5b6178' }}>
                                Monster ini gak punya special skill.
                            </div>
                        )}
                    </div>
                </div>

                <p className="rpg-loadout-note" style={{ '--accent': accent, borderColor: accent }}>
                    Disarankan melawan monster ini dengan party level {monster.min_party_level}+ (pilih 2-3 karakter).
                </p>
            </div>
        </Layout>
    );
}
