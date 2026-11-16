# TradeTrack — Design Spec

Date: 2026-11-16
Status: approved in brainstorming, pending spec review

## Goal

A personal trading journal for prop firm accounts: a leaner version of FundedOS (fundedos.xyz). One user, Indonesian UI, USD amounts. Styled with the Verdana Health design system (`docs/DESIGN.md`).

## Reference analysis (FundedOS)

FundedOS has 12 menus: Dashboard, Trading accounts (~20 fields incl. timezone, session reset hour, consistency rule, payout buffer), Journal (trade form + equity curve, win rate, profit factor, avg R, streaks, drawdown map), Payout tracker, Cost tracker, Funding history, Trading targets, Backtesting, Reports, Data & backup, Calendar, Risk & alerts. Many overlap.

**Kept:** journal + stats, accounts + risk limits, payouts + costs.
**Dropped:** calendar, backtesting, separate monthly reports, funding history, separate targets page, CSV import, timezone / reset hour, consistency rule, payout buffer, payout status workflow (pending/rejected), auto-generated charts, streak stats, drawdown map, manual balance / floating P/L entry.

## Stack

- Vite + React (JavaScript), `react-router-dom` (HashRouter, so GitHub Pages needs no 404 rewrite)
- Firebase Auth (Google sign-in) + Firestore with offline persistence
- `chart.js` for the equity curve, `lucide-react` for icons (design system asks for icons next to labels)
- Vitest for `stats.js`
- No Firebase Storage (needs paid Blaze plan): screenshots are compressed in the browser and stored inside the trade document

## Pages

Sidebar on desktop, bottom nav under 768px.

1. **Dasbor** — filters: account (all / one), period (this month / all time). Stat cards: P/L for period, win rate, profit factor, avg R, net result (payouts − costs). Equity curve. "Kesehatan akun" card per active account (status Evaluasi or Funded): remaining daily loss limit and distance to max-loss floor as progress bars.
2. **Jurnal** — "Tambah trade" button; filters: account, month, side. Table: date, symbol, side, lots, entry, exit, R, P/L, account. Row click opens edit modal with delete.
   Trade form: date*, symbol*, side* (Buy/Sell), lots, entry, exit, stop loss, P/L ($)*, account, notes, 1 screenshot. (* = required)
3. **Akun** — table of accounts with computed balance and status chip. Form: prop firm*, account ID*, size*, status* (Evaluasi / Funded / Lolos / Gagal), daily loss limit, max loss limit, drawdown type (Statis / Trailing), profit target, start date, notes.
4. **Payout & Biaya** — one table of cashflows. Form: type* (Payout / Biaya), date*, account, amount*, notes. Summary cards: total costs, total payouts, net result, ROI.

## Data model (Firestore)

All under `users/{uid}/`. Security rules: `request.auth.uid == uid` for read and write, everything else denied.

- `accounts/{id}`: `firm, accountNo, size, status, dailyLossLimit, maxLossLimit, drawdownType, profitTarget, startDate, notes, createdAt`
- `trades/{id}`: `date (YYYY-MM-DD), symbol, side ('buy'|'sell'), lots, entry, exit, stopLoss, pnl, accountId, notes, screenshot (data URL or null), createdAt`
- `cashflows/{id}`: `type ('payout'|'cost'), date, accountId, amount (positive), notes, createdAt`

Numbers stored as numbers; empty optional fields stored as `null`. Dates stored as `YYYY-MM-DD` strings in the user's local date.

Screenshot: resized to max 1600px on the long side, JPEG, quality lowered until the data URL is ≤ 400,000 characters (~300 KB image; Firestore doc limit is 1 MB). If it can't get under that, the form shows an error.

## Calculations (`src/stats.js`, pure functions, computed on read, never stored)

- **Balance** = size + Σ pnl of the account's trades
- **R** = (exit − entry) / (entry − stopLoss), same formula for buy and sell (both signs flip together). `null` if entry, exit or stopLoss missing, or entry == stopLoss
- **Win rate** = count(pnl > 0) / count(trades). Breakeven (pnl = 0) counts as a trade, not a win
- **Profit factor** = Σ positive pnl / |Σ negative pnl|; `Infinity` when there are no losses, `null` when no trades
- **Avg R** = mean of non-null R values
- **Equity curve** = cumulative pnl, trades sorted by date then createdAt
- **Daily loss remaining** = dailyLossLimit + Σ pnl of today's trades (today = local date). Only shown if dailyLossLimit is set
- **Max-loss floor**:
  - Statis: size − maxLossLimit
  - Trailing: min(peakBalance − maxLossLimit, size), where peakBalance is the highest running balance (starting at size)
- **Distance to floor** = balance − floor
- **Health color** by share of the limit used: < 50% green, 50–80% yellow, > 80% red
- **Net result** = Σ payouts − Σ costs; **ROI** = net / Σ costs, `null` when costs = 0

## Code layout

```
src/
  main.jsx, App.jsx        routing, auth gate, layout (sidebar / bottom nav)
  firebase.js              init, signIn, signOut, auth listener
  data.js                  useCollection(name) realtime hook, add/update/remove
  stats.js (+ stats.test.js)
  image.js                 screenshot compression
  theme.css                Verdana Health tokens + base styles
  ui.jsx                   formatters, StatCard, Modal, FormModal (config-driven forms)
  pages/                   Dashboard, Journal, Accounts, Cashflow
```

## Error handling

- Form validation: required fields, numeric fields parse to finite numbers, stop loss ≠ entry.
- Save failure: red error text in the modal, form keeps its values.
- Delete always asks for confirmation.
- Logged out: only the sign-in screen is shown.

## Testing

- Vitest unit tests for every function in `stats.js` (including trailing floor locking at size, empty data, no-loss profit factor).
- Manual browser check at desktop and 375px width: add / edit / delete for each entity, stats update live.

## Deploy

- GitHub Actions workflow: on push to `main`, `npm ci && npm run build`, publish `dist/` to GitHub Pages.
- Vite `base: '/Tradetrack/'`. URL: `https://achmadhanifmufid-coder.github.io/Tradetrack/`
- Firebase web config lives in `src/firebase.js` (it is public by design; security comes from Firestore rules).
- Firestore rules kept in `firestore.rules` in the repo; user pastes them into the Firebase console.
- Commit and push after each completed implementation step.

## One-time setup by the user

1. Create a Firebase project, add a Web app, copy its config.
2. Enable Authentication → Google.
3. Create a Firestore database, paste `firestore.rules`.
4. Add `achmadhanifmufid-coder.github.io` to Authentication → Authorized domains.
5. GitHub repo → Settings → Pages → Source: GitHub Actions.
