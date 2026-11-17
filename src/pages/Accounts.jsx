import { useState } from 'react';
import { Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { balance } from '../stats';
import { useT } from '../i18n';
import { FormModal, money, rowProps } from '../ui';

// status value -> chip tone; label comes from i18n key `status.<value>`
export const STATUS = { evaluasi: 'info', funded: 'success', lolos: 'success', gagal: 'error' };

const fieldsFor = t => [
  { name: 'firm', label: t('accounts.firm'), required: true, placeholder: 'FTMO, FundedNext…' },
  { name: 'accountNo', label: t('accounts.no'), required: true },
  { name: 'size', label: t('accounts.size'), type: 'number', required: true, placeholder: '5000' },
  { name: 'status', label: t('accounts.status'), type: 'select', required: true, options: Object.keys(STATUS).map(v => [v, t(`status.${v}`)]) },
  { name: 'dailyLossLimit', label: t('accounts.daily'), type: 'number', placeholder: '250' },
  { name: 'maxLossLimit', label: t('accounts.max'), type: 'number', placeholder: '500' },
  { name: 'drawdownType', label: t('accounts.ddType'), type: 'select', required: true, options: [['static', t('accounts.ddStatic')], ['trailing', t('accounts.ddTrailing')]] },
  { name: 'profitTarget', label: t('accounts.target'), type: 'number' },
  { name: 'startDate', label: t('accounts.start'), type: 'date' },
  { name: 'notes', label: t('notes'), type: 'textarea', wide: true, placeholder: t('accounts.notesHint') },
];

const validateWith = (fields, t) => d => {
  for (const k of ['size', 'dailyLossLimit', 'maxLossLimit', 'profitTarget'])
    if (d[k] != null && d[k] <= 0) return t('form.positive', { label: fields.find(f => f.name === k).label });
  return null;
};

export default function Accounts() {
  const t = useT();
  const fields = fieldsFor(t);
  const { accounts, trades } = useData();
  const [editing, setEditing] = useState(null);
  const sorted = [...accounts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.accounts')}</h1>
          <p className="sub">{t('accounts.sub')}</p>
        </div>
        <button className="btn" onClick={() => setEditing({})}>
          <Plus size={16} /> {t('accounts.add')}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('accounts.firm')}</th><th>{t('accounts.no')}</th><th className="num">{t('accounts.sizeCol')}</th>
              <th className="num">{t('accounts.balance')}</th><th>{t('accounts.status')}</th>
              <th className="num">{t('accounts.targetCol')}</th><th>{t('notes')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => (
              <tr key={a.id} {...rowProps(() => setEditing(a))}>
                <td>{a.firm}</td>
                <td className="mono">{a.accountNo}</td>
                <td className="num">{money(a.size)}</td>
                <td className="num">{money(balance(a, trades))}</td>
                <td><span className={`chip ${STATUS[a.status]}`}>{t(`status.${a.status}`)}</span></td>
                <td className="num">{money(a.profitTarget)}</td>
                <td className="note">{a.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length && <p className="empty">{t('accounts.empty')}</p>}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? t('accounts.edit') : t('accounts.new')}
          fields={fields}
          initial={editing}
          validate={validateWith(fields, t)}
          onSubmit={d => (editing.id ? update('accounts', editing.id, d) : add('accounts', d))}
          onDelete={editing.id ? () => remove('accounts', editing.id) : null}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
