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
