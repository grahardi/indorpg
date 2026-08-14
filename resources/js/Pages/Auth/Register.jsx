import { Head, useForm, Link } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('register'));
    }

    return (
        <Layout>
            <Head title="Daftar" />
            <div className="container py-5" style={{ maxWidth: 420 }}>
                <h1 className="rpg-class-title mb-4" style={{ fontSize: '1.7rem' }}>Daftar Akun</h1>

                <form onSubmit={submit} className="rpg-card" style={{ '--accent': '#8890a4' }}>
                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Username</label>
                        <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            placeholder="huruf, angka, - dan _ saja"
                            autoFocus
                        />
                        {errors.username && <div className="text-danger small mt-1">{errors.username}</div>}
                    </div>

                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Password</label>
                        <input
                            type="password"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="rpg-stat-label d-block mb-1">Ulangi Password</label>
                        <input
                            type="password"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-outline-light w-100" disabled={processing}>
                        {processing ? 'Mendaftar...' : 'Daftar'}
                    </button>

                    <p className="text-secondary small mt-3 mb-0 text-center">
                        Udah punya akun? <Link href={route('login')}>Login</Link>
                    </p>
                </form>
            </div>
        </Layout>
    );
}
