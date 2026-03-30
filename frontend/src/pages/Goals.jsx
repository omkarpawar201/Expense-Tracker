import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_GOALS = '/api/goals';

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // Form States
    const [title, setTitle] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [savedAmount, setSavedAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('Medium');
    
    const [toast, setToast] = useState(null);
    const currency = localStorage.getItem('currency') || 'USD';
    const curSymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const navigate = useNavigate();

    const showToast = (message, t = 'success') => {
        setToast({ message, type: t });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchGoals = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        try {
            const res = await fetch(API_GOALS, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.ok) {
                const data = await res.json();
                setGoals(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Fetch Goals error:", err);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = { 
            title, 
            target_amount: parseFloat(targetAmount),
            saved_amount: savedAmount ? parseFloat(savedAmount) : 0,
            deadline,
            priority
        };

        try {
            const res = await fetch(API_GOALS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Goal successfully registered!");
                setShowModal(false);
                setTitle(''); setTargetAmount(''); setSavedAmount(''); setDeadline(''); setPriority('Medium');
                fetchGoals();
            } else {
                showToast("Failed to save goal", "error");
            }
        } catch(err) {
            showToast("Server error", "error");
        }
    };

    const getDaysLeft = (dateStr) => {
        const msDiff = new Date(dateStr) - new Date();
        const days = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} days left` : 'Expired';
    };

    const getPriorityColor = (p) => {
        if (p === 'High') return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
        if (p === 'Low') return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' }; // Medium
    };

    return (
        <div className="app-container">
            {toast && <div className={`toast-notification ${toast.type}`}> {toast.message} </div>}
            
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Goals Tracker</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Set milestones and track long-term aspirations</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <i className="fa-solid fa-plus"></i> Set New Goal
                    </button>
                </header>

                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {goals.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active financial goals. Set one today!</div>
                    ) : (
                        goals.map(g => {
                            const percentage = Math.min((g.saved_amount / g.target_amount) * 100, 100);
                            const pColors = getPriorityColor(g.priority);

                            return (
                                <div key={g.id} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '0.8rem', background: pColors.bg, color: pColors.text, padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {g.priority}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                            <i className="fa-solid fa-bullseye"></i>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0 }}>{g.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{getDaysLeft(g.deadline)} • Target: {curSymbol}{g.target_amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <span><strong>{curSymbol}{g.saved_amount.toFixed(2)}</strong> Saved</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.5s ease-in-out' }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay active">
                    <div className="modal-content glass-panel bounce-in">
                        <div className="modal-header">
                            <h2><i className="fa-solid fa-bullseye"></i> Create Goal</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleAddGoal}>
                            <div className="form-group">
                                <label>Goal Title</label>
                                <input type="text" placeholder="e.g. Dream Vacation, New Car" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Amount ({curSymbol})</label>
                                    <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Already Saved ({curSymbol})</label>
                                    <input type="number" step="0.01" value={savedAmount} onChange={e => setSavedAmount(e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Deadline</label>
                                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Priority Focus</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value)} required>
                                        <option value="High">High Priority</option>
                                        <option value="Medium">Medium Priority</option>
                                        <option value="Low">Low Priority</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{width: '100%'}}>Lock Goal</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
