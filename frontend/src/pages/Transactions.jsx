import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API_URL = '/api/expenses';

const CATEGORIES = {
    1: "Housing",
    2: "Transportation",
    3: "Food",
    4: "Utilities",
    5: "Insurance",
    6: "Medical",
    7: "Investing",
    8: "Personal",
    9: "Entertainment",
    10: "Others"
};

export default function Transactions() {
    const [expenses, setExpenses] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense'
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [toast, setToast] = useState(null);
    const currency = localStorage.getItem('currency') || 'USD';
    const curSymbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return null;
        }
        return token;
    };

    const fetchExpenses = async () => {
        const token = await checkAuth();
        if (!token) return;

        try {
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.ok) {
                const data = await res.json();
                setExpenses(Array.isArray(data) ? data.reverse() : []);
            }
        } catch (err) {
            console.error("Fetch DB error:", err);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [navigate]);

    const handleSingleDelete = (id) => {
        setPendingDeleteId(id);
        setDeleteModalOpen(true);
    };

    const handleBatchDelete = () => {
        setPendingDeleteId(null);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        const token = await checkAuth();
        try {
            if (pendingDeleteId) {
                await fetch(`${API_URL}/${pendingDeleteId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                setSelectedIds(selectedIds.filter(selected => selected !== pendingDeleteId));
            } else {
                await Promise.all(selectedIds.map(id => fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }})));
                setSelectedIds([]);
            }
            fetchExpenses();
            setDeleteModalOpen(false);
            showToast("Transaction(s) deleted");
        } catch (err) { console.error(err); }
    };

    const filteredExpenses = expenses.filter(exp => filter === 'all' || exp.type === filter);

    return (
        <div className="app-container">
            {toast && (
                <div className={`toast-notification ${toast.type}`}>
                    <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    {toast.message}
                </div>
            )}
            
            <Sidebar />

            <main className="main-content">
                <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                    <div>
                        <h2>All Transactions</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>View and manage your complete financial history</p>
                    </div>
                </header>

                <div className="transactions-section glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                        <button onClick={() => setFilter('all')} style={{ background: filter === 'all' ? 'var(--primary-color)' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>All</button>
                        <button onClick={() => setFilter('income')} style={{ background: filter === 'income' ? '#10b981' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Income</button>
                        <button onClick={() => setFilter('expense')} style={{ background: filter === 'expense' ? '#ef4444' : 'transparent', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Expense</button>
                        {selectedIds.length > 0 && (
                            <button onClick={handleBatchDelete} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginLeft: 'auto' }}>
                                <i className="fa-solid fa-trash"></i> Delete Selected ({selectedIds.length})
                            </button>
                        )}
                    </div>

                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>
                                        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                            <input type="checkbox" checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length} onChange={(e) => setSelectedIds(e.target.checked ? filteredExpenses.map(x => x.id) : [])} /> Transaction
                                        </div>
                                    </th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, exp.id] : selectedIds.filter(id => id !== exp.id))} />
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
                                            {exp.type === 'income' ? '+' : '-'}{curSymbol}{exp.amount.toFixed(2)}
                                        </td>
                                        <td>
                                            <button className="delete-btn" onClick={() => handleSingleDelete(exp.id)}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {deleteModalOpen && (
                <div className="modal-overlay active">
                    <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '16px' }}>
                            <i className="fa-regular fa-circle-xmark"></i>
                        </div>
                        <h2>Delete {pendingDeleteId ? 'Transaction' : 'Transactions'}</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
                            Are you sure you want to delete {pendingDeleteId ? 'this transaction' : `these ${selectedIds.length} transactions`}? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }} onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }} onClick={executeDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
