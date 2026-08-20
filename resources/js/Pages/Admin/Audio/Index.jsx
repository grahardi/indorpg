import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import Layout from '../../../Layout';

function AudioSlot({ slot }) {
    const inputRef = useRef(null);
    const audioRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('audio', file);
        router.post(route('admin.audio.upload', slot.key), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setUploading(false),
        });
    }

    function reset() {
        if (!confirm(`Reset "${slot.label}" ke suara default?`)) return;
        router.delete(route('admin.audio.reset', slot.key), { preserveScroll: true });
    }

    function play() {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    }

    return (
        <div className="rpg-card mb-2" style={{ '--accent': slot.path ? '#4a9960' : '#8890a4', padding: '1rem' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <div className="rpg-subclass-name" style={{ fontSize: '0.95rem' }}>{slot.label}</div>
                    <p className="text-secondary small mb-0">
                        {slot.path ? 'Custom audio ter-upload' : 'Pakai suara sintesis default (Web Audio API)'}
                    </p>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    {slot.path && (
                        <>
                            <audio ref={audioRef} src={slot.path} preload="none" />
                            <button onClick={play} className="rpg-back-link" style={{ fontSize: '0.75rem' }}>▶ Play</button>
                            <button onClick={reset} className="rpg-back-link" style={{ fontSize: '0.75rem', color: '#b8433a', borderColor: '#b8433a' }}>
                                Reset
                            </button>
                        </>
                    )}
                    <label className="btn btn-sm btn-outline-light mb-0" style={{ cursor: uploading ? 'wait' : 'pointer', fontSize: '0.75rem' }}>
                        {uploading ? 'Mengupload...' : slot.path ? 'Ganti File' : 'Upload'}
                        <input ref={inputRef} type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a" onChange={handleFileChange} disabled={uploading} hidden />
                    </label>
                </div>
            </div>
        </div>
    );
}

export default function Index({ slots }) {
    const { props } = usePage();

    return (
        <Layout>
            <Head title="Admin - Audio" />
            <div className="container py-5" style={{ maxWidth: 700 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="rpg-hero-title display-6 mb-0">Pengaturan Audio</h1>
                    <Link href={route('admin.settings.index')} className="rpg-back-link">← Settings</Link>
                </div>

                {props.flash?.success && (
                    <div className="rpg-card mb-4" style={{ '--accent': '#4a9960', color: '#4a9960' }}>
                        {props.flash.success}
                    </div>
                )}

                <p className="text-secondary small mb-4">
                    Upload file audio (MP3/WAV/OGG, maks 2MB) buat gantiin suara sintesis default di tiap event battle.
                    Kosongin/reset kapan aja buat balik ke suara default.
                </p>

                {slots.map((slot) => (
                    <AudioSlot key={slot.key} slot={slot} />
                ))}
            </div>
        </Layout>
    );
}
