import { Link, Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { battleAudio, unlockAudio } from '../../battleAudio';

const MONSTER_COLOR = '#b8433a';
// Dipakai buat nampilin drop item/material di layar kemenangan (bagian 98) -
// sama persis warnanya kayak yang dipakai Shop/MyItems.jsx dkk.
const RARITY_ACCENT_MAP = {
    common: '#8f96a3',
    rare: '#8b5cf6',
    sr: '#4a90e2',
    ur: '#e8c547',
    legendary: '#ef7d6f',
};
const PARTICIPANT_COLORS = ['#3f8c94', '#c9a24b', '#7269d1'];
// Interval polling internal mode Manual (cek/proses giliran NPC & monster
// otomatis) - angka TETAP (bukan setting admin lagi), SAMA SEKALI gak ada
// hubungannya sama cooldown skill (itu murni cooldown_seconds masing-masing
// skill, dihitung dari waktu asli - lihat ManualSkillBar). Dipakai juga buat
// estimasi rate regen HP/SP/MP per detik (regen server jalan tiap kali
// giliran diproses, kira-kira serapat interval ini).
const POLL_INTERVAL_MS = 2500;

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
function ManualSkillBar({ participant, battle, serverElapsedSeconds, serverElapsedSyncedAt, onUseSkill, disabled, keyBindings }) {
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

    // BUG FIX PENTING: sebelumnya cek "cukup MP/SP" pakai participant.current_
    // mana/stamina MENTAH (nilai dari respons server TERAKHIR, gak berubah
    // sampai ada sync baru) - padahal panel "Status Kamu" di sebelahnya
    // nampilin MP/SP yang UDAH DI-INTERPOLASI real-time (PlayerStatusPanel,
    // bagian 61). Efeknya: player liat MP-nya udah keliatan penuh/cukup di
    // bar, tapi tombol skill TETAP grey karena cek-nya masih pakai angka lama
    // yang belum ke-refresh dari server. Fix: interpolasi yang SAMA PERSIS
    // diterapkan di sini juga, biar tampilan bar & tombol konsisten.
    const syncRef = useRef({ time: Date.now(), mana: participant?.current_mana ?? 0, stamina: participant?.current_stamina ?? 0 });
    useEffect(() => {
        syncRef.current = { time: Date.now(), mana: participant?.current_mana ?? 0, stamina: participant?.current_stamina ?? 0 };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participant?.current_mana, participant?.current_stamina]);

    if (!participant) return null;

    const maxMana = participant.character.effective_base_mp;
    const maxStamina = participant.character.effective_base_sp;
    const manaPerSec = (participant.character.effective_mana_regen ?? 0) / (POLL_INTERVAL_MS / 1000);
    const staminaPerSec = (participant.character.effective_stamina_regen ?? 0) / (POLL_INTERVAL_MS / 1000);
    const elapsedSinceSync = (Date.now() - syncRef.current.time) / 1000;
    const displayedMana = Math.min(maxMana, syncRef.current.mana + manaPerSec * elapsedSinceSync);
    const displayedStamina = Math.min(maxStamina, syncRef.current.stamina + staminaPerSec * elapsedSinceSync);

    const loadout = (participant.character.subclass?.skills ?? [])
        .filter((s) => (participant.loadout_skill_ids ?? []).includes(s.id));
    const tier1 = loadout.filter((s) => s.tier === 1);
    const ulti = loadout.filter((s) => s.tier === 3);
    const slots = [...tier1, ...ulti];
    const keyLabels = [keyBindings.skill1, keyBindings.skill2, keyBindings.skill3, keyBindings.skill4, keyBindings.ulti];
    const cooldowns = participant.skill_cooldowns ?? {};
    // BUG FIX PENTING: sebelumnya `new Date(battle.created_at).getTime()` -
    // parsing tanggal ISO string di client RAWAN salah kalau ada ambiguitas
    // timezone (server vs koneksi database vs browser), bisa bikin selisih
    // waktu meleset JAM (bukan detik) - persis gejala "cooldown abis instan
    // padahal belum 30 detik". Fix total: server ngirim angka detik MENTAH
    // (serverElapsedSeconds, dihitung server pakai now()->diffInSeconds()),
    // client CUMA nambahin delta Date.now() - SAMA-SAMA clock client sendiri,
    // gak ada parsing tanggal/timezone yang bisa salah sama sekali.
    const nowSeconds = serverElapsedSeconds + (Date.now() - serverElapsedSyncedAt) / 1000;

    return (
        <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
            {slots.map((skill, i) => {
                // BUG FIX: paksa semua nilai jadi Number eksplisit - kalau ada
                // field yang somehow kebaca sebagai string (misal dari JSON
                // encoding PHP yang gak konsisten), perbandingan >= / - bisa
                // salah diam-diam (JS coercion gak selalu sesuai harapan) dan
                // bikin skill KELIATAN usable padahal cooldown/gak affordable.
                const lastUsed = cooldowns[skill.id] !== undefined ? Number(cooldowns[skill.id]) : undefined;
                const cooldownSeconds = Number(skill.cooldown_seconds);
                const remainingSeconds = lastUsed !== undefined ? Math.ceil(cooldownSeconds - (nowSeconds - lastUsed)) : 0;
                const onCooldown = remainingSeconds > 0;
                const affordable = displayedMana >= Number(skill.mana_cost)
                    && displayedStamina >= Number(skill.stamina_cost);
                const usable = !onCooldown && affordable && !disabled;

                return (
                    <button
                        key={skill.id}
                        onClick={() => { if (usable) { unlockAudio(); onUseSkill(skill.id); } }}
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
const FLOAT_DURATION_MS = 1800; // diperpanjang dari 1100ms - lebih kerasa/kebaca

// Ikon jenis skill: pedang (physical), sparkle (magic), atau ledakan (ultimate,
// nge-override yang lain). Ditentuin dari physical_ratio (0-100) yang dikirim
// backend, biar player langsung tau ini damage fisik atau sihir dari sekilas lihat.
function skillTypeIcon(effect) {
    if (effect.is_ultimate) return '💥';
    if (effect.physical_ratio === undefined || effect.physical_ratio === null) return null;
    return effect.physical_ratio >= 50 ? '⚔️' : '🔮';
}

// Satu angka damage/heal/miss individual (dipanggil dari FloatingNumberStack,
// bukan langsung) - stackIndex geser posisi vertikal dikit biar beberapa hit
// beruntun keliatan NUMPUK (bukan saling nimpa persis di titik yang sama).
function FloatingNumberItem({ effect, side, stackIndex }) {
    const isHeal = effect.type === 'heal';
    const isMiss = effect.type === 'miss';
    const color = isHeal ? '#4ad980' : isMiss ? '#c9c9c9' : '#ff5252';
    const text = isMiss ? 'MELESET' : isHeal ? `+${effect.value}` : `-${effect.value}`;
    const icon = !isMiss && !isHeal ? skillTypeIcon(effect) : null;

    const basePos = side === 'right'
        ? { top: '25%', left: '100%', marginLeft: 4 }
        : side === 'left'
            ? { top: '25%', right: '100%', marginRight: 4 }
            : { top: '-6%', left: '50%', transform: 'translateX(-50%)' };

    // Geser tiap item numpuk ke atas dikit-dikit (30px per stack index) - biar
    // hit ke-2/ke-3 yang muncul nyaris bersamaan keliatan JELAS sebagai
    // beberapa angka terpisah, bukan numpuk persis di 1 titik.
    const stackOffset = stackIndex * 26;
    const posStyle = side === 'center'
        ? { ...basePos, transform: `translateX(-50%) translateY(-${stackOffset}px)` }
        : { ...basePos, transform: `translateY(-${stackOffset}px)` };

    return (
        <div
            className="rpg-floating-number"
            style={{
                position: 'absolute', ...posStyle,
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: isMiss ? '0.85rem' : effect.is_critical ? '1.5rem' : '1.1rem',
                color, textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)',
                zIndex: 9 + stackIndex, pointerEvents: 'none', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 3,
            }}
        >
            {icon && <span style={{ fontSize: '0.85em' }}>{icon}</span>}
            {effect.is_critical && !isMiss && <span style={{ fontSize: '0.8em' }}>💫</span>}
            {text}{effect.is_critical && !isMiss && '!'}
        </div>
    );
}

// Nampung SEMUA damage/heal/miss yang lagi "aktif" (belum selesai animasi fade-
// out-nya) - biar kalau ada beberapa hit beruntun cepet (misal 2 skill combo,
// atau player+NPC nyerang monster yang sama nyaris bersamaan), angkanya NUMPUK
// kelihatan semua (bukan yang belakangan langsung nimpa/ganti yang duluan).
function FloatingNumberStack({ effect, animKey, side = 'center' }) {
    const [items, setItems] = useState([]);
    const lastKeyRef = useRef(null);

    useEffect(() => {
        if (!effect || !['damage', 'miss', 'heal'].includes(effect.type)) return;
        if (animKey === lastKeyRef.current) return; // efek yang sama, jangan dobel
        lastKeyRef.current = animKey;

        const id = `${animKey}-${Math.random()}`;
        setItems((prev) => [...prev, { id, effect }]);
        const timer = setTimeout(() => {
            setItems((prev) => prev.filter((it) => it.id !== id));
        }, FLOAT_DURATION_MS);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animKey, effect]);

    return items.map((item, i) => (
        <FloatingNumberItem key={item.id} effect={item.effect} side={side} stackIndex={i} />
    ));
}

// Panel HP/SP/MP mode Manual - regen-nya di-interpolasi REAL-TIME (nambah
// dikit-dikit tiap detik di client, bukan cuma "loncat" pas ada respons
// server baru) berdasarkan rate regen karakter (misal +10/detik), tapi tetap
// di-sinkronin ulang ke nilai AUTORITATIF dari server tiap kali battle state
// berubah (gak numpuk drift).
function PlayerStatusPanel({ participant, live }) {
    const [, forceTick] = useState(0);
    const syncRef = useRef({ time: Date.now(), hp: live.hp, sp: live.stamina, mp: live.mana });

    // Setiap kali nilai AUTORITATIF dari server berubah, reset titik sinkronnya
    // (biar interpolasi mulai dari angka yang bener, bukan numpuk error).
    useEffect(() => {
        syncRef.current = { time: Date.now(), hp: live.hp, sp: live.stamina, mp: live.mana };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live.hp, live.stamina, live.mana]);

    useEffect(() => {
        const interval = setInterval(() => forceTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const character = participant.character;
    const maxHp = character.effective_base_hp;
    const maxSp = character.effective_base_sp;
    const maxMp = character.effective_base_mp;

    // Rate regen per DETIK - estimasi dari jumlah regen per giliran dibagi
    // POLL_INTERVAL_MS (konstanta tetap, BUKAN setting admin lagi).
    const hpPerSec = (character.effective_hp_regen ?? 0) / (POLL_INTERVAL_MS / 1000);
    const spPerSec = (character.effective_stamina_regen ?? 0) / (POLL_INTERVAL_MS / 1000);
    const mpPerSec = (character.effective_mana_regen ?? 0) / (POLL_INTERVAL_MS / 1000);

    const elapsed = (Date.now() - syncRef.current.time) / 1000;
    // BUG FIX: interpolasi regen sebelumnya JALAN TERUS gak peduli status
    // hidup/mati - begitu karakter tumbang (HP 0, is_alive false), tampilan
    // client tetap "nambahin" HP pakai hpPerSec kayak biasa (padahal server
    // gak regen karakter yang udah tumbang sama sekali) - keliatan kayak HP
    // "generate" lagi walau mati. Fix: kalau is_alive === false, JANGAN
    // interpolasi, tampilin apa adanya (harusnya 0).
    const isAlive = live.is_alive !== false;
    const displayHp = isAlive ? Math.min(maxHp, syncRef.current.hp + hpPerSec * elapsed) : live.hp;
    const displaySp = isAlive ? Math.min(maxSp, syncRef.current.sp + spPerSec * elapsed) : live.stamina;
    const displayMp = isAlive ? Math.min(maxMp, syncRef.current.mp + mpPerSec * elapsed) : live.mana;

    const rows = [
        ['HP', Math.round(displayHp), maxHp, '#b8433a'],
        ['SP', Math.round(displaySp), maxSp, '#c98a3a'],
        ['MP', Math.round(displayMp), maxMp, '#7269d1'],
    ];

    return (
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
    );
}

export default function Show({ battle: initialBattle, battleBackground, keyBindings = {}, audioSettings = {}, serverElapsedSeconds: initialServerElapsedSeconds = 0 }) {
    const { props } = usePage();
    const currentUserId = props.auth?.user?.id;
    const isManual = initialBattle.mode === 'manual';

    // Mode manual: battle state di-mutate LOKAL (bukan di-replay dari log
    // pre-resolved kayak auto) - tiap aksi manual update state ini via fetch().
    const [liveBattle, setLiveBattle] = useState(initialBattle);
    // Angka detik LANGSUNG dari server (bukan tanggal buat di-parse ulang) -
    // BUG FIX PENTING: sebelumnya cooldown dihitung dari
    // `new Date(battle.created_at)` di client, yang RAWAN salah kalau format
    // tanggal dari server ambigu soal timezone - bisa bikin selisih waktu
    // meleset JAM (bukan detik), keliatan kayak "cooldown abis instan" atau
    // "gak jalan sama sekali". Sekarang server ngirim angka detik MENTAH,
    // client cuma nambahin delta Date.now() (SAMA-SAMA clock client, gak ada
    // celah parsing/timezone).
    //
    // Disatuin jadi 1 object (bukan 2 state terpisah) - dan update-nya di-
    // GUARD biar MONOTONIC (gak pernah mundur). BUG FIX PENTING: auto-poll
    // (jalan tiap beberapa detik OTOMATIS) dan klik player bisa nembak
    // request nyaris bersamaan - kalau response yang LEBIH LAMBAT (misal
    // auto-poll yang keburu dikirim duluan tapi baru nyampe belakangan)
    // ke-apply SETELAH response yang lebih baru, angka waktunya jadi
    // MUNDUR - keliatan kayak "waktu nambah sendiri" (soalnya sisa cooldown
    // = cooldown_seconds - (now - lastUsed), kalau `now` mundur, sisa
    // cooldown malah NAIK). Fix: tolak update kalau angka barunya lebih
    // KECIL dari yang lagi ditampilin sekarang (data basi, diabaikan).
    const [elapsedSync, setElapsedSyncRaw] = useState({ serverSeconds: initialServerElapsedSeconds, clientTime: Date.now() });
    const elapsedSyncRef = useRef(elapsedSync);
    function updateElapsedSync(newServerSeconds) {
        const prev = elapsedSyncRef.current;
        // BUG FIX: sebelumnya dibandingin ke `currentDisplayed` (hasil
        // EKSTRAPOLASI, yang otomatis lebih besar karena udah nambahin delay
        // jaringan) - efeknya update yang VALID pun sering ke-tolak (dianggap
        // "mundur" padahal enggak), bikin elapsedSync "beku" di sync pertama
        // dan makin lama makin ngaco (ekstrapolasi doang, gak pernah dikoreksi
        // ulang ke kenyataan server). Fix: bandingin ke nilai RAW server
        // SEBELUMNYA (apple-to-apple, sama-sama snapshot server) - update
        // valid HAMPIR SELALU >= nilai server sebelumnya (server time cuma
        // maju), cuma nolak yang BENERAN out-of-order/basi.
        if (newServerSeconds < prev.serverSeconds) {
            return; // data basi (response out-of-order) - diabaikan, jangan mundur
        }
        const next = { serverSeconds: newServerSeconds, clientTime: Date.now() };
        elapsedSyncRef.current = next;
        setElapsedSyncRaw(next);
    }
    const [liveLog, setLiveLog] = useState(initialBattle.battle_log || []);
    const [acting, setActing] = useState(false);
    // BUG FIX PENTING: state React (`acting`) BISA lag 1 render di belakang
    // closure lama (misal auto-poll interval yang closure-nya "beku" dari
    // render sebelumnya) - jadi kadang 2 request (auto-poll + klik player)
    // nyaris bersamaan bisa DUA-DUANYA lolos guard "if (acting) return"
    // (karena keduanya masih baca acting=false versi lama). Efeknya: 2 giliran
    // ke-proses BARENGAN di server, response yang DATANG BELAKANGAN nimpa
    // state duluan - keliatan kayak "cooldown/skill reset" random padahal
    // sebenernya race condition. Fix: pakai ref (selalu sinkron, gak nunggu
    // render) buat guard-nya, state `acting` tetap ada cuma buat keperluan UI
    // (disable tombol pas lagi proses).
    const actingRef = useRef(false);
    // BUG FIX PENTING: auto-poll (jadwal TETAP tiap POLL_INTERVAL_MS, gak peduli
    // player lagi ngapain) bisa "balapan" sama klik manual player - kalau player
    // butuh mikir agak lama (lebih dari POLL_INTERVAL_MS), auto-poll keburu
    // nembak duluan (skillId=null, cuma NPC/monster yang gerak), "makan" giliran
    // player. Efeknya: skill pertama jalan (klik cepat abis battle mulai), tapi
    // abis itu klik-klik berikutnya sering "kalah cepat" sama auto-poll, kelihatan
    // kayak "skill gak jalan, cuma NPC/monster yang jalan terus". Fix: track kapan
    // AKSI TERAKHIR (manual ATAU auto) selesai - auto-poll cuma nembak kalau udah
    // BENERAN lewat POLL_INTERVAL_MS dari aksi terakhir, bukan jadwal independen.
    const lastActionTimeRef = useRef(Date.now());
    const battle = isManual ? liveBattle : initialBattle;
    const monster = battle.monster;
    const log = isManual ? liveLog : (battle.battle_log || []);

    // Level & stat monster yang beneran dipakai battle ini (udah di-scale
    // sesuai level encounter) - fallback ke stat statis monster kalau battle
    // lama (dibuat sebelum fitur level dinamis ada, monster_level-nya null).
    const monsterLevel = battle.monster_level ?? monster.level;
    const monsterMaxHp = battle.monster_stats?.hp ?? monster.hp;
    const monsterExpReward = battle.monster_stats?.exp_reward ?? monster.exp_reward;

    // Drop item/material yang didapet karakter YANG DIKONTROL PLAYER INI
    // sepanjang battle - dipakai buat nampilin ringkasan "Hadiah" di layar
    // menang (sebelumnya cuma EXP doang, item/material yang beneran didapet
    // gak pernah ditampilin di layar hasil, cuma lewat di battle log).
    const myCharacterId = battle.participants.find((p) => p.character.user_id === currentUserId)?.character_id;
    const myDrops = log.filter((entry) => entry.effect?.type === 'drop' && entry.actor_character_id === myCharacterId).map((entry) => entry.effect);
    const rewardSummary = log.find((entry) => entry.effect?.type === 'reward_summary')?.effect;

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
            // Prioritas: audio custom PER-SKILL (bagian 102, effect.skill_audio_path
            // dari skill player ATAU skill_config monster) DULUAN kalau ada, baru
            // fallback ke setting global (audioSettings.audio_*), yang juga kosong
            // fallback ke suara sintesis (di dalam battleAudio.js sendiri).
            const perSkillAudio = effect.skill_audio_path || null;
            let resolvedUrl = null;
            let soundKind = null;
            if (effect.is_critical) {
                resolvedUrl = perSkillAudio || audioSettings.audio_critical;
                soundKind = 'critical';
                battleAudio.critical(resolvedUrl);
            } else if (entry.is_monster_actor) {
                // Monster yang nyerang party -> "kena serangan" (beda dari nyerang monster).
                resolvedUrl = perSkillAudio || audioSettings.audio_hit_taken;
                soundKind = 'hitTaken';
                battleAudio.hitTaken(resolvedUrl);
            } else if (effect.is_ultimate) {
                resolvedUrl = perSkillAudio || audioSettings.audio_ultimate;
                soundKind = 'ultimate';
                battleAudio.ultimate(resolvedUrl);
            } else if (entry.skill_id) {
                resolvedUrl = perSkillAudio || audioSettings.audio_skill;
                soundKind = 'skill';
                battleAudio.skill(resolvedUrl);
            } else {
                resolvedUrl = perSkillAudio || audioSettings.audio_skill;
                soundKind = 'hit';
                battleAudio.hit(resolvedUrl);
            }
            // DIAGNOSTIK SEMENTARA: user laporan masih denger suara sintesis
            // padahal udah upload custom - log ini nunjukkin PERSIS url apa
            // yang kepilih (atau null/undefined kalau emang gak ada data sama
            // sekali) buat event suara ini, biar ketauan putusnya di data
            // (audioSettings/skill_audio_path kosong) atau di playback (file
            // ada tapi gagal diputar browser).
            console.log(`[battleAudio DEBUG] kind=${soundKind} perSkillAudio=${perSkillAudio} audioSettings=${JSON.stringify(audioSettings)} resolvedUrl=${resolvedUrl}`);
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
        if (actingRef.current || battle.status !== 'ongoing') return;
        actingRef.current = true;
        setActing(true);
        lastActionTimeRef.current = Date.now();
        // BUG FIX PENTING: sebelumnya fetch() TANPA batas waktu sama sekali -
        // kalau koneksi lambat/macet, request bisa NYANGKUT nunggu tanpa henti
        // (browser punya timeout bawaan sendiri, tapi bisa SANGAT lama, kadang
        // menitan). Selama nyangkut, actingRef.current tetap true, jadi SEMUA
        // klik berikutnya DIABAIKAN diam-diam - persis gejala "diklik gak
        // jalan-jalan, tau-tau jalan sendiri setelah beberapa waktu" (begitu
        // request lama itu akhirnya timeout/gagal, baru guard-nya kebuka lagi).
        // Fix: batasi 8 detik pakai AbortController - gagal cepat, guard
        // kebuka lagi cepat, user bisa coba lagi gak perlu nunggu lama.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch(route('battles.act', battle.token), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ skill_id: skillId }),
                signal: controller.signal,
            });
            // BUG FIX PENTING: sebelumnya error dari server (500, 422, dll) DIEMIN
            // TOTAL - gak ada tanda apapun ke user/developer, keliatan kayak
            // "klik gak ada reaksi" padahal aslinya request GAGAL di server.
            // Sekarang di-log ke console (gampang diliat lewat DevTools) biar
            // ketauan kalau ada masalah beneran, bukan cuma diem-dieman.
            if (!res.ok) {
                const errText = await res.text().catch(() => '(gagal baca response)');
                console.error('[Battle] /act gagal:', res.status, errText);
                return;
            }
            const json = await res.json();
            if (json.error) {
                console.error('[Battle] /act error:', json.error);
                return;
            }
            if (json.battle) {
                setLiveBattle(json.battle);
                setLiveLog((prev) => [...prev, ...(json.log || [])]);
                if (typeof json.serverElapsedSeconds === 'number') {
                    updateElapsedSync(json.serverElapsedSeconds);
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error('[Battle] /act TIMEOUT (8 detik, kemungkinan koneksi lambat/macet) - guard dibuka lagi, coba klik ulang.');
            } else {
                console.error('[Battle] /act exception:', err);
            }
        } finally {
            clearTimeout(timeoutId);
            actingRef.current = false;
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
    // otomatis, kirim "aksi kosong" (skillId=null, artinya "player skip giliran
    // ini") - server tetap proses NPC & monster meski player belum milih apa-apa.
    //
    // BUG FIX PENTING: sebelumnya `setInterval` nembak di JADWAL TETAP (tiap
    // POLL_INTERVAL_MS) - gak peduli player BARU AJA klik atau belum. Kalau
    // player mikir agak lama, jadwal ini "balapan" sama niat klik player, keburu
    // makan giliran (skill=null) sebelum player sempet klik - kelihatan kayak
    // "klik gak jalan, cuma NPC/monster yang gerak". Fix: cek TIAP 0.5 detik,
    // tapi CUMA kirim kalau BENERAN udah lewat POLL_INTERVAL_MS dari aksi
    // terakhir (manual ATAU auto) - klik player SELALU dapet jatah penuh
    // POLL_INTERVAL_MS buat "napas" tanpa disela auto-poll.
    useEffect(() => {
        if (!isManual || battle.status !== 'ongoing') return;
        const checkInterval = setInterval(() => {
            const elapsedSinceLastAction = Date.now() - lastActionTimeRef.current;
            if (!actingRef.current && elapsedSinceLastAction >= POLL_INTERVAL_MS) {
                sendManualAction(null);
            }
        }, 500);
        return () => clearInterval(checkInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManual, battle.status]);

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
                                {rewardSummary?.gold > 0 && (
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#c9a24b' }}>
                                        +{rewardSummary.gold} Gold <span className="rpg-power-type" style={{ fontSize: '0.8rem' }}>/ karakter</span>
                                    </div>
                                )}
                                {/* Drop item/material - BARU ditampilin di sini (sebelumnya cuma
                                    kelewat di battle log, gak pernah nongol di ringkasan hasil). */}
                                {myDrops.length > 0 && (
                                    <div className="d-flex justify-content-center flex-wrap gap-2 mt-3">
                                        {myDrops.map((drop, i) => {
                                            const accent = RARITY_ACCENT_MAP[drop.rarity] ?? '#8890a4';
                                            return (
                                                <div
                                                    key={i}
                                                    title={drop.item_name}
                                                    className="d-flex align-items-center gap-2"
                                                    style={{ background: 'var(--bg-panel)', border: `1px solid ${accent}`, borderRadius: 8, padding: '4px 8px 4px 4px' }}
                                                >
                                                    <img src={drop.icon_path ?? '/images/items/placeholder.png'} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                                                    <span style={{ fontSize: '0.72rem', color: accent }}>{drop.item_name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                    <FloatingNumberStack effect={current.effect?.target === p.character_id ? current.effect : null} animKey={step} side={side} />
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
                    {/* Monster - besar, tengah/atas. Balik ke ukuran besar (mini-log
                        udah dipindah jadi baris sendiri di bawah, gak perlu berbagi
                        ruang vertikal lagi di kolom ini). */}
                    <div style={{ position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)', width: '42%', textAlign: 'center' }}>
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
                                style={{ width: '100%', maxHeight: 185, objectFit: 'contain', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}
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
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    }}
                                >
                                    {current.effect.type !== 'miss' && current.effect.type !== 'heal' && (
                                        <span style={{ fontSize: '0.85em' }}>{skillTypeIcon(current.effect)}</span>
                                    )}
                                    {current.effect.is_critical && <span style={{ fontSize: '0.8em' }}>💫</span>}
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

                {/* Mini-log - 1 baris terakhir, sekarang BARIS SENDIRI full-width di
                    bawah arena (dulu nyempil di kolom monster, sekarang lega - gak
                    perlu dipotong ellipsis lagi karena ruangnya udah lebar). */}
                {current.text && (
                    <div
                        key={`log-${step}`}
                        className="text-center mb-2"
                        style={{
                            fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                            padding: '0.5rem 1rem', background: 'var(--bg-panel)', borderRadius: 8,
                            border: '1px solid var(--border-subtle)', lineHeight: 1.4,
                        }}
                    >
                        {current.text}
                    </div>
                )}

                {/* BUG FIX: 1 giliran (/act) bisa hasilin BEBERAPA baris log
                    sekaligus (aksi player + tiap NPC + monster) - log di atas
                    cuma nampilin BARIS TERAKHIR (log[step]), jadi kalau urutan
                    proses gak kebetulan berakhir di aksi player (misal urutan
                    keacak - bagian 58 - berakhir di NPC/monster), aksi player
                    SENDIRI gak pernah kelihatan sama sekali. Fix: log KEDUA di
                    bawah, KHUSUS nyari mundur baris terakhir yang actor_character_id-
                    nya PERSIS karakter yang kamu kontrol - dijamin selalu kelihatan
                    walau bukan baris paling akhir di batch. */}
                {isManual && (() => {
                    const myParticipant = battle.participants.find((p) => p.character.user_id === currentUserId);
                    if (!myParticipant) return null;
                    let myLastEntry = null;
                    for (let i = step; i >= 0; i--) {
                        if (log[i]?.actor_character_id === myParticipant.character_id) {
                            myLastEntry = log[i];
                            break;
                        }
                    }
                    if (!myLastEntry) return null;
                    return (
                        <div
                            key={`my-log-${step}`}
                            className="text-center mb-3"
                            style={{
                                fontSize: '0.72rem', color: '#c9a24b', fontFamily: 'var(--font-mono)',
                                padding: '0.5rem 1rem', background: 'rgba(201,162,75,0.08)', borderRadius: 8,
                                border: '1px solid rgba(201,162,75,0.3)', lineHeight: 1.4,
                            }}
                        >
                            🗡 {myLastEntry.text}
                        </div>
                    );
                })()}

                {/* Mode Manual: panel HP/MP/SP + tombol skill (bukan log teks lagi -
                    semua feedback lewat animasi damage number floating di atas). */}
                {isManual && (() => {
                    const myParticipant = battle.participants.find((p) => p.character.user_id === currentUserId);
                    if (!myParticipant) return null;
                    const live = current.participants[myParticipant.character_id] || {
                        hp: myParticipant.current_hp, stamina: myParticipant.current_stamina, mana: myParticipant.current_mana,
                    };

                    return (
                        <div className="rpg-card mb-3" style={{ '--accent': '#3f8c94', padding: '1rem' }}>
                            <div className="rpg-skill-group-title mb-1" style={{ fontSize: '0.75rem' }}>Status Kamu</div>
                            <PlayerStatusPanel participant={myParticipant} live={live} />
                            <ManualSkillBar
                                participant={myParticipant}
                                battle={battle}
                                serverElapsedSeconds={elapsedSync.serverSeconds}
                                serverElapsedSyncedAt={elapsedSync.clientTime}
                                onUseSkill={sendManualAction}
                                disabled={acting || battle.status !== 'ongoing' || live.is_alive === false}
                                keyBindings={keyBindings}
                            />
                            {/* Indikator EKSPLISIT pas request lagi diproses - beda dari
                                tombol grey karena cooldown/MP-SP kurang, biar user gak
                                salah kira "klik gak ngefek" padahal beneran lagi nunggu
                                respons server (bisa lama kalau koneksi lambat). */}
                            {acting && (
                                <div className="text-center mt-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    ⏳ Mengirim aksi...
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Toolbar - Suara selalu ada, Lewati cuma relevan buat mode Auto (mode
                    Manual gak ada "playback" yang bisa di-skip). */}
                <div className="d-flex justify-content-center gap-2 mt-3">
                    <button
                        onClick={() => { unlockAudio(); setSoundOn((s) => !s); }}
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
                .rpg-floating-number { animation: rpg-float-up 1.8s ease-out forwards; }
                @keyframes rpg-ulti-pulse {
                    0% { filter: drop-shadow(0 0 8px rgba(201,162,75,0.7)) drop-shadow(0 0 2px rgba(255,255,255,0.5)); }
                    100% { filter: drop-shadow(0 0 20px rgba(201,162,75,1)) drop-shadow(0 0 8px rgba(255,255,255,0.8)); }
                }
            `}</style>
        </div>
    );
}
