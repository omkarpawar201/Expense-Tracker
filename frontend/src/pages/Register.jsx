import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            showToast("Passwords do not match", "error"); return;
        }
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, password })
            });

            if (res.ok) {
                showToast("Account created successfully. Please login.", "success");
                setTimeout(() => navigate('/login'), 1500); // Give user time to see success
            } else {
                showToast("Registration failed. Email might be in use.", "error");
            }
        } catch (error) {
            console.error("Registration failed:", error);
            showToast("Network error connecting to backend.", "error");
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
                <h3 style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Create Account</h3>
                
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Email Address</label>
                        <input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Display Name</label>
                        <input type="text" placeholder="Choose a display name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Password</label>
                        <input type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Confirm Password</label>
                        <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary w-100" style={{ marginTop: '16px' }}>Register</button>
                </form>
                
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: '#db2777', textDecoration: 'none' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
