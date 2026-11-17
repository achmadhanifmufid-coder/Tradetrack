import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryScale, Chart, Filler, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { useData } from '../data';
import {
  avgR, balance, dailyLossRemaining, equityCurve, healthTone, localDate, maxLossFloor, netResult, profitFactor, winRate,
} from '../stats';
import { useT } from '../i18n';
import { StatCard, accountOptions, money, pct, rFmt, ratio, tone } from '../ui';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

function EquityChart({ points }) {
  const t = useT();
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
      <canvas ref={ref} role="img" aria-label={t('dash.equityAria')} />
    </div>
  );
}

function Limit({ label, remaining, limit }) {
  const t = useT();
  const used = Math.max(0, limit - remaining);
  return (
    <div className="health">
      <div className="stat-label">{label}</div>
      <div className="bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <div className={healthTone(used, limit)} style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
      </div>
      <p className="stat-sub">{t('dash.left')} <span className="mono">{money(remaining)}</span> {t('dash.of')} {money(limit)}</p>
    </div>
  );
}

function Health({ account, trades }) {
  const t = useT();
  const bal = balance(account, trades);
  const daily = dailyLossRemaining(account, trades, localDate());
  const floor = maxLossFloor(account, trades);
  return (
    <div className="card">
      <h3>{account.firm} · {account.accountNo}</h3>
      <p className="stat-sub">{t('accounts.balance')} <span className="mono">{money(bal)}</span></p>
      {daily != null && <Limit label={t('dash.daily')} remaining={daily} limit={account.dailyLossLimit} />}
      {floor != null && <Limit label={t('dash.max')} remaining={bal - floor} limit={account.maxLossLimit} />}
      {daily == null && floor == null && <p className="stat-sub">{t('dash.setLimits')}</p>}
    </div>
  );
}

export default function Dashboard() {
  const t = useT();
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
          <h1>{t('nav.dashboard')}</h1>
          <p className="sub">{t('dash.sub')}</p>
        </div>
        <div className="filters" style={{ margin: 0 }}>
          <select aria-label={t('filterAccount')} value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="">{t('allAccounts')}</option>
            {accountOptions(accounts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label={t('dash.period')} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="month">{t('dash.month')}</option>
            <option value="all">{t('dash.all')}</option>
          </select>
        </div>
      </div>
      <div className="grid">
        <StatCard label="P/L" value={money(total, true)} className={tone(total)} sub={t('tradeCount', { n: scoped.length })} />
        <StatCard label={t('dash.winRate')} value={pct(winRate(scoped))} />
        <StatCard label={t('dash.pf')} value={ratio(profitFactor(scoped))} />
        <StatCard label={t('dash.avgR')} value={rFmt(avgR(scoped))} />
        <StatCard label={t('net')} value={money(net.net, true)} className={tone(net.net)} sub={t('netSub')} />
      </div>
      <div className="card">
        <div className="stat-label">{t('dash.equity')}</div>
        {points.length ? <EquityChart points={points} /> : <p className="empty">{t('dash.noTrades')}</p>}
      </div>
      <h2>{t('dash.health')}</h2>
      {active.length ? (
        <div className="grid">
          {active.map(a => <Health key={a.id} account={a} trades={trades} />)}
        </div>
      ) : (
        <p className="sub">{t('dash.noActive')}</p>
      )}
    </>
  );
}
