import { Link, Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { battleAudio } from '../../battleAudio';

const MONSTER_COLOR = '#b8433a';
const PARTICIPANT_COLORS = ['#3f8c94', '#c9a24b', '#7269d1'];

function Bar({ current, max, color }) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    return (
        <div className="rpg-stat-track" style={{ height: 6 }}>
            <div className="rpg-stat-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
        </div>
    );
}

// Bar skill icon buat mode Manual - 5 tombol (4 skill biasa + 1 ulti), overlay
// cooldown (angka detik/tick sisa), abu-abu kalau gak affordable/lagi cooldown.
function ManualSkillBar({ participant, battle, onUseSkill, disabled, keyBindings }) {
    // BUG FIX: sebelumnya nowSeconds cuma ke-hitung SEKALI tiap kali parent
    // re-render (yaitu abis ada respons server baru - klik skill atau
    // auto-poll). Di antara itu, angka cooldown-nya BEKU, gak keliatan
    // "ngitung mundur" beneran walau logic-nya sebenernya udah bener di
    // belakang layar. Fix: tick sendiri tiap 1 detik (independen dari kapan
    // parent re-render), biar keliatan real countdown - berlaku sama buat
    // skill biasa MAUPUN ultimate.
    const [, forceTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!participant) return null;

    const loadout = (participant.character.subclass?.skills ?? [])
        .filter((s) => (participant.loadout_skill_ids ?? []).includes(s.id));
    const tier1 = loadout.filter((s) => s.tier === 1);
    const ulti = loadout.filter((s) => s.tier === 3);
    const slots = [...tier1, ...ulti];
    const keyLabels = [keyBindings.skill1, keyBindings.skill2, keyBindings.skill3, keyBindings.skill4, keyBindings.ulti];
    const cooldowns = participant.skill_cooldowns ?? {};
    // Waktu asli (detik) sejak battle mulai - dipakai buat cooldown, BUKAN
    // "tick" bersama - independen per karakter, dibandingin langsung ke
    // skill.cooldown_seconds (presisi, gak dibulatin ke satuan tick lagi).
    const nowSeconds = (Date.now() - new Date(battle.created_at).getTime()) / 1000;

    return (
        <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
            {slots.map((skill, i) => {
                const lastUsed = cooldowns[skill.id];
                const remainingSeconds = lastUsed !== undefined ? Math.ceil(skill.cooldown_seconds - (nowSeconds - lastUsed)) : 0;
                const onCooldown = remainingSeconds > 0;
                const affordable = participant.current_mana >= skill.mana_cost && participant.current_stamina >= skill.stamina_cost;
                const usable = !onCooldown && affordable && !disabled;

                return (
                    <button
                        key={skill.id}
                        onClick={() => usable && onUseSkill(skill.id)}
                        disabled={!usable}
                        title={`${skill.name} (${skill.mana_cost} MP / ${skill.stamina_cost} SP)`}
                        style={{
                            position: 'relative', width: 48, height: 48, borderRadius: 9,
                            background: !usable ? '#3a3d4a' : skill.tier === 3 ? 'rgba(201,162,75,0.15)' : 'var(--bg-panel-hover)',
                            border: `2px solid ${!usable ? '#5b6178' : skill.tier === 3 ? '#c9a24b' : 'var(--border-subtle)'}`,
                            opacity: usable ? 1 : 0.55, cursor: usable ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            filter: usable ? 'none' : 'grayscale(0.8)',
                        }}
                    >
                        {skill.icon_path ? (
                            <img src={skill.icon_path} alt={skill.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', padding: 2 }}>{skill.name}</span>
                        )}
                        {onCooldown && (
                            <div
                                style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                                }}
                            >
                                {remainingSeconds}
                            </div>
                        )}
                        <div
                            style={{
                                position: 'absolute', bottom: 2, left: 2, fontSize: '0.5rem', fontWeight: 700,
                                color: '#c9a24b', background: 'rgba(11,12,18,0.8)', borderRadius: 4, padding: '0 3px',
                            }}
                        >
                            {keyLabels[i]}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// Angka damage/heal/miss yang muncul sesaat lalu melayang naik & fade -
// gantiin battle log teks yang dihapus total. Key harus BEDA tiap kali effect
// baru muncul (biar React remount & animasi replay dari awal).
function FloatingNumber({ effect, animKey, side = 'center' }) {
    if (!effect || !['damage', 'miss', 'heal'].includes(effect.type)) return null;
    const isHeal = effect.type === 'heal';
    const isMiss = effect.type === 'miss';
    const color = isHeal ? '#4ad980' : isMiss ? '#c9c9c9' : '#ff5252';
    const text = isMiss ? 'MELESET' : isHeal ? `+${effect.value}` : `-${effect.value}`;

    // Player (kanan, hadap monster ke kiri) -> teks nongol di SISI KANAN sprite.
    // NPC (kiri, hadap monster ke kanan) -> teks nongol di SISI KIRI sprite.
    // Monster -> tengah/default (dipasang manual di bawah monster oleh caller).
    const posStyle = side === 'right'
        ? { top: '25%', left: '100%', marginLeft: 4 }
        : side === 'left'
            ? { top: '25%', right: '100%', marginRight: 4 }
            : { top: '-6%', left: '50%', transform: 'translateX(-50%)' };

    return (
        <div
            key={animKey}
            className="rpg-floating-number"
            style={{
                position: 'absolute', ...posStyle,
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: isMiss ? '0.85rem' : effect.is_critical ? '1.5rem' : '1.1rem',
                color, textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                zIndex: 9, pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
        >
            {text}{effect.is_critical && '!'}
        </div>
    );
}

export default function Show({ battle: initialBattle, battleBackground, keyBindings = {}, skillActionDelay = 2, audioSettings = {} }) {
    const { props } = usePage();
    const currentUserId = props.auth?.user?.id;
    const isManual = initialBattle.mode === 'manual';

    // Mode manual: battle state di-mutate LOKAL (bukan di-replay dari log
    // pre-resolved kayak auto) - tiap aksi manual update state ini via fetch().
    const [liveBattle, setLiveBattle] = useState(initialBattle);
    const [liveLog, setLiveLog] = useState(initialBattle.battle_log || []);
    const [acting, setActing] = useState(false);
    const battle = isManual ? liveBattle : initialBattle;
    const monster = battle.monster;
    const log = isManual ? liveLog : (battle.battle_log || []);

    // Level & stat monster yang beneran dipakai battle ini (udah di-scale
    // sesuai level encounter) - fallback ke stat statis monster kalau battle
    // lama (dibuat sebelum fitur level dinamis ada, monster_level-nya null).
    const monsterLevel = battle.monster_level ?? monster.level;
    const monsterMaxHp = battle.monster_stats?.hp ?? monster.hp;
    const monsterExpReward = battle.monster_stats?.exp_reward ?? monster.exp_reward;

    const [step, setStep] = useState(0);
    const [finished, setFinished] = useState(log.length <= 1);
    const [soundOn, setSoundOn] = useState(true);
    const [redirectIn, setRedirectIn] = useState(null);
    const [userSkipped, setUserSkipped] = useState(false);
    const timerRef = useRef(null);
    const finishedSoundPlayed = useRef(false);

    // Status yang beneran ditampilin - kalau user klik Lewati, dianggap
    // "menyerah" (gak nunggu hasil), TERLEPAS dari status asli battle di
    // database. Catatan: EXP/reward battle yang sebenarnya udah kepotong dari
    // awal (battle di-resolve penuh di server sebelum halaman ini kebuka),
    // jadi ini murni override tampilan doang - reward yang beneran gak berubah.
    const displayStatus = userSkipped ? 'fled' : battle.status;

    // Target total durasi animasi 15-30 detik, interval per baris log disesuaikan
    // biar totalnya masuk range itu (dibatasi biar gak terlalu cepat/lambat per baris).
    const intervalMs = useMemo(() => {
        const targetTotal = 15000 + Math.random() * 15000;
        const raw = targetTotal / Math.max(log.length - 1, 1);
        return Math.max(700, Math.min(2600, raw));
    }, [log.length]);

    useEffect(() => {
        if (isManual) {
            // Mode manual: gak ada animasi playback (log tumbuh live dari aksi
            // player), langsung tampilin state terkini setiap kali log berubah.
            setStep(log.length - 1);
            setFinished(battle.status !== 'ongoing');
            return;
        }
        if (step >= log.length - 1) {
            setFinished(true);
            return;
        }
        timerRef.current = setTimeout(() => setStep((s) => s + 1), intervalMs);
        return () => clearTimeout(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, log.length, intervalMs, isManual, battle.status]);

    // Trigger efek suara sesuai isi baris log yang baru muncul - pakai data
    // 'effect' terstruktur (bukan text-matching doang), plus custom audio
    // dari admin (audioSettings) kalau ada, fallback ke sintesis kalau kosong.
    useEffect(() => {
        if (!soundOn) return;
        const entry = log[step];
        if (!entry) return;

        if (entry.text?.includes('dapat item')) {
            battleAudio.itemDrop(audioSettings.audio_item_drop);
            return;
        }
        if (entry.text?.includes('muncul menghadang')) {
            battleAudio.cast(audioSettings.audio_battle_start);
            return;
        }

        const effect = entry.effect;
        if (effect?.type === 'miss') {
            battleAudio.miss(audioSettings.audio_miss);
            return;
        }
        if (effect?.type === 'damage') {
            if (effect.is_critical) {
                battleAudio.critical(audioSettings.audio_critical);
            } else if (entry.is_monster_actor) {
                // Monster yang nyerang party -> "kena serangan" (beda dari nyerang monster).
                battleAudio.hitTaken(audioSettings.audio_hit_taken);
            } else if (effect.is_ultimate) {
                battleAudio.ultimate(audioSettings.audio_ultimate);
            } else if (entry.skill_id) {
                battleAudio.skill(audioSettings.audio_skill);
            } else {
                battleAudio.hit(audioSettings.audio_skill);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Suara menang/kalah, sekali doang pas animasi kelar. Gak bunyi kalau
    // user nge-skip (dianggap menyerah, gak ada suara menang/kalah).
    useEffect(() => {
        if (!finished || finishedSoundPlayed.current || !soundOn || userSkipped) return;
        if (battle.status === 'won') battleAudio.victory(audioSettings.audio_victory);
        else if (battle.status === 'lost') battleAudio.defeat(audioSettings.audio_defeat);
        finishedSoundPlayed.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    // Auto-balik ke Guild beberapa detik setelah battle kelar - biar gak ada yang
    // "kejebak" di layar battle lama pas balik buka app lagi.
    useEffect(() => {
        if (!finished || battle.status === 'ongoing') return;
        setRedirectIn(5);
        const countdown = setInterval(() => {
            setRedirectIn((s) => {
                if (s <= 1) {
                    clearInterval(countdown);
                    router.visit(route('guild.index'));
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(countdown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    function skipToEnd() {
        clearTimeout(timerRef.current);
        setStep(log.length - 1);
        setFinished(true);
        setUserSkipped(true);
    }

    // Kirim 1 aksi manual (klik skill / keyboard) ke server, update state
    // lokal dari response (battle terbaru + log delta yang di-append).
    async function sendManualAction(skillId) {
        if (acting || battle.status !== 'ongoing') return;
        setActing(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('battles.act', battle.token), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ skill_id: skillId }),
            });
            const json = await res.json();
            if (json.battle) {
                setLiveBattle(json.battle);
                setLiveLog((prev) => [...prev, ...(json.log || [])]);
            }
        } catch (err) {
            // Diemin - biar player bisa coba lagi, gak perlu alert intrusif tiap gagal request.
        } finally {
            setActing(false);
        }
    }

    // Keyboard shortcut mode manual: default Q W A S buat skill 1-4, R buat ulti
    // (bisa diubah admin). Cari participant milik player yang login, resolve
    // skill dari loadout-nya, kirim aksi kalau tombol yang dipencet cocok.
    useEffect(() => {
        if (!isManual) return;
        function handleKeyDown(e) {
            const myParticipant = battle.participants.find((p) => p.character.user_id === currentUserId);
            if (!myParticipant) return;
            const loadout = (myParticipant.character.subclass?.skills ?? [])
                .filter((s) => (myParticipant.loadout_skill_ids ?? []).includes(s.id));
            const tier1 = loadout.filter((s) => s.tier === 1);
            const ulti = loadout.find((s) => s.tier === 3);
            const key = e.key.toUpperCase();
            const slotMap = { [keyBindings.skill1]: tier1[0], [keyBindings.skill2]: tier1[1], [keyBindings.skill3]: tier1[2], [keyBindings.skill4]: tier1[3], [keyBindings.ulti]: ulti };
            const skill = slotMap[key];
            if (skill) sendManualAction(skill.id);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManual, battle.participants, acting]);

    // BUG FIX PENTING: sebelumnya NPC & monster CUMA gerak sebagai efek samping
    // player ngirim aksi (klik/keyboard) - kalau player diem aja mikir, battle
    // ikut freeze total (NPC gak nyerang, monster gak nyerang). Fix: polling
    // otomatis tiap skillActionDelay detik, kirim "aksi kosong" (skillId=null,
    // artinya "player skip giliran ini") - server tetap proses NPC & monster
    // meski player belum milih apa-apa, battle jalan terus.
    useEffect(() => {
        if (!isManual || battle.status !== 'ongoing') return;
        const interval = setInterval(() => {
            if (!acting) sendManualAction(null);
        }, skillActionDelay * 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManual, battle.status, acting, skillActionDelay]);

    const current = log[step] || { monster_hp: battle.monster_current_hp, participants: {} };

    // Skill animation (GIF) yang lagi aktif di step ini, kalau skill yang dipakai
    // punya animation_path. Ilang otomatis pas step ganti (gak di-track manual).
    const activeAnimation = useMemo(() => {
        if (!current.skill_id || !current.actor_character_id) return null;
        const participant = battle.participants.find((p) => p.character_id === current.actor_character_id);
        if (!participant) return null;
        const skill = participant.character.subclass?.skills?.find((s) => s.id === current.skill_id);
        if (!skill?.animation_path) return null;
        return { path: skill.animation_path, characterId: current.actor_character_id, isUltimate: skill.tier === 3 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Karakter "utama" buat layar hasil - punya user yang login, fallback ke yang pertama.
    const mainIndex = battle.participants.findIndex((p) => p.character.user_id === currentUserId);
    const mainParticipant = mainIndex >= 0 ? battle.participants[mainIndex] : battle.participants[0];
    const mainColor = PARTICIPANT_COLORS[(mainIndex >= 0 ? mainIndex : 0) % PARTICIPANT_COLORS.length];
    const mainSubclass = mainParticipant?.character?.subclass;

    // ===== LAYAR HASIL (battle selesai) - tampilan baru, gak ada lagi scene battle-nya =====
    if (finished && battle.status !== 'ongoing') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
                <Head title={displayStatus === 'won' ? 'Menang!' : displayStatus === 'lost' ? 'Kalah' : 'Mundur'} />
                <div className="container py-5" style={{ maxWidth: 560 }}>
                    <div className="rpg-card text-center" style={{ '--accent': displayStatus === 'won' ? '#c9a24b' : displayStatus === 'lost' ? '#5b6178' : '#8890a4', padding: '2rem 1.5rem' }}>
                        {(displayStatus === 'won' || displayStatus === 'lost') && (
                            <div className="d-flex align-items-center justify-content-center gap-3 gap-md-4 mb-4 flex-wrap">
                                <div style={{ width: 130, position: 'relative' }}>
                                    {mainSubclass?.full_body_path ? (
                                        <img
                                            src={mainSubclass.full_body_path}
                                            alt={mainParticipant.character.name}
                                            style={{
                                                width: '100%', aspectRatio: '1 / 2', objectFit: 'contain',
                                                background: 'var(--bg-panel)', borderRadius: 10,
                                                border: `2px solid ${displayStatus === 'lost' ? '#5b6178' : mainColor}`,
                                                filter: displayStatus === 'lost' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': mainColor, width: 90, height: 90, fontSize: '2rem', filter: displayStatus === 'lost' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {mainParticipant.character.name.charAt(0)}
                                        </div>
                                    )}
                                    {displayStatus === 'lost' && (
                                        <div
                                            style={{
                                                position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
                                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#5b6178',
                                                textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 3px black',
                                            }}
                                        >
                                            TUMBANG
                                        </div>
                                    )}
                                    <div className="mt-2" style={{ color: displayStatus === 'lost' ? 'var(--text-muted)' : mainColor, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {mainParticipant.character.name}
                                    </div>
                                </div>

                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                    VS
                                </div>

                                <div style={{ width: 130, position: 'relative' }}>
                                    {monster.full_body_path ? (
                                        <img
                                            src={monster.full_body_path}
                                            alt={monster.name}
                                            style={{
                                                width: '100%', aspectRatio: '1 / 1', objectFit: 'contain',
                                                background: 'var(--bg-panel)', borderRadius: 10,
                                                border: `2px solid ${displayStatus === 'won' ? '#5b6178' : MONSTER_COLOR}`,
                                                filter: displayStatus === 'won' ? 'grayscale(1) brightness(0.55)' : 'none',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rpg-badge-hex mx-auto"
                                            style={{ '--accent': MONSTER_COLOR, width: 90, height: 90, fontSize: '2rem', filter: displayStatus === 'won' ? 'grayscale(1) brightness(0.6)' : 'none' }}
                                        >
                                            {monster.name.charAt(0)}
                                        </div>
                                    )}
                                    {displayStatus === 'won' && (
                                        <div
                                            style={{
                                                position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%, -50%) rotate(-8deg)',
                                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#b8433a',
                                                textShadow: '0 0 10px rgba(0,0,0,0.9), 0 0 3px black',
                                            }}
                                        >
                                            K.O.
                                        </div>
                                    )}
                                    <div className="mt-2" style={{ color: displayStatus === 'won' ? 'var(--text-muted)' : MONSTER_COLOR, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {monster.name}
                                    </div>
                                </div>
                            </div>
                        )}

                        {displayStatus === 'fled' && (
                            <div className="mb-3" style={{ fontSize: '3.5rem', lineHeight: 1 }}>🏳️</div>
                        )}

                        <div className="rpg-subclass-name" style={{ fontSize: '1.5rem' }}>
                            {displayStatus === 'won' && '🏆 Menang!'}
                            {displayStatus === 'lost' && '💀 Kalah...'}
                            {displayStatus === 'fled' && 'Party Menyerah'}
                        </div>
                        {displayStatus === 'fled' && (
                            <p className="text-secondary small mt-1 mb-0">Pertarungan kelamaan, party mundur teratur.</p>
                        )}

                        {displayStatus === 'won' && (
                            <div className="mt-3">
                                <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem' }}>Hadiah</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: '#c9a24b' }}>
                                    +{monsterExpReward} EXP <span className="rpg-power-type" style={{ fontSize: '0.85rem' }}>/ karakter</span>
                                </div>
                            </div>
                        )}

                        {redirectIn !== null && redirectIn > 0 && (
                            <p className="text-secondary small mt-4 mb-0">Kembali ke Guild otomatis dalam {redirectIn}s...</p>
                        )}
                        <div className="d-flex gap-2 justify-content-center mt-3">
                            <Link href={route('guild.index')} className="rpg-back-link">Kembali ke Guild</Link>
                            <Link href={route('maps.index')} className="rpg-back-link">Peta</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== LAYAR BATTLE BERJALAN (animasi playback) - arena scene =====
    // Layout baru: Player selalu di KIRI (sendiri, agak besar), Monster di
    // TENGAH (besar), NPC ditumpuk di KANAN (kecil, sampai 2). Player & NPC
    // sama-sama "menghadap" ke tengah (monster) - makanya floating number-nya
    // muncul di sisi yang ngarah ke monster (kanan buat Player, kiri buat NPC).
    const npcParticipants = battle.participants.filter((p) => p.character.user_id !== currentUserId);
    const mainFighter = battle.participants.find((p) => p.character.user_id === currentUserId);

    function renderFighter(p, colorIndex, isMain, positionStyle, spriteMaxHeight, side) {
        const live = current.participants[p.character_id] || {
            hp: p.current_hp, is_alive: p.is_alive,
        };
        const subclass = p.character.subclass;
        const maxHp = p.character.effective_base_hp ?? live.hp;
        const pColor = PARTICIPANT_COLORS[colorIndex % PARTICIPANT_COLORS.length];

        const isAnimating = activeAnimation?.characterId === p.character_id;
        const idleImage = subclass?.battle_idle_path || subclass?.full_body_path;
        const isStunnedThisStep = live.is_alive && current.text?.includes(p.character.name) && current.text?.includes('kena stun');

        return (
            <div
                key={p.id}
                style={{
                    position: 'absolute', ...positionStyle,
                    textAlign: 'center', opacity: live.is_alive ? 1 : 0.4,
                }}
            >
                {isStunnedThisStep && (
                    <div
                        style={{
                            position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '1.2rem', zIndex: 6, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                        }}
                    >
                        ⚡
                    </div>
                )}
                {isMain && (
                    <span
                        className="rpg-element-badge d-inline-block mb-1"
                        style={{ '--accent': '#c9a24b', color: '#c9a24b', fontSize: '0.55rem', background: 'rgba(11,12,18,0.75)' }}
                    >
                        KAMU
                    </span>
                )}
                {battle.frontman_character_id === p.character_id && (
                    <span
                        className="rpg-element-badge d-inline-block mb-1 ms-1"
                        style={{ '--accent': '#3f8c94', color: '#3f8c94', fontSize: '0.55rem', background: 'rgba(11,12,18,0.75)' }}
                    >
                        🛡
                    </span>
                )}
                <div
                    style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: live.is_alive ? pColor : '#5b6178',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginBottom: 2, whiteSpace: 'nowrap',
                    }}
                >
                    {p.character.name}{p.npc_encounter_level ? ` Lv.${p.npc_encounter_level}` : ''} {!live.is_alive && '☠'}
                </div>
                <div style={{ position: 'relative' }}>
                    <FloatingNumber effect={current.effect?.target === p.character_id ? current.effect : null} animKey={step} side={side} />
                    {/* GIF gantiin pose idle pas skill dipakai (bukan numpuk) - ukuran &
                        posisi udah di-sync sama kanvas 364x360 yang sama. Ulti dikasih
                        glow emas berdenyut, beda dari skill biasa (bukan cuma warna). */}
                    <div
                        style={isAnimating && activeAnimation.isUltimate ? {
                            filter: 'drop-shadow(0 0 14px rgba(201,162,75,0.9)) drop-shadow(0 0 4px rgba(255,255,255,0.6))',
                            animation: 'rpg-ulti-pulse 0.5s ease-in-out infinite alternate',
                        } : undefined}
                    >
                        {isAnimating ? (
                            <img
                                src={activeAnimation.path}
                                alt="skill"
                                style={{ width: '100%', maxHeight: spriteMaxHeight, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                            />
                        ) : idleImage ? (
                            <img
                                src={idleImage}
                                alt={p.character.name}
                                style={{ width: '100%', maxHeight: spriteMaxHeight, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))' }}
                            />
                        ) : (
                            <div className="rpg-badge-hex mx-auto" style={{ '--accent': pColor, width: 40, height: 40, fontSize: '0.9rem' }}>
                                {p.character.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                {/* HP bar di BAWAH sprite. */}
                <div style={{ width: '85%', margin: '3px auto 0' }}>
                    <Bar current={live.hp} max={maxHp} color="#b8433a" />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
            <Head title={`Battle vs ${monster.name}`} />

            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    IndoRPG
                </span>
            </div>

            <div className="container py-4" style={{ maxWidth: 700 }}>
                {/* Arena: background scene sesuai tema map, monster gede di belakang,
                    party di depan dikroyok - cuma 1 bar (HP) per karakter/monster. */}
                <div
                    style={{
                        position: 'relative', width: '100%', aspectRatio: '1024 / 571',
                        backgroundImage: `url('${battleBackground}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                        borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: '1rem',
                    }}
                >
                    {/* Monster - besar, tengah/atas */}
                    <div style={{ position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)', width: '40%', textAlign: 'center' }}>
                        {current.monster_hp > 0 && current.text?.includes(monster.name) && current.text?.includes('kena stun') && (
                            <div
                                style={{
                                    position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)',
                                    fontSize: '1.6rem', zIndex: 6, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                                }}
                            >
                                ⚡
                            </div>
                        )}
                        <div
                            style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: MONSTER_COLOR,
                                textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginBottom: 2,
                            }}
                        >
                            {monster.name} · Lv.{monsterLevel}
                        </div>
                        {monster.full_body_path ? (
                            <img
                                src={monster.full_body_path}
                                alt={monster.name}
                                style={{ width: '100%', maxHeight: 175, objectFit: 'contain', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}
                            />
                        ) : (
                            <div className="rpg-badge-hex mx-auto" style={{ '--accent': MONSTER_COLOR, width: 84, height: 84, fontSize: '1.8rem' }}>
                                {monster.name.charAt(0)}
                            </div>
                        )}
                        <div style={{ width: '65%', margin: '3px auto 0' }}>
                            <Bar current={current.monster_hp} max={monsterMaxHp} color={MONSTER_COLOR} />
                        </div>
                        {/* Efek (damage/heal/miss) + nama serangan monster - DI BAWAH,
                            bukan nempel di sprite (biar gak nutupin monsternya). */}
                        <div style={{ minHeight: 32, marginTop: 4 }}>
                            {current.effect?.target === 'monster' && (
                                <div
                                    key={step}
                                    style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 800,
                                        fontSize: current.effect.is_critical ? '1.3rem' : '1rem',
                                        color: current.effect.type === 'heal' ? '#4ad980' : current.effect.type === 'miss' ? '#c9c9c9' : '#ff5252',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                                    }}
                                >
                                    {current.effect.type === 'miss' ? 'MELESET' : current.effect.type === 'heal' ? `+${current.effect.value}` : `-${current.effect.value}`}
                                    {current.effect.is_critical && '!'}
                                </div>
                            )}
                            {current.is_monster_actor && current.effect?.skill_name && (
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {current.effect.skill_name}
                                </div>
                            )}
                        </div>
                        {/* Mini-log - mirip battle log tapi cuma 1 baris terakhir, "ngambang"
                            di sisa ruang kosong (bukan box gede kayak sebelumnya). */}
                        {current.text && (
                            <div
                                key={`log-${step}`}
                                style={{
                                    fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                    marginTop: 4, padding: '2px 8px', background: 'rgba(11,12,18,0.55)', borderRadius: 6,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.9)', lineHeight: 1.3,
                                }}
                            >
                                {current.text}
                            </div>
                        )}
                    </div>

                    {/* Player - kiri, sendiri, agak besar. Efek muncul di sisi KANAN
                        (ngarah ke monster). */}
                    {mainFighter && renderFighter(
                        mainFighter, battle.participants.indexOf(mainFighter), true,
                        { bottom: '4%', left: '14%', transform: 'translateX(-50%)', width: '26%' },
                        120, 'right',
                    )}

                    {/* NPC - kanan, ditumpuk (sampai 2), lebih kecil. Efek muncul di
                        sisi KIRI (ngarah ke monster). */}
                    {npcParticipants.map((p, i) => {
                        const top = npcParticipants.length === 1 ? '58%' : (i === 0 ? '40%' : '72%');
                        return renderFighter(
                            p, battle.participants.indexOf(p), false,
                            { top, left: '86%', transform: 'translate(-50%, -50%)', width: '18%' },
                            80, 'left',
                        );
                    })}
                </div>

                {/* Mode Manual: panel HP/MP/SP + tombol skill (bukan log teks lagi -
                    semua feedback lewat animasi damage number floating di atas). */}
                {isManual && (() => {
                    const myParticipant = battle.participants.find((p) => p.character.user_id === currentUserId);
                    if (!myParticipant) return null;
                    const live = current.participants[myParticipant.character_id] || {
                        hp: myParticipant.current_hp, stamina: myParticipant.current_stamina, mana: myParticipant.current_mana,
                    };
                    const maxHp = myParticipant.character.effective_base_hp;
                    const maxSp = myParticipant.character.effective_base_sp;
                    const maxMp = myParticipant.character.effective_base_mp;
                    const rows = [
                        ['HP', live.hp, maxHp, '#b8433a'],
                        ['SP', live.stamina, maxSp, '#c98a3a'],
                        ['MP', live.mana, maxMp, '#7269d1'],
                    ];

                    return (
                        <div className="rpg-card mb-3" style={{ '--accent': '#3f8c94', padding: '1rem' }}>
                            <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem' }}>Status Kamu</div>
                            <div className="d-flex flex-column gap-1">
                                {rows.map(([label, cur, max, color]) => (
                                    <div className="d-flex align-items-center gap-2" key={label}>
                                        <span style={{ width: 26, fontSize: '0.65rem', color, fontFamily: 'var(--font-mono)' }}>{label}</span>
                                        <div className="flex-grow-1"><Bar current={cur} max={max} color={color} /></div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', width: 64, textAlign: 'right' }}>
                                            {cur}/{max}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <ManualSkillBar
                                participant={myParticipant}
                                battle={battle}
                                onUseSkill={sendManualAction}
                                disabled={acting || battle.status !== 'ongoing'}
                                keyBindings={keyBindings}
                            />
                        </div>
                    );
                })()}

                {/* Toolbar - Suara selalu ada, Lewati cuma relevan buat mode Auto (mode
                    Manual gak ada "playback" yang bisa di-skip). */}
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <button
                        onClick={() => setSoundOn((s) => !s)}
                        className="btn btn-sm"
                        style={{
                            background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)', borderRadius: 6, fontSize: '0.8rem', padding: '0.4rem 0.9rem',
                        }}
                    >
                        {soundOn ? '🔊 Suara' : '🔇 Suara'}
                    </button>
                    {!isManual && !finished && (
                        <button
                            onClick={skipToEnd}
                            className="btn btn-sm"
                            style={{
                                background: 'var(--bg-panel)', border: `1px solid ${MONSTER_COLOR}`,
                                color: MONSTER_COLOR, borderRadius: 6, fontSize: '0.8rem', padding: '0.4rem 1rem', fontWeight: 600,
                            }}
                        >
                            Lewati ▶▶
                        </button>
                    )}
                    {isManual && battle.status === 'ongoing' && (
                        <button
                            onClick={() => router.post(route('battles.flee', battle.token))}
                            className="btn btn-sm"
                            style={{
                                background: 'var(--bg-panel)', border: `1px solid ${MONSTER_COLOR}`,
                                color: MONSTER_COLOR, borderRadius: 6, fontSize: '0.8rem', padding: '0.4rem 1rem', fontWeight: 600,
                            }}
                        >
                            🏳️ Menyerah
                        </button>
                    )}
                </div>
            </div>

            {/* Animasi damage number & glow ultimate - inline style tag biar gak perlu file CSS terpisah. */}
            <style>{`
                @keyframes rpg-float-up {
                    0% { transform: translate(-50%, 0); opacity: 1; }
                    100% { transform: translate(-50%, -46px); opacity: 0; }
                }
                .rpg-floating-number { animation: rpg-float-up 1.1s ease-out forwards; }
                @keyframes rpg-ulti-pulse {
                    0% { filter: drop-shadow(0 0 8px rgba(201,162,75,0.7)) drop-shadow(0 0 2px rgba(255,255,255,0.5)); }
                    100% { filter: drop-shadow(0 0 20px rgba(201,162,75,1)) drop-shadow(0 0 8px rgba(255,255,255,0.8)); }
                }
            `}</style>
        </div>
    );
}
