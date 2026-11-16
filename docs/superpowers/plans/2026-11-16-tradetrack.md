# TradeTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal prop-firm trading journal (accounts + risk limits, trades + stats, payouts + costs) deployed to GitHub Pages.

**Architecture:** Single-page React app built with Vite. Firebase Auth (Google) gates the app; three Firestore collections under `users/{uid}/` are loaded once with realtime listeners and shared through a React context. All statistics are pure functions in `src/stats.js`, computed on render and unit-tested with Vitest.

**Tech Stack:** Vite, React, react-router-dom (HashRouter), Firebase JS SDK (auth + firestore), chart.js, lucide-react, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-16-tradetrack-design.md`. Design system: `docs/DESIGN.md` (Verdana Health).
- UI copy in Indonesian. Amounts in USD, formatted `en-US` currency (`$1,234.50`). Numbers shown in Fira Code.
- Colors: navy `#0F172A` for primary actions/headers, sage `#059669` only for links/positive accents, background `#F8FAFC`, surfaces `#FFFFFF`, borders `#E2E8F0`. Radius 8px for buttons/cards/inputs, 12px for modals.
- Runtime dependencies limited to: `react`, `react-dom`, `react-router-dom`, `firebase`, `chart.js`, `lucide-react`. Dev: `vite`, `@vitejs/plugin-react`, `vitest`.
- Vite `base: '/Tradetrack/'`. Live URL: `https://achmadhanifmufid-coder.github.io/Tradetrack/`.
- Firestore paths: `users/{uid}/accounts`, `users/{uid}/trades`, `users/{uid}/cashflows`. Every new doc gets `createdAt: Date.now()`. Empty optional fields stored as `null`. Dates stored as `YYYY-MM-DD` local-date strings.
- No Firebase Storage. Screenshots are JPEG data URLs ≤ 400,000 characters stored in the trade doc.
- Layout must work at 375px width with no horizontal page scroll (tables scroll inside `.table-wrap`).
- After each task: commit, then `git push`. Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Commands run from `D:\hanif\Jurnal` in Git Bash.

## File map

```
index.html                     fonts, root div
vite.config.js                 react plugin, base path, vitest env
package.json
.gitignore
.github/workflows/deploy.yml   test + build + publish to Pages on push to main
firestore.rules                owner-only access
src/main.jsx                   mount
src/theme.css                  Verdana Health tokens + all styles
src/stats.js                   pure calculations
src/stats.test.js              unit tests
src/firebase.js                init, login, logout
src/data.js                    useCollection, DataContext/useData, add/update/remove
src/ui.jsx                     formatters, StatCard, rowProps, Modal, FormModal
src/App.jsx                    auth gate, sign-in screen, layout + nav, routes
src/image.js                   screenshot compression
src/pages/Dashboard.jsx
src/pages/Journal.jsx
src/pages/Accounts.jsx
src/pages/Cashflow.jsx
```

---

### Task 1: Scaffold, theme and deploy workflow

**Files:**
- Create: `package.json` (via npm), `vite.config.js`, `index.html`, `.gitignore`, `src/main.jsx`, `src/App.jsx`, `src/theme.css`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` scripts; CSS classes used by every later task: `.layout .nav .brand .main .page-head .sub .btn(.secondary|.ghost|.danger|.sm) .card .grid .stat-label .stat-value .stat-sub .pos .neg .chip(.success|.warning|.error|.info) .filters .table-wrap .num .mono .clickable .empty .note .field .form-grid .wide .form-error .image-input .overlay .modal .bar .chart .center .health`.

- [ ] **Step 1: Create package.json and install dependencies**

```bash
npm init -y
npm pkg set name=tradetrack private=true type=module scripts.dev=vite scripts.build="vite build" scripts.preview="vite preview" scripts.test="vitest run"
npm pkg delete main keywords author license description
npm install react react-dom react-router-dom firebase chart.js lucide-react
npm install -D vite @vitejs/plugin-react vitest
```

- [ ] **Step 2: Write config and entry files**

`vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Tradetrack/',
  test: { environment: 'node' },
});
```

`.gitignore`:
```
node_modules
dist
```

`index.html`:
```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TradeTrack</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Fira+Code:wght@400;500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/main.jsx`:
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.jsx` (temporary, replaced in Task 3):
```jsx
export default function App() {
  return (
    <div className="center">
      <div className="card">
        <h1>TradeTrack</h1>
        <p className="sub">Scaffold OK.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/theme.css`**

