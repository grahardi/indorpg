import { Head, Link } from '@inertiajs/react';
import Layout from '../../Layout';

function Section({ title, accent, children }) {
    return (
        <div className="mb-5">
            <div className="rpg-eyebrow" style={{ color: accent }}>{title}</div>
            <div className="rpg-rune-divider">
                <span className="rpg-rune-diamond" style={{ background: accent }} />
            </div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {children}
            </div>
        </div>
    );
}

function Faq({ q, children }) {
    return (
        <div className="rpg-card mb-3" style={{ '--accent': '#8890a4', padding: '1.1rem 1.3rem' }}>
            <div className="rpg-subclass-name mb-2" style={{ fontSize: '1rem' }}>{q}</div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{children}</div>
        </div>
    );
}

export default function Index() {
    return (
        <Layout>
            <Head title="Cara Bermain / FAQ" />
            <div className="container py-5" style={{ maxWidth: 780 }}>
                <h1 className="rpg-hero-title display-5 mb-2">Cara Bermain</h1>
                <p className="rpg-tagline mb-5">Panduan singkat sistem IndoRPG — dari bikin karakter sampai battle.</p>

                <Section title="1. Bikin Karakter" accent="#b8433a">
                    <p>
                        Daftar akun dulu (username + password), lalu buka <strong>Karakter → + Buat Karakter</strong>.
                        Pilih Class (Warrior/Tanker/Mage/Saint) lalu Subclass-nya (misal Berserker, Pyromancer, dst) — tiap
                        subclass punya profil stat beda (ada yang jago fisik, ada yang jago sihir).
                    </p>
                    <p className="mb-0">
                        Karakter otomatis pakai art (avatar & full body) dari subclass-nya, jadi gak perlu upload sendiri.
                    </p>
                </Section>

                <Section title="2. Loadout Skill" accent="#7269d1">
                    <p>
                        Di halaman detail karakter, atur <strong>Loadout Battle</strong>: pilih 4 skill biasa + 1 ultimate
                        dari skill pool subclass kamu. Kalau belum diatur, battle otomatis pakai 4+1 skill acak.
                    </p>
                    <p className="mb-0">
                        Ultimate selalu mulai battle dalam kondisi cooldown — gak bisa langsung dipakai di ronde pertama.
                    </p>
                </Section>

                <Section title="3. Guild Adventure" accent="#c9a24b">
                    <p>Buka menu <strong>Guild</strong>, pilih 2-3 karakter buat jadi party. Aturannya:</p>
                    <p className="mb-0">
                        Minimal 1 karakter di party harus <strong>milik kamu sendiri</strong> (bukan cuma NPC). NPC boleh
                        diajak, tapi sebagian NPC kadang lagi "Sedang Misi" (random, gak bisa dipilih sementara).
                    </p>
                </Section>

                <Section title="4. Misi Cepat vs Jelajahi Peta" accent="#3f8c94">
                    <p>
                        <strong>Misi Cepat</strong> — sistem otomatis carikan monster yang levelnya cocok sama rata-rata
                        level party, langsung battle.
                    </p>
                    <p className="mb-0">
                        <strong>Jelajahi Peta</strong> — kamu pilih sendiri map dan titik spawn mana yang mau didatangi.
                        Tiap titik spawn punya cooldown setelah monsternya dikalahkan.
                    </p>
                </Section>

                <Section title="5. Battle (Semi-Auto)" accent="#b8433a">
                    <p>
                        Begitu party dipilih, battle langsung jalan otomatis — AI pilih skill terbaik yang masih
                        cooldown-nya beres & resource-nya cukup, tiap ronde. Kamu cuma nonton animasinya (~15-30 detik),
                        bisa di-skip kalau males nunggu.
                    </p>
                    <p className="mb-0">
                        Ada juga peluang <strong>MELESET</strong> (accuracy vs evasion) dan <strong>CRITICAL</strong>{' '}
                        (peluang + bonus damage), plus efek "Efektif!"/"Kurang efektif" tergantung pola serangan vs
                        kelemahan monster.
                    </p>
                </Section>

                <Section title="6. EXP, Level, & Upgrade Stat" accent="#c9a24b">
                    <p>
                        Menang battle kasih EXP ke semua karakter di party. EXP ini dua fungsi:
                    </p>
                    <p>
                        <strong>Naik Level</strong> — otomatis, gak perlu ngapa-ngapain. Base Stats (Physical/Magic
                        Attack/Defense) naik sendiri tiap level, sesuai profil subclass kamu (stat yang udah tinggi
                        naik cepat, yang rendah naik pelan).
                    </p>
                    <p className="mb-0">
                        <strong>Upgrade Bonus Stat</strong> — di halaman karakter, klik tombol "+" di section Bonus
                        Stats buat nambah Physical/Magic Attack/Defense, Agility, Evasion, Critical Hit, atau Critical
                        Luck pakai EXP. Biayanya makin mahal tiap kali di-upgrade.
                    </p>
                </Section>

                <h2 className="rpg-class-title mt-5 mb-4" style={{ fontSize: '1.6rem' }}>FAQ</h2>

                <Faq q="Kenapa karakter orang lain gak kelihatan di roster/Guild saya?">
                    Sementara di tahap development ini, roster cuma nampilin karakter milik kamu sendiri. Di Guild,
                    yang kelihatan cuma karakter kamu + NPC — karakter pemain lain disembunyikan dulu.
                </Faq>

                <Faq q="Apa bedanya EXP di Resource sama Level?">
                    <strong>EXP</strong> di section Resource itu saldo yang bisa dipakai buat upgrade Bonus Stats (bisa
                    berkurang). <strong>Level</strong> naik dari akumulasi EXP total seumur hidup karakter (gak pernah
                    berkurang walau EXP-nya udah dipakai upgrade).
                </Faq>

                <Faq q="NPC 'Sedang Misi' itu apa?">
                    Sebagian NPC secara acak jadi gak bisa dipilih sementara (3-15 menit), seolah lagi ada tugas lain.
                    Ini random tiap kamu buka halaman Guild/pilih party — coba refresh atau tunggu beberapa menit.
                </Faq>

                <Faq q="Kenapa battle saya cuma jalan sebentar terus kelar?">
                    Kalau monster kalah cepat, itu emang wajar untuk monster level rendah. Battle juga otomatis mundur
                    kalau kelamaan (lebih dari 20 ronde) — dianggap seri, party mundur teratur tanpa penalti berat.
                </Faq>

                <Faq q="Skill mana yang dipakai kalau saya belum atur Loadout?">
                    Sistem random pilih 4 skill biasa + 1 ultimate dari subclass kamu setiap battle dimulai — beda-beda
                    tiap battle sampai kamu atur manual di halaman karakter.
                </Faq>

                <div className="text-center mt-5">
                    <Link href={route('guild.index')} className="rpg-back-link">
                        &larr; Kembali ke Guild
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
