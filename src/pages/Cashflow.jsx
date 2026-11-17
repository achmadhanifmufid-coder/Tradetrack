import { useState } from 'react';
import { Plus } from 'lucide-react';
import { add, remove, update, useData } from '../data';
import { localDate, netResult } from '../stats';
import { useT } from '../i18n';
import { FormModal, StatCard, accountName, accountOptions, money, pct, rowProps, tone } from '../ui';

// type value -> chip tone; label from i18n key `cash.<value>`
const TYPES = { payout: 'success', cost: 'warning' };

const fieldsFor = (accounts, t) => [
  { name: 'type', label: t('cash.type'), type: 'select', required: true, options: Object.keys(TYPES).map(v => [v, t(`cash.${v}`)]) },
  { name: 'date', label: t('date'), type: 'date', required: true },
  { name: 'amount', label: t('cash.amount'), type: 'number', required: true },
  { name: 'accountId', label: t('account'), type: 'select', options: accountOptions(accounts) },
  { name: 'notes', label: t('notes'), type: 'textarea', wide: true, placeholder: t('cash.notesHint') },
];

export default function Cashflow() {
  const t = useT();
  const validate = d => (d.amount <= 0 ? t('form.positive', { label: t('cash.amount') }) : null);
  const { accounts, cashflows } = useData();
  const [editing, setEditing] = useState(null);
  const r = netResult(cashflows);
  const sorted = [...cashflows].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('nav.cashflow')}</h1>
          <p className="sub">{t('cash.sub')}</p>
        </div>
        <button className="btn" onClick={() => setEditing({ date: localDate() })}>
          <Plus size={16} /> {t('cash.add')}
        </button>
      </div>
      <div className="grid">
        <StatCard label={t('cash.totalCost')} value={money(r.costs)} />
        <StatCard label={t('cash.totalPayout')} value={money(r.payouts)} />
        <StatCard label={t('net')} value={money(r.net, true)} className={tone(r.net)} sub={t('netSub')} />
        <StatCard label="ROI" value={pct(r.roi)} className={tone(r.roi)} sub={t('cash.roiSub')} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>{t('date')}</th><th>{t('cash.type')}</th><th>{t('account')}</th><th className="num">{t('cash.amountCol')}</th><th>{t('notes')}</th></tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} {...rowProps(() => setEditing(c))}>
                <td className="mono">{c.date}</td>
                <td><span className={`chip ${TYPES[c.type]}`}>{t(`cash.${c.type}`)}</span></td>
                <td>{accountName(accounts, c.accountId)}</td>
                <td className={`num ${c.type === 'payout' ? 'pos' : 'neg'}`}>
                  {money(c.type === 'payout' ? c.amount : -c.amount, true)}
                </td>
                <td className="note">{c.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cashflows.length && <p className="empty">{t('cash.empty')}</p>}
      </div>
      {editing && (
        <FormModal
          title={editing.id ? t('cash.edit') : t('cash.new')}
          fields={fieldsFor(accounts, t)}
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
