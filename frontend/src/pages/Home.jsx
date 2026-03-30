import { Link } from 'react-router-dom';

function Home() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', width: '100vw', textAlign: 'center', gap: '32px'
        }}>
            <div className="logo" style={{ fontSize: '3rem', marginBottom: '0' }}>
                <i className="fa-solid fa-wallet"></i>
                <h2>Expense Tracker</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px' }}>
                The most stunning and performant way to track your expenses.
                Built with a high-performance C++ backend and a modern React frontend.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
                    <i className="fa-solid fa-right-to-bracket"></i> Login
                </Link>
                <Link to="/register" className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'none', border: '1px solid var(--panel-border)', textDecoration: 'none' }}>
                    <i className="fa-solid fa-user-plus"></i> Create Account
                </Link>
            </div>
        </div>
    );
}

export default Home;
