import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username); // This stores the Display Name
                navigate('/dashboard');
            } else {
                showToast("Invalid email or password", "error");
            }
        } catch (error) {
            console.error("Login failed:", error);
            showToast("Network error connecting to the backend.", "error");
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'} ${toast.type}`}></i>
                        {toast.message}
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '48px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="logo" style={{ justifyContent: 'center', marginBottom: '0' }}>
                    <i className="fa-solid fa-wallet"></i>
                    <h2>StellarTracker</h2>
                </div>
                <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Welcome Back</h3>
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Email Address</label>
                        <input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Password</label>
                        <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary w-100" style={{ marginTop: '16px' }}>Login</button>
                </form>
                
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#db2777', textDecoration: 'none' }}>Register</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