```css
:root {
  --navy: #0F172A;
  --navy-hover: #020617;
  --slate: #64748B;
  --text-2: #475569;
  --sage: #059669;
  --bg: #F8FAFC;
  --surface: #FFFFFF;
  --border: #E2E8F0;
  --divider: #F1F5F9;
  --success: #22C55E;
  --success-text: #16A34A;
  --warning: #EAB308;
  --warning-text: #CA8A04;
  --error: #EF4444;
  --error-text: #DC2626;
  --info: #0EA5E9;
  --r-sm: 4px;
  --r: 8px;
  --r-md: 12px;
  --sh-sm: 0 1px 3px rgba(15, 23, 42, 0.03);
  --sh-lg: 0 8px 32px rgba(15, 23, 42, 0.10);
  --font-head: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, monospace;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--navy); font: 16px/1.6 var(--font-body); }
h1, h2, h3 { font-family: var(--font-head); margin: 0; }
h1 { font-size: 32px; line-height: 1.2; font-weight: 700; }
h2 { font-size: 20px; line-height: 1.3; font-weight: 600; margin: 32px 0 16px; }
h3 { font-size: 16px; line-height: 1.35; font-weight: 500; }
button, input, select, textarea { font: inherit; }
a { color: var(--sage); }
:focus-visible { outline: 2px solid var(--sage); outline-offset: 2px; }
.mono, .num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

/* layout */
.layout { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
.nav { background: var(--surface); border-right: 1px solid var(--border); padding: 24px 16px; display: flex; flex-direction: column; gap: 4px; position: sticky; top: 0; height: 100vh; }
.brand { font: 700 20px var(--font-head); padding: 0 12px 24px; }
.nav a, .nav .logout { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: var(--r); color: var(--text-2); text-decoration: none; font-weight: 500; font-size: 14px; }
.nav a:hover { background: var(--divider); }
.nav a.active { background: var(--navy); color: #FFFFFF; }
.nav .logout { margin-top: auto; height: auto; justify-content: flex-start; }
.main { padding: 32px; max-width: 1200px; width: 100%; min-width: 0; }
.page-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.sub { color: var(--slate); font-size: 14px; margin: 4px 0 0; }
.center { min-height: 100vh; display: grid; place-items: center; text-align: center; padding: 16px; }

/* buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 42px; padding: 0 22px; border: none; border-radius: var(--r); background: var(--navy); color: #FFFFFF; font-size: 14px; font-weight: 500; cursor: pointer; box-shadow: var(--sh-sm); }
.btn:hover { background: var(--navy-hover); }
.btn.secondary { background: transparent; color: var(--navy); border: 1px solid var(--navy); box-shadow: none; }
.btn.secondary:hover { background: #0F172A0A; }
.btn.ghost { background: transparent; color: var(--text-2); box-shadow: none; }
.btn.ghost:hover { background: var(--divider); }
.btn.danger { background: var(--error); }
.btn.danger:hover { background: var(--error-text); }
.btn.sm { height: 32px; padding: 0 14px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* cards & stats */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 24px; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px; }
.stat-label { font-size: 12px; font-weight: 500; color: var(--slate); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font: 500 24px/1.3 var(--font-mono); font-variant-numeric: tabular-nums; margin-top: 4px; }
.stat-sub { font-size: 12px; color: var(--text-2); margin: 4px 0 0; }
.pos { color: var(--success-text); }
.neg { color: var(--error-text); }

/* chips */
.chip { display: inline-block; padding: 4px 12px; border-radius: var(--r-sm); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.chip.success { background: #22C55E15; color: var(--success-text); }
.chip.warning { background: #EAB30815; color: var(--warning-text); }
.chip.error { background: #EF444415; color: var(--error-text); }
.chip.info { background: #0EA5E915; color: #0284C7; }

/* tables */
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; font-size: 12px; font-weight: 500; color: var(--slate); text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 16px; border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 12px 16px; border-bottom: 1px solid var(--divider); white-space: nowrap; }
th.num, td.num { text-align: right; }
td.note { max-width: 240px; overflow: hidden; text-overflow: ellipsis; color: var(--text-2); }
tr.clickable { cursor: pointer; }
tr.clickable:hover { background: var(--bg); }
.empty { padding: 48px 16px; margin: 0; text-align: center; color: var(--slate); }

/* forms */
.field { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 500; }
.field input, .field select, .field textarea, .filters select { min-height: 42px; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--r); background: var(--surface); color: var(--navy); font-size: 14px; font-weight: 400; }
.field :is(input, select, textarea):hover, .filters select:hover { border-color: var(--navy); }
.field :is(input, select, textarea):focus, .filters select:focus { outline: none; border: 2px solid var(--navy); padding: 9px 13px; box-shadow: 0 0 0 3px #0F172A18; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .wide { grid-column: 1 / -1; }
.form-error { color: var(--error-text); font-size: 12px; margin: 16px 0 0; }
.image-input { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.image-input img { max-width: 100%; max-height: 320px; border-radius: var(--r); border: 1px solid var(--border); }

/* modal */
.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: grid; place-items: center; padding: 16px; z-index: 10; }
.modal { background: var(--surface); border-radius: var(--r-md); box-shadow: var(--sh-lg); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; padding: 24px; }
.modal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
.modal footer .danger { margin-right: auto; }

/* dashboard */
.chart { position: relative; height: 280px; }
.health { margin-top: 16px; }
.bar { height: 8px; background: var(--divider); border-radius: 9999px; overflow: hidden; margin: 6px 0 4px; }
.bar > div { height: 100%; border-radius: 9999px; }
.bar .success { background: var(--success); }
.bar .warning { background: var(--warning); }
.bar .error { background: var(--error); }

@media (max-width: 767px) {
  .layout { grid-template-columns: 1fr; }
  .nav { position: fixed; top: auto; bottom: 0; left: 0; right: 0; height: auto; z-index: 5; flex-direction: row; justify-content: space-around; padding: 6px 4px; border-right: none; border-top: 1px solid var(--border); }
  .brand { display: none; }
  .nav a, .nav .logout { flex: 1; flex-direction: column; gap: 2px; padding: 6px 2px; margin: 0; font-size: 11px; line-height: 1.2; text-align: center; justify-content: center; }
  .main { padding: 16px 16px 96px; }
  .form-grid { grid-template-columns: 1fr; }
  h1 { font-size: 24px; }
}
```

- [ ] **Step 4: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test -- --passWithNoTests
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: exits 0, `dist/index.html` exists and references `/Tradetrack/assets/...`.

Run: `npm run dev` in the background, open `http://localhost:5173/Tradetrack/`.
Expected: white card with "TradeTrack" in Plus Jakarta Sans on `#F8FAFC` background.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "chore: scaffold Vite React app, theme and Pages deploy"
git push
```

---

### Task 2: Statistics (`stats.js`) with tests

**Files:**
- Create: `src/stats.js`, `src/stats.test.js`

**Interfaces:**
- Produces (all pure, no imports):
  - `localDate(d?: Date) => 'YYYY-MM-DD'`
  - `sortTrades(trades) => Trade[]` (date asc, then createdAt asc; does not mutate)
  - `balance(account, trades) => number`
  - `rMultiple(trade) => number | null`
  - `winRate(trades) => number | null` (0..1)
  - `profitFactor(trades) => number | Infinity | null`
  - `avgR(trades) => number | null`
  - `equityCurve(trades) => { date, value }[]`
  - `dailyLossRemaining(account, trades, today) => number | null`
  - `maxLossFloor(account, trades) => number | null`
  - `healthTone(used, limit) => 'success' | 'warning' | 'error'`
  - `netResult(cashflows) => { payouts, costs, net, roi }` (`roi` null when costs = 0)
- Trade shape: `{ id, date, symbol, side, lots, entry, exit, stopLoss, pnl, accountId, notes, screenshot, createdAt }`. Account shape: `{ id, firm, accountNo, size, status, dailyLossLimit, maxLossLimit, drawdownType, profitTarget, startDate, notes, createdAt }`. Cashflow shape: `{ id, type: 'payout'|'cost', date, accountId, amount, notes, createdAt }`.

- [ ] **Step 1: Write the failing tests** — `src/stats.test.js`

```js
import { describe, it, expect } from 'vitest';
import {
  localDate, sortTrades, balance, rMultiple, winRate, profitFactor, avgR,
  equityCurve, dailyLossRemaining, maxLossFloor, healthTone, netResult,
} from './stats';

