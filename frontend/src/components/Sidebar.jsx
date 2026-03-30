import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        setDisplayName(localStorage.getItem('username') || 'User');
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const userLang = localStorage.getItem('language') || 'English';
    const trans = {
        'English': { dash: 'Dashboard', trans: 'Transaction', budg: 'Budgets', sav: 'Savings', goals: 'Goals', set: 'Settings' },
        'Spanish': { dash: 'Tablero', trans: 'Transacciones', budg: 'Presupuestos', sav: 'Ahorros', goals: 'Metas', set: 'Ajustes' },
        'French': { dash: 'Tableau', trans: 'Transaction', budg: 'Budgets', sav: 'Épargne', goals: 'Buts', set: 'Paramètres' }
    };
    const labels = trans[userLang] || trans['English'];

    const navItems = [
        { path: '/dashboard', label: labels.dash, icon: 'fa-chart-pie' },
        { path: '/transactions', label: labels.trans, icon: 'fa-receipt' },
        { path: '/budgets', label: labels.budg, icon: 'fa-chart-line' },
        { path: '/savings', label: labels.sav, icon: 'fa-piggy-bank' },
        { path: '/goals', label: labels.goals, icon: 'fa-bullseye' },
        { path: '/settings', label: labels.set, icon: 'fa-gear' }
    ];

    return (
        <aside className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                <i className="fa-solid fa-wallet"></i>
                <h2 style={{ margin: 0 }}>Expensify</h2>
            </div>
            
            <nav className="nav-menu">
                {navItems.map(item => (
                    <a key={item.path} 
                       className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} 
                       onClick={() => navigate(item.path)}
                       style={{ cursor: 'pointer' }}>
                        <i className={`fa-solid ${item.icon}`}></i> {item.label}
                    </a>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
                <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: '500' }}>{displayName}</p>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}>
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        </aside>
    );
}
