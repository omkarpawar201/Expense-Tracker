import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_SAVINGS = '/api/savings';

export default function Savings() {
    const [savings, setSavings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('deposit'); // deposit or withdrawal
    const [toast, setToast] = useState(null);
    const currency = localStorage.getItem('currency') || 'USD';
    const curSymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const navigate = useNavigate();

    const showToast = (message, t = 'success') => {
        setToast({ message, type: t });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSavings = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        try {
            const res = await fetch(API_SAVINGS, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.ok) {
                const data = await res.json();
                setSavings(Array.isArray(data) ? data.reverse() : []);
            }
        } catch (err) {
            console.error("Fetch Savings error:", err);
        }
    };

    useEffect(() => { fetchSavings(); }, []);

    const handleAddSaving = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const finalAmount = type === 'withdrawal' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
        const payload = { amount: finalAmount, description, transaction_date: date };

        try {
            const res = await fetch(API_SAVINGS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Saving transaction logged!");
                setShowModal(false);
                setAmount(''); setDescription(''); setDate('');
                fetchSavings();
            } else {
                showToast("Failed to log saving", "error");
            }
        } catch(err) {
            showToast("Server error", "error");
        }
    };

    const totalSavings = useMemo(() => {
        return savings.reduce((acc, curr) => acc + curr.amount, 0);
    }, [savings]);

    return (
        <div className="app-container">
            {toast && <div className={`toast-notification ${toast.type}`}> {toast.message} </div>}
            
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Savings Wallet</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Track your liquid vault and long-term deposits</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <i className="fa-solid fa-plus"></i> New Transaction
                    </button>
                </header>

                <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', marginBottom: '32px' }}>
                    <div className="card glass-panel gradient-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>
                        <i className="fa-solid fa-piggy-bank" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.9 }}></i>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>Total Vault Balance</h3>
                        <h2 style={{ margin: '8px 0 0', fontSize: '3rem' }}>{curSymbol}{totalSavings.toFixed(2)}</h2>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px' }}>Savings Growth </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={savings.slice().reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <XAxis dataKey="transaction_date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--surface-color)', border: 'none', borderRadius: '8px' }} />
                                <Area type="step" dataKey="amount" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="transactions-section glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Ledger History</h3>
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {savings.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: s.amount >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: s.amount >= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                <i className={`fa-solid ${s.amount >= 0 ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                            </div>
                                            <strong>{s.description || 'Deposit'}</strong>
                                        </td>
                                        <td>{s.transaction_date}</td>
                                        <td style={{ fontWeight: 600, color: s.amount >= 0 ? '#10b981' : '#ef4444' }}>
                                            {s.amount >= 0 ? '+' : '-'}{curSymbol}{Math.abs(s.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {savings.length === 0 && (
                                    <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No savings transactions found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal-content glass-panel bounce-in">
                        <div className="modal-header">
                            <h2><i className="fa-solid fa-piggy-bank"></i> Vault Transaction</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleAddSaving}>
                            <div className="form-group">
                                <label>Transaction Type</label>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="type" value="deposit" checked={type === 'deposit'} onChange={e => setType(e.target.value)} />
                                        Deposit Into Vault
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="radio" name="type" value="withdrawal" checked={type === 'withdrawal'} onChange={e => setType(e.target.value)} />
                                        Withdraw
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" placeholder="e.g. Xmas Bonus, Emergency Fund" value={description} onChange={e => setDescription(e.target.value)} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount ({curSymbol})</label>
                                    <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Transaction</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