const acc = { id: 'a1', size: 5000, dailyLossLimit: 250, maxLossLimit: 300, drawdownType: 'static' };
const t = (date, pnl, extra = {}) => ({ date, pnl, accountId: 'a1', createdAt: 0, ...extra });

describe('localDate', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('sortTrades', () => {
  it('sorts by date then createdAt without mutating', () => {
    const input = [t('2026-11-02', 1, { createdAt: 2 }), t('2026-11-01', 2), t('2026-11-02', 3, { createdAt: 1 })];
    expect(sortTrades(input).map(x => x.pnl)).toEqual([2, 3, 1]);
    expect(input[0].pnl).toBe(1);
  });
});

describe('balance', () => {
  it('adds only this account pnl to size', () => {
    const trades = [t('2026-11-01', 100), t('2026-11-01', -30), t('2026-11-01', 999, { accountId: 'other' })];
    expect(balance(acc, trades)).toBe(5070);
  });
});

describe('rMultiple', () => {
  it('buy winner', () => expect(rMultiple({ entry: 100, exit: 110, stopLoss: 95 })).toBe(2));
  it('sell winner', () => expect(rMultiple({ entry: 100, exit: 90, stopLoss: 105 })).toBe(2));
  it('sell loser', () => expect(rMultiple({ entry: 100, exit: 105, stopLoss: 110 })).toBe(-0.5));
  it('null without stop loss or when stop equals entry', () => {
    expect(rMultiple({ entry: 100, exit: 110, stopLoss: null })).toBeNull();
    expect(rMultiple({ entry: 100, exit: 110, stopLoss: 100 })).toBeNull();
  });
});

describe('winRate', () => {
  it('counts breakeven as a trade but not a win', () => {
    expect(winRate([t('d', 100), t('d', -50), t('d', 0)])).toBeCloseTo(1 / 3);
  });
  it('null with no trades', () => expect(winRate([])).toBeNull());
});

describe('profitFactor', () => {
  it('gross win / gross loss', () => expect(profitFactor([t('d', 100), t('d', 50), t('d', -50)])).toBe(3));
  it('Infinity with wins and no losses', () => expect(profitFactor([t('d', 100)])).toBe(Infinity));
  it('null with no wins and no losses', () => {
    expect(profitFactor([])).toBeNull();
    expect(profitFactor([t('d', 0)])).toBeNull();
  });
});

describe('avgR', () => {
  it('averages only trades with an R', () => {
    const trades = [
      { entry: 100, exit: 110, stopLoss: 95 },
      { entry: 100, exit: 95, stopLoss: 95 },
      { entry: 1, exit: 2, stopLoss: null },
    ];
    expect(avgR(trades)).toBe(0.5);
  });
  it('null when no trade has an R', () => expect(avgR([])).toBeNull());
});

describe('equityCurve', () => {
  it('cumulative pnl in date order', () => {
    expect(equityCurve([t('2026-11-02', 50), t('2026-11-01', 100)])).toEqual([
      { date: '2026-11-01', value: 100 },
      { date: '2026-11-02', value: 150 },
    ]);
  });
});

describe('dailyLossRemaining', () => {
  it('limit plus today pnl of this account', () => {
    const trades = [t('2026-11-16', -100), t('2026-11-16', 30), t('2026-11-15', -500), t('2026-11-16', -999, { accountId: 'x' })];
    expect(dailyLossRemaining(acc, trades, '2026-11-16')).toBe(180);
  });
  it('null without a daily limit', () => {
    expect(dailyLossRemaining({ ...acc, dailyLossLimit: null }, [], '2026-11-16')).toBeNull();
  });
});

describe('maxLossFloor', () => {
  it('static: size minus limit', () => expect(maxLossFloor(acc, [t('d', 900)])).toBe(4700));
  it('missing drawdownType behaves as static', () => {
    expect(maxLossFloor({ ...acc, drawdownType: null }, [t('d', 900)])).toBe(4700);
  });
  it('trailing follows the peak balance', () => {
    const a = { ...acc, drawdownType: 'trailing' };
    expect(maxLossFloor(a, [t('2026-11-01', 200), t('2026-11-02', -100)])).toBe(4900);
  });
  it('trailing locks at account size', () => {
    const a = { ...acc, drawdownType: 'trailing' };
    expect(maxLossFloor(a, [t('2026-11-01', 500)])).toBe(5000);
  });
  it('trailing with no trades equals static', () => {
    expect(maxLossFloor({ ...acc, drawdownType: 'trailing' }, [])).toBe(4700);
  });
  it('null without a max loss limit', () => {
    expect(maxLossFloor({ ...acc, maxLossLimit: null }, [])).toBeNull();
  });
});

describe('healthTone', () => {
  it('green under 50%, yellow 50-80%, red above 80%', () => {
    expect(healthTone(40, 100)).toBe('success');
    expect(healthTone(50, 100)).toBe('warning');
    expect(healthTone(80, 100)).toBe('warning');
    expect(healthTone(81, 100)).toBe('error');
  });
});

describe('netResult', () => {
  it('payouts minus costs and ROI', () => {
    const r = netResult([
      { type: 'payout', amount: 500 },
      { type: 'cost', amount: 100 },
      { type: 'cost', amount: 50 },
    ]);
    expect(r).toEqual({ payouts: 500, costs: 150, net: 350, roi: 350 / 150 });
  });
  it('roi null without costs', () => {
    expect(netResult([{ type: 'payout', amount: 500 }]).roi).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./stats"`.

- [ ] **Step 3: Implement `src/stats.js`**

```js
const sum = xs => xs.reduce((s, x) => s + x, 0);
const ofAccount = (trades, id) => trades.filter(t => t.accountId === id);

export function localDate(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const sortTrades = trades =>
  [...trades].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

export const balance = (account, trades) =>
  account.size + sum(ofAccount(trades, account.id).map(t => t.pnl));

export function rMultiple({ entry, exit, stopLoss }) {
  if (entry == null || exit == null || stopLoss == null || entry === stopLoss) return null;
  return (exit - entry) / (entry - stopLoss); // works for buy and sell: both signs flip together
}

export const winRate = trades =>
  trades.length ? trades.filter(t => t.pnl > 0).length / trades.length : null;

export function profitFactor(trades) {
  const win = sum(trades.filter(t => t.pnl > 0).map(t => t.pnl));
  const loss = -sum(trades.filter(t => t.pnl < 0).map(t => t.pnl));
  if (loss === 0) return win > 0 ? Infinity : null;
  return win / loss;
}

export function avgR(trades) {
  const rs = trades.map(rMultiple).filter(r => r != null);
  return rs.length ? sum(rs) / rs.length : null;
}

export function equityCurve(trades) {
  let total = 0;
  return sortTrades(trades).map(t => ({ date: t.date, value: (total += t.pnl) }));
}

export function dailyLossRemaining(account, trades, today) {
  if (account.dailyLossLimit == null) return null;
  const todays = ofAccount(trades, account.id).filter(t => t.date === today);
  return account.dailyLossLimit + sum(todays.map(t => t.pnl));
}

export function maxLossFloor(account, trades) {
  const { size, maxLossLimit, drawdownType } = account;
  if (maxLossLimit == null) return null;
  if (drawdownType !== 'trailing') return size - maxLossLimit;
  let bal = size;
  let peak = size;
  for (const t of sortTrades(ofAccount(trades, account.id))) peak = Math.max(peak, (bal += t.pnl));
  return Math.min(peak - maxLossLimit, size); // trailing floor stops at the starting balance
}

export function healthTone(used, limit) {
  const r = used / limit;
  return r < 0.5 ? 'success' : r <= 0.8 ? 'warning' : 'error';
}

export function netResult(cashflows) {
  const total = type => sum(cashflows.filter(c => c.type === type).map(c => c.amount));
  const payouts = total('payout');
  const costs = total('cost');
  return { payouts, costs, net: payouts - costs, roi: costs ? (payouts - costs) / costs : null };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit and push**

```bash
git add src/stats.js src/stats.test.js
git commit -m "feat: add trading statistics with tests"
git push
```

---

### Task 3: Firebase, data layer, UI kit and app shell

**Files:**
- Create: `src/firebase.js`, `src/data.js`, `src/ui.jsx`, `firestore.rules`, `src/pages/Dashboard.jsx`, `src/pages/Journal.jsx`, `src/pages/Accounts.jsx`, `src/pages/Cashflow.jsx` (placeholders)
- Modify: `src/App.jsx` (full replacement)

**Interfaces:**
- Consumes: CSS classes from Task 1.
- Produces:
  - `firebase.js`: `auth`, `db`, `login(): Promise`, `logout(): Promise`
  - `data.js`: `useData() => { accounts, trades, cashflows }` (arrays, always loaded when pages render); `add(name, data): Promise`, `update(name, id, data): Promise`, `remove(name, id): Promise` where `name` is `'accounts' | 'trades' | 'cashflows'`
  - `ui.jsx`: `money(n, signed?)`, `pct(n)`, `ratio(n)`, `rFmt(n)`, `tone(n) => 'pos'|'neg'|''`, `accountOptions(accounts) => [id, label][]`, `accountName(accounts, id) => string`, `rowProps(onOpen)`, `StatCard({ label, value, sub, className })`, `Modal({ title, onClose, children })`, `FormModal({ title, fields, initial, validate, onSubmit, onDelete, onClose })`
  - Field config: `{ name, label, type?: 'text'|'number'|'date'|'select'|'textarea'|'custom', required?, options?: [value, label][], placeholder?, wide?, render?: (value, setValue, setError) => JSX }`. `FormModal` parses `number` fields (comma or dot decimal) to numbers, empty → `null`; required `select` defaults to its first option; non-required `select` gets a `—` option meaning `null`.
  - Routes: `/` Dashboard, `/jurnal` Journal, `/akun` Accounts, `/cashflow` Cashflow (HashRouter, so URLs look like `#/jurnal`).

- [ ] **Step 1: User creates the Firebase project (manual, guided)**

Guide the user through, then collect the web config object:
1. https://console.firebase.google.com → Add project "tradetrack" (Analytics off).
2. Project overview → Add app → Web (`</>`), nickname "web", no Hosting. Copy the `firebaseConfig` object.
3. Build → Authentication → Get started → Sign-in method → Google → Enable.
4. Authentication → Settings → Authorized domains → Add `achmadhanifmufid-coder.github.io` (`localhost` is there by default).
5. Build → Firestore Database → Create database → production mode, region `asia-southeast2` (Jakarta).
6. Firestore → Rules → paste `firestore.rules` from Step 2 → Publish.

- [ ] **Step 2: Write `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

- [ ] **Step 3: Write `src/firebase.js`** — replace the config object with the one the user pasted in Step 1 (it is public by design; security comes from the rules)

```js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'FROM_USER_STEP_1',
  authDomain: 'FROM_USER_STEP_1',
  projectId: 'FROM_USER_STEP_1',
  storageBucket: 'FROM_USER_STEP_1',
  messagingSenderId: 'FROM_USER_STEP_1',
  appId: 'FROM_USER_STEP_1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const login = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);
```

- [ ] **Step 4: Write `src/data.js`**

```js
import { createContext, useContext, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const col = name => collection(db, 'users', auth.currentUser.uid, name);

export function useCollection(name) {
  const [state, setState] = useState({ items: null, error: null });
  useEffect(
    () =>
      onSnapshot(
        col(name),
        snap => setState({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null }),
        err => setState({ items: null, error: err.message }),
      ),
    [name],
  );
  return state;
}

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const add = (name, data) => addDoc(col(name), { ...data, createdAt: Date.now() });
export const update = (name, id, data) => updateDoc(doc(col(name), id), data);
export const remove = (name, id) => deleteDoc(doc(col(name), id));
```

- [ ] **Step 5: Write `src/ui.jsx`**

```jsx
import { useState } from 'react';
import { X } from 'lucide-react';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n, signed = false) => (n == null ? '—' : (signed && n > 0 ? '+' : '') + usd.format(n));
export const pct = n => (n == null ? '—' : `${(n * 100).toFixed(1)}%`);
export const ratio = n => (n == null ? '—' : n === Infinity ? '∞' : n.toFixed(2));
export const rFmt = n => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}R`);
export const tone = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');

export const accountOptions = accounts => accounts.map(a => [a.id, `${a.firm} · ${a.accountNo}`]);
export function accountName(accounts, id) {
  const a = accounts.find(x => x.id === id);
  return a ? `${a.firm} · ${a.accountNo}` : '—';
}

export const rowProps = onOpen => ({
  className: 'clickable',
  tabIndex: 0,
  onClick: onOpen,
  onKeyDown: e => e.key === 'Enter' && onOpen(),
});

export function StatCard({ label, value, sub, className = '' }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${className}`}>{value}</div>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Input({ field, value, onChange }) {
  const common = { id: field.name, value: value ?? '', placeholder: field.placeholder, onChange: e => onChange(e.target.value) };
  if (field.type === 'select')
    return (
      <select {...common}>
        {!field.required && <option value="">—</option>}
        {field.options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    );
  if (field.type === 'textarea') return <textarea rows={3} {...common} />;
  if (field.type === 'number') return <input type="text" inputMode="decimal" {...common} />;
  return <input type={field.type || 'text'} {...common} />;
}

const isEmpty = v => v == null || String(v).trim() === '';

export function FormModal({ title, fields, initial = {}, validate, onSubmit, onDelete, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map(f => [f.name, initial[f.name] ?? (f.type === 'select' && f.required ? f.options[0][0] : '')]),
    ),
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = name => v => setValues(s => ({ ...s, [name]: v }));

  async function submit(e) {
    e.preventDefault();
    const data = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.required && isEmpty(raw)) return setError(`${f.label} wajib diisi.`);
      if (isEmpty(raw)) data[f.name] = null;
      else if (f.type === 'number') {
        const n = Number(String(raw).replace(',', '.'));
        if (!Number.isFinite(n)) return setError(`${f.label} harus berupa angka.`);
        data[f.name] = n;
      } else data[f.name] = typeof raw === 'string' ? raw.trim() : raw;
    }
    const msg = validate?.(data);
    if (msg) return setError(msg);
    setBusy(true);
    try {
      // shortcut: offline saves wait here until reconnect; fine for single-user online use
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(`Gagal menyimpan: ${err.message}`);
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm('Hapus data ini? Tindakan ini tidak bisa dibatalkan.')) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(`Gagal menghapus: ${err.message}`);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          {fields.map(f => (
            <label key={f.name} className={`field ${f.wide ? 'wide' : ''}`} htmlFor={f.type === 'custom' ? undefined : f.name}>
              <span>{f.label}{f.required && ' *'}</span>
              {f.type === 'custom'
                ? f.render(values[f.name], set(f.name), setError)
                : <Input field={f} value={values[f.name]} onChange={set(f.name)} />}
            </label>
          ))}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <footer>
          {onDelete && (
            <button type="button" className="btn danger" onClick={del} disabled={busy}>Hapus</button>
          )}
          <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>Batal</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </footer>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 6: Write placeholder pages**

`src/pages/Dashboard.jsx`:
```jsx
export default function Dashboard() {
  return <h1>Dasbor</h1>;
}
```
`src/pages/Journal.jsx`:
```jsx
export default function Journal() {
  return <h1>Jurnal</h1>;
}
```
`src/pages/Accounts.jsx`:
```jsx
export default function Accounts() {
  return <h1>Akun</h1>;
}
```
`src/pages/Cashflow.jsx`:
```jsx
export default function Cashflow() {
  return <h1>Payout &amp; Biaya</h1>;
}
```

- [ ] **Step 7: Replace `src/App.jsx`**

```jsx
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
```

- [ ] **Step 8: Verify in the browser**

Run: `npm run dev` (background). Open `http://localhost:5173/Tradetrack/`.
Expected:
- Sign-in card shows; "Masuk dengan Google" opens the Google popup; after login the sidebar shows 4 links + Keluar, and each link shows its page title with no "Gagal memuat data" error.
- At 375px width the nav is a bottom bar with 5 icon+label items and no horizontal scroll.
- Keluar returns to the sign-in card.

Run: `npm run build` → exits 0.

- [ ] **Step 9: Commit and push**

```bash
git add -A
git commit -m "feat: add Firebase auth, Firestore data layer, UI kit and app shell"
git push
```

---

### Task 4: Accounts page

**Files:**
- Modify: `src/pages/Accounts.jsx` (full replacement)

**Interfaces:**
- Consumes: `useData`, `add`, `update`, `remove` (data.js); `balance` (stats.js); `FormModal`, `money`, `rowProps` (ui.jsx).
- Produces: `STATUS` export `{ evaluasi, funded, lolos, gagal }` → `[label, chipTone]`; accounts stored with fields `firm, accountNo, size, status, dailyLossLimit, maxLossLimit, drawdownType ('static'|'trailing'), profitTarget, startDate, notes`.

- [ ] **Step 1: Write `src/pages/Accounts.jsx`**

```jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { balance } from '../stats';
import { FormModal, money, rowProps } from '../ui';

export const STATUS = {
  evaluasi: ['Evaluasi', 'info'],
  funded: ['Funded', 'success'],
  lolos: ['Lolos', 'success'],
  gagal: ['Gagal', 'error'],
};

const FIELDS = [
  { name: 'firm', label: 'Prop firm', required: true, placeholder: 'FTMO, FundedNext…' },
  { name: 'accountNo', label: 'ID akun', required: true },
  { name: 'size', label: 'Ukuran akun ($)', type: 'number', required: true, placeholder: '5000' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: Object.entries(STATUS).map(([v, [l]]) => [v, l]) },
  { name: 'dailyLossLimit', label: 'Batas rugi harian ($)', type: 'number', placeholder: '250' },
  { name: 'maxLossLimit', label: 'Batas rugi maksimum ($)', type: 'number', placeholder: '500' },
  { name: 'drawdownType', label: 'Jenis drawdown', type: 'select', required: true, options: [['static', 'Statis'], ['trailing', 'Trailing (terkunci di modal awal)']] },
  { name: 'profitTarget', label: 'Target profit ($)', type: 'number' },
  { name: 'startDate', label: 'Tanggal mulai', type: 'date' },
  { name: 'notes', label: 'Catatan', type: 'textarea', wide: true, placeholder: 'Aturan, pembagian profit…' },
];

function validate(d) {
  if (d.size <= 0) return 'Ukuran akun harus lebih dari 0.';
  for (const k of ['dailyLossLimit', 'maxLossLimit', 'profitTarget'])
    if (d[k] != null && d[k] <= 0) return `${FIELDS.find(f => f.name === k).label} harus lebih dari 0.`;
  return null;
}

export default function Accounts() {
  const { accounts, trades } = useData();
  const [editing, setEditing] = useState(null);
  const sorted = [...accounts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Akun</h1>
          <p className="sub">Akun prop firm dan batas risikonya.</p>
        </div>
        <button className="btn" onClick={() => setEditing({})}>
          <Plus size={16} /> Tambah akun
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prop firm</th><th>ID akun</th><th className="num">Ukuran</th><th className="num">Saldo</th>
              <th>Status</th><th className="num">Target</th><th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => (
              <tr key={a.id} {...rowProps(() => setEditing(a))}>
                <td>{a.firm}</td>
                <td className="mono">{a.accountNo}</td>
                <td className="num">{money(a.size)}</td>
                <td className="num">{money(balance(a, trades))}</td>
                <td><span className={`chip ${STATUS[a.status][1]}`}>{STATUS[a.status][0]}</span></td>
                <td className="num">{money(a.profitTarget)}</td>
                <td className="note">{a.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length && <p className="empty">Belum ada akun. Tambahkan akun prop firm pertamamu.</p>}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? 'Edit akun' : 'Akun baru'}
          fields={FIELDS}
          initial={editing}
          validate={validate}
          onSubmit={d => (editing.id ? update('accounts', editing.id, d) : add('accounts', d))}
          onDelete={editing.id ? () => remove('accounts', editing.id) : null}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify in the browser**

On `#/akun`:
- Empty state text shows. "Tambah akun" with empty form → "Prop firm wajib diisi." and the modal stays open.
- Size `abc` → "Ukuran akun ($) harus berupa angka."; size `5000`, daily `250`, max `500` → saves, row appears with Saldo `$5,000.00` and blue EVALUASI chip.
- Decimal comma `250,5` saves as 250.5.
- Click row → form prefilled; change status to Funded → chip turns green. Hapus → confirm → row disappears.
- Firebase console shows the doc under `users/{uid}/accounts`.

- [ ] **Step 3: Commit and push**

```bash
git add src/pages/Accounts.jsx
git commit -m "feat: add accounts page"
git push
```

---

### Task 5: Journal page with screenshots

**Files:**
- Create: `src/image.js`
- Modify: `src/pages/Journal.jsx` (full replacement)

**Interfaces:**
- Consumes: `useData`, `add`, `update`, `remove`; `localDate`, `rMultiple`; `FormModal`, `money`, `rFmt`, `tone`, `rowProps`, `accountName`, `accountOptions`.
- Produces: `compressImage(file: File) => Promise<string>` (JPEG data URL ≤ 400,000 chars, throws `Error` with Indonesian message); trades stored with `date, symbol (uppercase), side ('buy'|'sell'), lots, entry, exit, stopLoss, pnl, accountId, notes, screenshot`.

- [ ] **Step 1: Write `src/image.js`**

```js
const MAX_CHARS = 400_000; // Firestore docs are capped at 1 MB; leaves room for the other fields
const MAX_SIDE = 1600;

export async function compressImage(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  for (let q = 0.8; q >= 0.3; q -= 0.1) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('Gambar terlalu besar. Crop dulu lalu coba lagi.');
}
```

- [ ] **Step 2: Write `src/pages/Journal.jsx`**

```jsx
import { useState } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { localDate, rMultiple } from '../stats';
import { compressImage } from '../image';
import { FormModal, accountName, accountOptions, money, rFmt, rowProps, tone } from '../ui';

const SIDES = [['buy', 'Buy'], ['sell', 'Sell']];

function ImageInput({ value, onChange, onError }) {
  async function pick(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      onChange(await compressImage(file));
    } catch (err) {
      onError(err.message);
    }
  }
  return (
    <div className="image-input">
      {value && <img src={value} alt="Screenshot trade" />}
      <input type="file" accept="image/*" onChange={pick} aria-label="Pilih screenshot" />
      {value && (
        <button type="button" className="btn ghost sm" onClick={() => onChange('')}>Hapus gambar</button>
      )}
    </div>
  );
}

const fieldsFor = accounts => [
  { name: 'date', label: 'Tanggal', type: 'date', required: true },
  { name: 'symbol', label: 'Simbol', required: true, placeholder: 'XAUUSD' },
  { name: 'side', label: 'Arah', type: 'select', required: true, options: SIDES },
  { name: 'lots', label: 'Lot', type: 'number', placeholder: '0.1' },
  { name: 'entry', label: 'Harga entry', type: 'number' },
  { name: 'exit', label: 'Harga exit', type: 'number' },
  { name: 'stopLoss', label: 'Stop loss', type: 'number' },
  { name: 'pnl', label: 'Profit / rugi ($)', type: 'number', required: true, placeholder: 'contoh: 250 atau -120' },
  { name: 'accountId', label: 'Akun', type: 'select', options: accountOptions(accounts) },
  { name: 'notes', label: 'Catatan', type: 'textarea', wide: true, placeholder: 'Setup, eksekusi, kesalahan, emosi…' },
  {
    name: 'screenshot', label: 'Screenshot', type: 'custom', wide: true,
    render: (value, set, setError) => <ImageInput value={value} onChange={set} onError={setError} />,
  },
];

const validate = d =>
  d.entry != null && d.entry === d.stopLoss ? 'Stop loss tidak boleh sama dengan harga entry.' : null;

export default function Journal() {
  const { accounts, trades } = useData();
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ accountId: '', month: '', side: '' });
  const months = [...new Set(trades.map(t => t.date.slice(0, 7)))].sort().reverse();
  const shown = trades
    .filter(t =>
      (!filter.accountId || t.accountId === filter.accountId) &&
      (!filter.month || t.date.startsWith(filter.month)) &&
      (!filter.side || t.side === filter.side))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const onFilter = key => e => setFilter(f => ({ ...f, [key]: e.target.value }));
  const newTrade = () => setEditing({ date: localDate(), accountId: accounts.length === 1 ? accounts[0].id : '' });

  function save(d) {
    const data = { ...d, symbol: d.symbol.toUpperCase() };
    return editing.id ? update('trades', editing.id, data) : add('trades', data);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Jurnal</h1>
          <p className="sub">Catat setiap trade. Statistik dihitung otomatis.</p>
        </div>
        <button className="btn" onClick={newTrade}>
          <Plus size={16} /> Tambah trade
        </button>
      </div>
      <div className="filters">
        <select aria-label="Filter akun" value={filter.accountId} onChange={onFilter('accountId')}>
          <option value="">Semua akun</option>
          {accountOptions(accounts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Filter bulan" value={filter.month} onChange={onFilter('month')}>
          <option value="">Semua bulan</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label="Filter arah" value={filter.side} onChange={onFilter('side')}>
          <option value="">Semua arah</option>
          {SIDES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th><th>Simbol</th><th>Arah</th><th className="num">Lot</th><th className="num">Entry</th>
              <th className="num">Exit</th><th className="num">R</th><th className="num">P/L</th><th>Akun</th>
              <th><span className="sr-only">Screenshot</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(t => (
              <tr key={t.id} {...rowProps(() => setEditing(t))}>
                <td className="mono">{t.date}</td>
                <td>{t.symbol}</td>
                <td><span className={`chip ${t.side === 'buy' ? 'success' : 'error'}`}>{t.side === 'buy' ? 'Buy' : 'Sell'}</span></td>
                <td className="num">{t.lots ?? '—'}</td>
                <td className="num">{t.entry ?? '—'}</td>
                <td className="num">{t.exit ?? '—'}</td>
                <td className="num">{rFmt(rMultiple(t))}</td>
                <td className={`num ${tone(t.pnl)}`}>{money(t.pnl, true)}</td>
                <td>{accountName(accounts, t.accountId)}</td>
                <td>{t.screenshot && <ImageIcon size={16} aria-label="Ada screenshot" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <p className="empty">{trades.length ? 'Tidak ada trade untuk filter ini.' : 'Belum ada trade. Catat trade pertamamu.'}</p>
        )}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? 'Edit trade' : 'Trade baru'}
          fields={fieldsFor(accounts)}
          initial={editing}
          validate={validate}
          onSubmit={save}
          onDelete={editing.id ? () => remove('trades', editing.id) : null}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Add the `.sr-only` utility to `src/theme.css`** (append after the `.mono, .num` rule)

```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```

- [ ] **Step 4: Verify in the browser**

On `#/jurnal` (with one account from Task 4):
- "Tambah trade" opens with today's date and the single account preselected.
- Buy XAUUSD, lot `0,1`, entry `3892`, exit `3902`, SL `3882`, P/L `101.2` → row shows `+1.00R`, `+$101.20` in green, symbol uppercase.
- Entry = SL → "Stop loss tidak boleh sama dengan harga entry."
- Attach a large screenshot (e.g. a 4K PNG) → preview appears; save; the row shows the image icon; reopen shows the image. Firestore doc `screenshot` string length ≤ 400,000.
- Filters by account / month / side narrow the table; "Tidak ada trade untuk filter ini." when empty.
- Account page Saldo now shows `$5,101.20`.
- Edit and delete a trade work.

- [ ] **Step 5: Commit and push**

```bash
git add src/image.js src/pages/Journal.jsx src/theme.css
git commit -m "feat: add trade journal with screenshots"
git push
```

---

### Task 6: Payout & Biaya page

**Files:**
- Modify: `src/pages/Cashflow.jsx` (full replacement)

**Interfaces:**
- Consumes: `useData`, `add`, `update`, `remove`; `localDate`, `netResult`; `FormModal`, `StatCard`, `accountName`, `accountOptions`, `money`, `pct`, `rowProps`, `tone`.
- Produces: cashflows stored with `type ('payout'|'cost'), date, accountId, amount (> 0), notes`.

- [ ] **Step 1: Write `src/pages/Cashflow.jsx`**

```jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { localDate, netResult } from '../stats';
import { FormModal, StatCard, accountName, accountOptions, money, pct, rowProps, tone } from '../ui';

const TYPES = { payout: ['Payout', 'success'], cost: ['Biaya', 'warning'] };

const fieldsFor = accounts => [
  { name: 'type', label: 'Tipe', type: 'select', required: true, options: Object.entries(TYPES).map(([v, [l]]) => [v, l]) },
  { name: 'date', label: 'Tanggal', type: 'date', required: true },
  { name: 'amount', label: 'Jumlah ($)', type: 'number', required: true },
  { name: 'accountId', label: 'Akun', type: 'select', options: accountOptions(accounts) },
  { name: 'notes', label: 'Catatan', type: 'textarea', wide: true, placeholder: 'Biaya challenge, reset, payout ke-1…' },
];

const validate = d => (d.amount <= 0 ? 'Jumlah harus lebih dari 0.' : null);

export default function Cashflow() {
  const { accounts, cashflows } = useData();
  const [editing, setEditing] = useState(null);
  const r = netResult(cashflows);
  const sorted = [...cashflows].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Payout &amp; Biaya</h1>
          <p className="sub">Biaya challenge dan payout yang diterima.</p>
        </div>
        <button className="btn" onClick={() => setEditing({ date: localDate() })}>
          <Plus size={16} /> Tambah catatan
        </button>
      </div>
      <div className="grid">
        <StatCard label="Total biaya" value={money(r.costs)} />
        <StatCard label="Total payout" value={money(r.payouts)} />
        <StatCard label="Hasil bersih" value={money(r.net, true)} className={tone(r.net)} sub="payout − biaya" />
        <StatCard label="ROI" value={pct(r.roi)} className={tone(r.roi)} sub="hasil bersih / biaya" />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Tanggal</th><th>Tipe</th><th>Akun</th><th className="num">Jumlah</th><th>Catatan</th></tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} {...rowProps(() => setEditing(c))}>
                <td className="mono">{c.date}</td>
                <td><span className={`chip ${TYPES[c.type][1]}`}>{TYPES[c.type][0]}</span></td>
                <td>{accountName(accounts, c.accountId)}</td>
                <td className={`num ${c.type === 'payout' ? 'pos' : 'neg'}`}>
                  {money(c.type === 'payout' ? c.amount : -c.amount, true)}
                </td>
                <td className="note">{c.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cashflows.length && <p className="empty">Belum ada catatan. Catat biaya challenge pertamamu.</p>}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? 'Edit catatan' : 'Catatan baru'}
          fields={fieldsFor(accounts)}
          initial={editing}
          validate={validate}
          onSubmit={d => (editing.id ? update('cashflows', editing.id, d) : add('cashflows', d))}
          onDelete={editing.id ? () => remove('cashflows', editing.id) : null}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify in the browser**

On `#/cashflow`:
- Add Biaya `$59` → Total biaya `$59.00`, Hasil bersih `-$59.00` red, ROI `-100.0%`.
- Add Payout `$400` → Hasil bersih `+$341.00` green, ROI `578.0%`.
- Amount `0` → "Jumlah harus lebih dari 0."
- Edit and delete work.

- [ ] **Step 3: Commit and push**

```bash
git add src/pages/Cashflow.jsx
git commit -m "feat: add payout and cost tracker"
git push
```

---

### Task 7: Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx` (full replacement)

**Interfaces:**
- Consumes: `useData`; `localDate`, `winRate`, `profitFactor`, `avgR`, `equityCurve`, `balance`, `dailyLossRemaining`, `maxLossFloor`, `healthTone`, `netResult`; `StatCard`, `accountOptions`, `money`, `pct`, `ratio`, `rFmt`, `tone`.

- [ ] **Step 1: Write `src/pages/Dashboard.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryScale, Chart, Filler, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useData } from '../data';
import {
  avgR, balance, dailyLossRemaining, equityCurve, healthTone, localDate, maxLossFloor, netResult, profitFactor, winRate,
} from '../stats';
import { StatCard, accountOptions, money, pct, rFmt, ratio, tone } from '../ui';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

function EquityChart({ points }) {
  const ref = useRef(null);
  useEffect(() => {
    const chart = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          data: points.map(p => p.value),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.08)',
          fill: true,
          tension: 0.2,
          pointRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => money(c.parsed.y, true) } } },
        scales: { y: { ticks: { callback: v => money(v) } }, x: { ticks: { maxTicksLimit: 8 } } },
      },
    });
    return () => chart.destroy();
  }, [points]);
  return (
    <div className="chart">
      <canvas ref={ref} role="img" aria-label="Kurva ekuitas: P/L kumulatif" />
    </div>
  );
}

function Limit({ label, remaining, limit }) {
  const used = Math.max(0, limit - remaining);
  return (
    <div className="health">
      <div className="stat-label">{label}</div>
      <div className="bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <div className={healthTone(used, limit)} style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
      </div>
      <p className="stat-sub">Sisa <span className="mono">{money(remaining)}</span> dari {money(limit)}</p>
    </div>
  );
}

function Health({ account, trades }) {
  const bal = balance(account, trades);
  const daily = dailyLossRemaining(account, trades, localDate());
  const floor = maxLossFloor(account, trades);
  return (
    <div className="card">
      <h3>{account.firm} · {account.accountNo}</h3>
      <p className="stat-sub">Saldo <span className="mono">{money(bal)}</span></p>
      {daily != null && <Limit label="Batas rugi harian" remaining={daily} limit={account.dailyLossLimit} />}
      {floor != null && <Limit label="Batas rugi maksimum" remaining={bal - floor} limit={account.maxLossLimit} />}
      {daily == null && floor == null && <p className="stat-sub">Isi batas rugi di halaman Akun untuk memantau risiko.</p>}
    </div>
  );
}

export default function Dashboard() {
  const { accounts, trades, cashflows } = useData();
  const [accountId, setAccountId] = useState('');
  const [period, setPeriod] = useState('month');
  const month = localDate().slice(0, 7);
  const inScope = x => (!accountId || x.accountId === accountId) && (period === 'all' || x.date.startsWith(month));
  const scoped = trades.filter(inScope);
  const net = netResult(cashflows.filter(inScope));
  const total = scoped.reduce((s, t) => s + t.pnl, 0);
  const points = useMemo(() => equityCurve(scoped), [trades, accountId, period, month]);
  const active = accounts.filter(a => ['evaluasi', 'funded'].includes(a.status) && (!accountId || a.id === accountId));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dasbor</h1>
          <p className="sub">Ringkasan performa dan risiko akun.</p>
        </div>
        <div className="filters" style={{ margin: 0 }}>
          <select aria-label="Filter akun" value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="">Semua akun</option>
            {accountOptions(accounts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Periode" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="month">Bulan ini</option>
            <option value="all">Seluruh waktu</option>
          </select>
        </div>
      </div>
      <div className="grid">
        <StatCard label="P/L" value={money(total, true)} className={tone(total)} sub={`${scoped.length} trade`} />
        <StatCard label="Win rate" value={pct(winRate(scoped))} />
        <StatCard label="Profit factor" value={ratio(profitFactor(scoped))} />
        <StatCard label="R rata-rata" value={rFmt(avgR(scoped))} />
        <StatCard label="Hasil bersih" value={money(net.net, true)} className={tone(net.net)} sub="payout − biaya" />
      </div>
      <div className="card">
        <div className="stat-label">Kurva ekuitas</div>
        {points.length ? <EquityChart points={points} /> : <p className="empty">Belum ada trade di periode ini.</p>}
      </div>
      <h2>Kesehatan akun</h2>
      {active.length ? (
        <div className="grid">
          {active.map(a => <Health key={a.id} account={a} trades={trades} />)}
        </div>
      ) : (
        <p className="sub">Tidak ada akun aktif (Evaluasi atau Funded).</p>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify in the browser**

On `#/` with the data from Tasks 4–6:
- Bulan ini: P/L `+$101.20`, Win rate `100.0%`, Profit factor `∞`, R rata-rata `+1.00R`, Hasil bersih matches the Payout & Biaya page.
- Equity curve renders a sage line; tooltip shows `+$101.20`.
- Add a losing trade today of `-150` on an account with daily limit 250 → daily bar ~60% yellow, "Sisa $100.00 dari $250.00". Add another `-60` → red.
- Switch account / period filters → numbers and chart update.
- At 375px: cards stack, chart fits, no horizontal scroll.

- [ ] **Step 3: Run tests and build**

Run: `npm test && npm run build`
Expected: all tests pass, build exits 0.

- [ ] **Step 4: Commit and push**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: add dashboard with equity curve and account health"
git push
```

---

### Task 8: Go live

**Files:** none (configuration + verification)

- [ ] **Step 1: User enables GitHub Pages**

GitHub repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

- [ ] **Step 2: Trigger and watch the deploy**

```bash
git commit --allow-empty -m "chore: trigger first Pages deploy"
git push
```
Check the Actions tab (or `https://github.com/achmadhanifmufid-coder/Tradetrack/actions`) until the "Deploy" run is green.

- [ ] **Step 3: Verify the live site**

Open `https://achmadhanifmufid-coder.github.io/Tradetrack/`:
- Google login works (if it fails with `auth/unauthorized-domain`, recheck Task 3 Step 1.4).
- Data from local testing appears (same Firestore project).
- Hard-refresh on `#/jurnal` stays on Jurnal.
- Open on a phone: bottom nav, add one trade from the phone, it appears on the laptop without refresh.
