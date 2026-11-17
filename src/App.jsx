import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { BookOpen, LayoutDashboard, LogIn, LogOut, Wallet, WalletCards } from 'lucide-react';
import { auth, login, logout, redirectResult } from './firebase';
import { DataContext, useCollection } from './data';
import { LangContext, saveLang, savedLang, useT } from './i18n';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Accounts from './pages/Accounts';
import Cashflow from './pages/Cashflow';

const NAV = [
  ['/', 'nav.dashboard', LayoutDashboard],
  ['/jurnal', 'nav.journal', BookOpen],
  ['/akun', 'nav.accounts', WalletCards],
  ['/cashflow', 'nav.cashflow', Wallet],
];

export default function App() {
  const [user, setUser] = useState(undefined);
  const [lang, setLang] = useState(savedLang);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    document.documentElement.lang = lang;
    saveLang(lang);
  }, [lang]);
  return (
    <LangContext.Provider value={lang}>
      {user === undefined ? <Loading /> : user ? <Shell key={user.uid} lang={lang} setLang={setLang} /> : <SignIn />}
    </LangContext.Provider>
  );
}

function Loading() {
  return <p className="center">{useT()('loading')}</p>;
}

function LangToggle({ lang, setLang }) {
  const t = useT();
  return (
    <div className="lang" role="group" aria-label={t('language')}>
      {['id', 'en'].map(l => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

function SignIn() {
  const t = useT();
  const [error, setError] = useState('');
  useEffect(() => {
    redirectResult().catch(e => setError(e.message));
  }, []);
  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 360 }}>
        <h1>TradeTrack</h1>
        <p className="sub">{t('tagline')}</p>
        <button className="btn" style={{ marginTop: 24 }} onClick={() => login().catch(e => setError(e.message))}>
          <LogIn size={16} /> {t('signIn')}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

function Shell({ lang, setLang }) {
  const t = useT();
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
        <nav className="nav" aria-label={t('nav.label')}>
          <div className="brand">TradeTrack</div>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={18} aria-hidden="true" /> <span>{t(label)}</span>
            </NavLink>
          ))}
          <LangToggle lang={lang} setLang={setLang} />
          <button className="btn ghost logout" onClick={logout}>
            <LogOut size={18} aria-hidden="true" /> <span>{t('nav.logout')}</span>
          </button>
        </nav>
        <main className="main">
          {error ? (
            <p className="form-error" role="alert">{t('loadError', { msg: error })}</p>
          ) : !ready ? (
            <p className="sub">{t('loadingData')}</p>
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
