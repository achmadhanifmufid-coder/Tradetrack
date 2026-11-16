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
