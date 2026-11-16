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
