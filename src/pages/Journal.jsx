import { useState } from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { localDate, rMultiple } from '../stats';
import { compressImage } from '../image';
import { useT } from '../i18n';
import { FormModal, accountName, accountOptions, isHttpUrl, money, rFmt, rowProps, tone } from '../ui';

const SIDES = [['buy', 'Buy'], ['sell', 'Sell']];

function ImageInput({ value, onChange, onError }) {
  const t = useT();
  async function pick(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      onChange(await compressImage(file));
    } catch (err) {
      onError(t(err.message));
    }
  }
  return (
    <div className="image-input">
      {value && <img src={value} alt={t('journal.screenshot')} />}
      <input type="file" accept="image/*" onChange={pick} aria-label={t('journal.pickImage')} />
      {value && (
        <button type="button" className="btn ghost sm" onClick={() => onChange('')}>{t('journal.removeImage')}</button>
      )}
    </div>
  );
}

// Links sit inside a clickable row: stop the click/Enter from also opening the edit form.
const stop = e => e.stopPropagation();
function SetupLinks({ trade }) {
  const links = [['Before', trade.beforeUrl], ['After', trade.afterUrl]].filter(([, url]) => isHttpUrl(url));
  if (!links.length) return null;
  return (
    <span className="links">
      {links.map(([label, url]) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer" onClick={stop} onKeyDown={stop}>{label} ↗</a>
      ))}
    </span>
  );
}

const fieldsFor = (accounts, setups, t) => [
  { name: 'date', label: t('date'), type: 'date', required: true },
  { name: 'symbol', label: t('journal.symbol'), required: true, placeholder: 'XAUUSD' },
  { name: 'side', label: t('journal.side'), type: 'select', required: true, options: SIDES },
  { name: 'lots', label: t('journal.lots'), type: 'number', placeholder: '0.1' },
  { name: 'entry', label: t('journal.entry'), type: 'number' },
  { name: 'exit', label: t('journal.exit'), type: 'number' },
  { name: 'stopLoss', label: t('journal.stopLoss'), type: 'number' },
  { name: 'pnl', label: t('journal.pnl'), type: 'number', required: true, placeholder: t('journal.pnlHint') },
  { name: 'accountId', label: t('account'), type: 'select', options: accountOptions(accounts) },
  { name: 'setup', label: t('journal.setup'), placeholder: t('journal.setupHint'), suggestions: setups },
  { name: 'beforeUrl', label: t('journal.before'), type: 'url', wide: true, placeholder: 'https://www.tradingview.com/x/…' },
  { name: 'afterUrl', label: t('journal.after'), type: 'url', wide: true, placeholder: 'https://www.tradingview.com/x/…' },
  { name: 'notes', label: t('notes'), type: 'textarea', wide: true, placeholder: t('journal.notesHint') },
  {
    name: 'screenshot', label: t('journal.screenshot'), type: 'custom', wide: true,
    render: (value, set, setError) => <ImageInput value={value} onChange={set} onError={setError} />,
  },
];

export default function Journal() {
  const t = useT();
  const { accounts, trades } = useData();
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ accountId: '', month: '', side: '' });
  const months = [...new Set(trades.map(x => x.date.slice(0, 7)))].sort().reverse();
  const setups = [...new Set(trades.map(x => x.setup).filter(Boolean))].sort();
  const shown = trades
    .filter(x =>
      (!filter.accountId || x.accountId === filter.accountId) &&
      (!filter.month || x.date.startsWith(filter.month)) &&
      (!filter.side || x.side === filter.side))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const total = shown.reduce((s, x) => s + x.pnl, 0);
  const onFilter = key => e => setFilter(f => ({ ...f, [key]: e.target.value }));
  const newTrade = () => setEditing({ date: localDate(), accountId: accounts.length === 1 ? accounts[0].id : '' });
  const validate = d => (d.entry != null && d.entry === d.stopLoss ? t('journal.slEqualsEntry') : null);

  function save(d) {
    const data = { ...d, symbol: d.symbol.toUpperCase() };
    return editing.id ? update('trades', editing.id, data) : add('trades', data);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.journal')}</h1>
          <p className="sub">{t('journal.sub')}</p>
        </div>
        <button className="btn" onClick={newTrade}>
          <Plus size={16} /> {t('journal.add')}
        </button>
      </div>
      <div className="filters">
        <select aria-label={t('filterAccount')} value={filter.accountId} onChange={onFilter('accountId')}>
          <option value="">{t('allAccounts')}</option>
          {accountOptions(accounts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label={t('journal.filterMonth')} value={filter.month} onChange={onFilter('month')}>
          <option value="">{t('journal.allMonths')}</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select aria-label={t('journal.filterSide')} value={filter.side} onChange={onFilter('side')}>
          <option value="">{t('journal.allSides')}</option>
          {SIDES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {shown.length > 0 && (
        <p className="summary">
          {t('tradeCount', { n: shown.length })} · P/L <span className={`num ${tone(total)}`}>{money(total, true)}</span>
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('date')}</th><th>{t('journal.symbol')}</th><th>{t('journal.side')}</th>
              <th className="num">{t('journal.lots')}</th><th className="num">Entry</th><th className="num">Exit</th>
              <th className="num">R</th><th className="num">P/L</th><th>{t('journal.setup')}</th><th>{t('account')}</th>
              <th><span className="sr-only">{t('journal.screenshot')}</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(x => (
              <tr key={x.id} {...rowProps(() => setEditing(x))}>
                <td className="mono">{x.date}</td>
                <td>{x.symbol}</td>
                <td><span className={`chip ${x.side === 'buy' ? 'success' : 'error'}`}>{x.side === 'buy' ? 'Buy' : 'Sell'}</span></td>
                <td className="num">{x.lots ?? '—'}</td>
                <td className="num">{x.entry ?? '—'}</td>
                <td className="num">{x.exit ?? '—'}</td>
                <td className="num">{rFmt(rMultiple(x))}</td>
                <td className={`num ${tone(x.pnl)}`}>{money(x.pnl, true)}</td>
                <td>{x.setup ?? (isHttpUrl(x.beforeUrl) || isHttpUrl(x.afterUrl) ? '' : '—')}<SetupLinks trade={x} /></td>
                <td>{accountName(accounts, x.accountId)}</td>
                <td>{x.screenshot && <ImageIcon size={16} aria-label={t('journal.hasImage')} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="empty">{trades.length ? t('journal.emptyFilter') : t('journal.empty')}</p>}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? t('journal.edit') : t('journal.new')}
          fields={fieldsFor(accounts, setups, t)}
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
