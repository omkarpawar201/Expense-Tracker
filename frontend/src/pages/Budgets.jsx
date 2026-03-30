import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_BUDGETS = '/api/budgets';
const API_EXPENSES = '/api/expenses';

const CATEGORIES = {
    1: "Housing", 2: "Transportation", 3: "Food", 4: "Utilities", 
    5: "Insurance", 6: "Medical", 7: "Investing", 8: "Personal", 
    9: "Entertainment", 10: "Others"
};

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [category, setCategory] = useState("1");
    const [targetAmount, setTargetAmount] = useState('');
    const [toast, setToast] = useState(null);
    const currency = localStorage.getItem('currency') || 'USD';
    const curSymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        try {
            const [resBudgets, resExp] = await Promise.all([
                fetch(API_BUDGETS, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(API_EXPENSES, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (resBudgets.status === 401 || resExp.status === 401) { navigate('/login'); return; }

            if (resBudgets.ok && resExp.ok) {
                const bData = await resBudgets.json();
                const eData = await resExp.json();
                setBudgets(Array.isArray(bData) ? bData : []);
                setExpenses(Array.isArray(eData) ? eData : []);
            }
        } catch (err) {
            console.error("Fetch DB error:", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddBudget = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = { category_name: CATEGORIES[category], target_amount: parseFloat(targetAmount) };

        try {
            const res = await fetch(API_BUDGETS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Budget successfully created");
                setShowModal(false);
                setCategory("1");
                setTargetAmount('');
                fetchData();
            } else {
                showToast("Failed to create budget", "error");
            }
        } catch(err) {
            showToast("Server error", "error");
        }
    };

    return (
        <div className="app-container">
            {toast && <div className={`toast-notification ${toast.type}`}> {toast.message} </div>}
            
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Budgets</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Set caps and track your category spending</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <i className="fa-solid fa-plus"></i> Create Budget
                    </button>
                </header>

                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {budgets.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active budgets found. Create one to get started!</div>
                    ) : (
                        budgets.map(b => {
                            // Find the internal ID of this category name
                            const catId = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === b.category_name);
                            const spent = expenses.filter(e => e.type === 'expense' && e.category_id == catId).reduce((acc, curr) => acc + curr.amount, 0);
                            const percentage = Math.min((spent / b.target_amount) * 100, 100);
                            const isExceeded = spent > b.target_amount;

                            return (
                                <div key={b.id} className="glass-panel" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                                                <i className="fa-solid fa-chart-line"></i>
                                            </div>
                                            <h3>{b.category_name}</h3>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                        <span><strong style={{ color: isExceeded ? '#ef4444' : 'inherit' }}>{curSymbol}{spent.toFixed(2)}</strong> Spent</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{curSymbol}{(b.target_amount - spent > 0 ? b.target_amount - spent : 0).toFixed(2)} Left</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${percentage}%`, background: isExceeded ? '#ef4444' : (percentage > 80 ? '#f59e0b' : '#10b981'), transition: 'width 0.5s ease-in-out' }}></div>
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
                            <h2><i className="fa-solid fa-chart-line"></i> Create Budget</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleAddBudget}>
                            <div className="form-group">
                                <label>Category to track</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required>
                                    {Object.entries(CATEGORIES).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Target Amount Cap ({curSymbol})</label>
                                <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Budget Target</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
