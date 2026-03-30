import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Settings() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
    const [displayName, setDisplayName] = useState(localStorage.getItem('username') || '');
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast({ message, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if(theme === 'light') document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
    }, [theme]);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('theme', theme);
        localStorage.setItem('username', displayName);
        localStorage.setItem('currency', currency);
        localStorage.setItem('language', language);
        
        if(theme === 'light') document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
        
        showToast("Preferences saved successfully!");
    };

    return (
        <div className="app-container">
            {toast && <div className={`toast-notification ${toast.type}`}> {toast.message} </div>}
            
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <h2>Global Settings</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your personal profile and visual preferences</p>
                </header>

                <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>
                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h3>{displayName || 'User'}</h3>
                    </div>

                    <div className="glass-panel" style={{ padding: '32px' }}>
                        <form onSubmit={handleSave}>
                            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Profile Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" defaultValue="1995-06-15" />
                                </div>
                            </div>
                            
                            <h3 style={{ margin: '32px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Personalization & Aesthetics</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Visual Theme</label>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div onClick={() => setTheme('dark')} style={{ padding: '16px', background: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', border: theme === 'dark' ? '1px solid #3b82f6' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                                            <i className="fa-solid fa-moon" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                                            <div style={{ fontWeight: 'bold' }}>Dark Mode</div>
                                        </div>
                                        <div onClick={() => setTheme('light')} style={{ padding: '16px', background: theme === 'light' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', border: theme === 'light' ? '1px solid #3b82f6' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                                            <i className="fa-regular fa-sun" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                                            <div style={{ fontWeight: 'bold' }}>Light Mode</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row" style={{ marginTop: '16px' }}>
                                <div className="form-group">
                                    <label>Default Currency</label>
                                    <select value={currency} onChange={e => setCurrency(e.target.value)}>
                                        <option value="USD">USD ($) - US Dollar</option>
                                        <option value="EUR">EUR (€) - Euro</option>
                                        <option value="GBP">GBP (£) - British Pound</option>
                                        <option value="INR">INR (₹) - Indian Rupee</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Language</label>
                                    <select value={language} onChange={e => setLanguage(e.target.value)}>
                                        <option value="English">English</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                                <button type="submit" className="btn-primary" style={{ padding: '12px 32px' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
