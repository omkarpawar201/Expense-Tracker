import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';

const API_URL = '/api/expenses';
const API_SAVINGS = '/api/savings';
const API_GOALS = '/api/goals';

const CATEGORIES = {
    1: "Food", 2: "Transport", 3: "Housing", 4: "Utilities",
    5: "Entertainment", 7: "Shopping", 8: "Other"
};

function Dashboard() {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State for Custom Delete Confirmation Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const [toast, setToast] = useState(null);

    const [savingsAmount, setSavingsAmount] = useState(0);
    const currency = localStorage.getItem('currency') || 'USD';
    const curSymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    
    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('1');
    const [date, setDate] = useState('');
    const [type, setType] = useState('expense');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const token = localStorage.getItem('token');
    const db_username = localStorage.getItem('username') || 'User';

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        fetchExpenses();
    }, [token]);

    const handleUnauthorized = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const fetchExpenses = async () => {
        try {
            const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.status === 401) return handleUnauthorized();
            if (!res.ok) throw new Error("API Error");
            
            const data = await res.json();
            const processedData = Array.isArray(data) ? data : [];

            processedData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
            setExpenses(processedData);
            
            // Bridge Savings Total safely
            const resSav = await fetch(API_SAVINGS, { headers: { 'Authorization': `Bearer ${token}` } });
            if (resSav.ok) {
                const sData = await resSav.json();
                const sList = Array.isArray(sData) ? sData : [];
                setSavingsAmount(sList.reduce((acc, curr) => acc + curr.amount, 0));
            }
        } catch (error) {
            console.error("Failed to fetch:", error);
            showToast("Failed to connect to the server.", "error");
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const payload = {
            description, amount: parseFloat(amount),
            category_id: parseInt(category), expense_date: date,
            type: type
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.status === 401) return handleUnauthorized();

            if (res.ok) {
                setIsModalOpen(false);
                setDescription(''); setAmount(''); setDate('');
                fetchExpenses();
                showToast("Expense added successfully!", "success");
            } else {
                showToast("Failed to add expense.", "error");
            }
        } catch (error) {
            console.error("Error adding expense:", error);
            showToast("Network error. Could not add expense.", "error");
        }
    };

    const confirmDelete = (id) => {
        setPendingDeleteId(id);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        setDeleteModalOpen(false);
        if(!pendingDeleteId) return;
        
        try {
            const res = await fetch(`${API_URL}/${pendingDeleteId}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) return handleUnauthorized();

            if (res.ok) {
                fetchExpenses();
                showToast("Expense removed.", "success");
            } else {
                showToast("Failed to delete.", "error");
            }
        } catch (error) {
            console.error("Failed to delete expense:", error);
        } finally {
            setPendingDeleteId(null);
        }
    };

    const stats = useMemo(() => {
        const income = expenses.filter(e => e.type === 'income').reduce((sum, item) => sum + item.amount, 0);
        const expense = expenses.filter(e => e.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
        const balance = income - expense;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthData = expenses.filter(e => {
            const d = new Date(e.expense_date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthIncome = currentMonthData.filter(e => e.type === 'income').reduce((sum, item) => sum + item.amount, 0);
        const monthExpense = currentMonthData.filter(e => e.type === 'expense').reduce((sum, item) => sum + item.amount, 0);

        return { balance, income, expense, monthIncome, monthExpense };
    }, [expenses]);

    const chartData = useMemo(() => {
        const pieMap = {};
        expenses.filter(e => e.type === 'expense').forEach(e => {
            const cat = CATEGORIES[e.category_id] || "Other";
            pieMap[cat] = (pieMap[cat] || 0) + e.amount;
        });
        const pieData = Object.keys(pieMap).map(k => ({ name: k, value: pieMap[k] }));
        
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const areaMap = {};
        const d = new Date();
        for(let i=5; i>=0; i--) {
            let m = new Date(d.getFullYear(), d.getMonth() - i, 1);
            areaMap[`${m.getFullYear()}-${m.getMonth()}`] = { name: months[m.getMonth()], income: 0, expense: 0 };
            // Ensure December wraps around correctly
            if(m.getMonth() === -1) { m.setFullYear(m.getFullYear()-1); m.setMonth(11); areaMap[`${m.getFullYear()}-${m.getMonth()}`] = { name: "Dec", income: 0, expense: 0 }; }
        }
        
        expenses.forEach(e => {
            const ed = new Date(e.expense_date);
            const key = `${ed.getFullYear()}-${ed.getMonth()}`;
            if(areaMap[key]) {
                if(e.type === 'income') areaMap[key].income += e.amount;
                else areaMap[key].expense += e.amount;
            }
        });
        const areaData = Object.values(areaMap);

        return { pieData, areaData };
    }, [expenses]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };

    return (
        <div className="app-container">
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'} ${toast.type}`}></i>
                        {toast.message}
                    </div>
                </div>
            )}

            <Sidebar />

            <main className="main-content">
                <header className="top-header">
                    <div>
                        <h1>Overview</h1>
                        <p className="subtitle">Welcome back {db_username}, here is your financial summary.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                            <i className="fa-solid fa-plus"></i> Add Expense
                        </button>
                        <div className="notification-icon"><i className="fa-regular fa-bell"></i></div>
                    </div>
                </header>

                <div className="dashboard-grid">
                    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div className="card glass-panel gradient-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '1.5rem' }}>
                                <i className="fa-solid fa-wallet"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Balance</h3>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{curSymbol}{stats.balance.toFixed(2)}</h2>
                            </div>
                        </div>
                        <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '1.5rem' }}>
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Income</h3>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{curSymbol}{stats.income.toFixed(2)}</h2>
                            </div>
                        </div>
                        <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '12px', fontSize: '1.5rem' }}>
                                <i className="fa-solid fa-arrow-trend-down"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Expense</h3>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{curSymbol}{stats.expense.toFixed(2)}</h2>
                            </div>
                        </div>
                        <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '12px', fontSize: '1.5rem' }}>
                                <i className="fa-solid fa-piggy-bank"></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Savings</h3>
                                <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>{curSymbol}{savingsAmount.toFixed(2)}</h2>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div className="glass-panel" style={{ padding: '24px', minHeight: '300px' }}>
                            <h3 style={{ margin: '0 0 16px' }}>Financial Overview</h3>
                            {chartData.pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={chartData.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {chartData.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ background: 'var(--surface-color)', border: 'none', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '48px'}}>No expense data.</p>}
                        </div>
                        <div className="glass-panel" style={{ padding: '24px', minHeight: '300px' }}>
                            <h3 style={{ margin: '0 0 16px' }}>Account Overview</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={chartData.areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip contentStyle={{ background: 'var(--surface-color)', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="transactions-section glass-panel">
                        <div className="section-header">
                            <h2>Recent Transactions</h2>
                        </div>
                        <div className="table-container">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: exp.type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: exp.type === 'income' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                    <i className={`fa-solid ${exp.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                </div>
                                                <div>
                                                    <strong style={{ display: 'block' }}>{exp.description || 'N/A'}</strong>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{CATEGORIES[exp.category_id] || "Unknown"}</span>
                                                </div>
                                            </td>
                                            <td>{exp.expense_date}</td>
                                            <td style={{ fontWeight: 600, color: exp.type === 'income' ? '#10b981' : 'inherit' }}>
                                                {exp.type === 'income' ? '+' : '-'}${exp.amount.toFixed(2)}
                                            </td>
                                            <td>
                                                <button className="delete-btn" onClick={() => confirmDelete(exp.id)}>
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{textAlign: 'center'}}>No expenses found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Delete Confirmation Modal */}
            <div className={`modal-overlay ${deleteModalOpen ? 'active' : ''}`}>
                <div className="modal glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '16px' }}>
                        <i className="fa-regular fa-circle-xmark"></i>
                    </div>
                    <h2>Delete Transaction</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
                        Are you absolutely sure you want to delete this expense? This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }} onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                        <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }} onClick={executeDelete}>Delete it</button>
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`}>
                <div className="modal glass-panel">
                    <div className="modal-header">
                        <h2>Add New Expense</h2>
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form onSubmit={handleAddExpense}>
                        <div className="form-group">
                            <label>Transaction Type</label>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={e => setType(e.target.value)} />
                                    Expense
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="radio" name="type" value="income" checked={type === 'income'} onChange={e => setType(e.target.value)} />
                                    Income
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <input type="text" id="description" placeholder="e.g. Groceries, Netflix, Salary" 
                                   value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="amount">Amount ({curSymbol})</label>
                                <input type="number" id="amount" step="0.01" placeholder="0.00" 
                                       value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">Category</label>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value)} required>
                                    <option value="1">Food</option>
                                    <option value="2">Transport</option>
                                    <option value="3">Housing</option>
                                    <option value="4">Utilities</option>
                                    <option value="5">Entertainment</option>
                                    <option value="7">Shopping</option>
                                    <option value="8">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="date">Date</label>
                            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary w-100">Save Transaction</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
