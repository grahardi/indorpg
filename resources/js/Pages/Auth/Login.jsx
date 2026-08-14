import { Head, useForm, Link } from '@inertiajs/react';
import Layout from '../../Layout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('login'));
    }

    return (
        <Layout>
            <Head title="Login" />
            <div className="container py-5" style={{ maxWidth: 420 }}>
                <h1 className="rpg-class-title mb-4" style={{ fontSize: '1.7rem' }}>Login</h1>

                <form onSubmit={submit} className="rpg-card" style={{ '--accent': '#8890a4' }}>
                    <div className="mb-3">
                        <label className="rpg-stat-label d-block mb-1">Username</label>
                        <input
                            type="text"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            autoFocus
                        />
                        {errors.username && <div className="text-danger small mt-1">{errors.username}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="rpg-stat-label d-block mb-1">Password</label>
                        <input
                            type="password"
                            className="form-control bg-dark text-light border-secondary"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                    </div>

                    <button type="submit" className="btn btn-outline-light w-100" disabled={processing}>
                        {processing ? 'Masuk...' : 'Login'}
                    </button>

                    <p className="text-secondary small mt-3 mb-0 text-center">
                        Belum punya akun? <Link href={route('register')}>Daftar</Link>
                    </p>
                </form>
            </div>
        </Layout>
    );
}
