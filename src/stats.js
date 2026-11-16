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
