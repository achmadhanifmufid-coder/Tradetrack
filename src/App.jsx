import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { BookOpen, LayoutDashboard, LogIn, LogOut, Wallet, WalletCards } from 'lucide-react';
import { auth, login, logout } from './firebase';
import { DataContext, useCollection } from './data';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Accounts from './pages/Accounts';
import Cashflow from './pages/Cashflow';

const NAV = [
  ['/', 'Dasbor', LayoutDashboard],
  ['/jurnal', 'Jurnal', BookOpen],
  ['/akun', 'Akun', WalletCards],
  ['/cashflow', 'Payout & Biaya', Wallet],
];

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <p className="center">Memuat…</p>;
  return user ? <Shell key={user.uid} /> : <SignIn />;
}

function SignIn() {
  const [error, setError] = useState('');
  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 360 }}>
        <h1>TradeTrack</h1>
        <p className="sub">Jurnal trading untuk akun prop firm.</p>
        <button className="btn" style={{ marginTop: 24 }} onClick={() => login().catch(e => setError(e.message))}>
          <LogIn size={16} /> Masuk dengan Google
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

function Shell() {
  const cols = {
    accounts: useCollection('accounts'),
    trades: useCollection('trades'),
    cashflows: useCollection('cashflows'),
  };
  const error = Object.values(cols).find(c => c.error)?.error;
  const ready = Object.values(cols).every(c => c.items);
  const data = { accounts: cols.accounts.items, trades: cols.trades.items, cashflows: cols.cashflows.items };

  return (
    <HashRouter>
      <div className="layout">
        <nav className="nav" aria-label="Navigasi utama">
          <div className="brand">TradeTrack</div>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={18} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
          <button className="btn ghost logout" onClick={logout}>
            <LogOut size={18} aria-hidden="true" /> <span>Keluar</span>
          </button>
        </nav>
        <main className="main">
          {error ? (
            <p className="form-error" role="alert">Gagal memuat data: {error}</p>
          ) : !ready ? (
            <p className="sub">Memuat data…</p>
          ) : (
            <DataContext.Provider value={data}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jurnal" element={<Journal />} />
                <Route path="/akun" element={<Accounts />} />
                <Route path="/cashflow" element={<Cashflow />} />
              </Routes>
            </DataContext.Provider>
          )}
        </main>
      </div>
    </HashRouter>
  );
}
