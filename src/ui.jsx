import { useState } from 'react';
import { X } from 'lucide-react';
import { useT } from './i18n';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n, signed = false) => (n == null ? '—' : (signed && n > 0 ? '+' : '') + usd.format(n));
export const pct = n => (n == null ? '—' : `${(n * 100).toFixed(1)}%`);
export const ratio = n => (n == null ? '—' : n === Infinity ? '∞' : n.toFixed(2));
export const rFmt = n => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}R`);
export const tone = n => (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
export const isHttpUrl = v => typeof v === 'string' && /^https?:\/\/\S+$/i.test(v.trim());

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
  const t = useT();
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Input({ field, value, onChange }) {
  const t = useT();
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
  if (field.type === 'url')
    return (
      <div className="url-input">
        <input type="url" {...common} />
        {isHttpUrl(value) && <a href={value.trim()} target="_blank" rel="noopener noreferrer">{t('open')}</a>}
      </div>
    );
  if (field.suggestions)
    return (
      <>
        <input type="text" list={`${field.name}-list`} {...common} />
        <datalist id={`${field.name}-list`}>
          {field.suggestions.map(s => <option key={s} value={s} />)}
        </datalist>
      </>
    );
  return <input type={field.type || 'text'} {...common} />;
}

const isEmpty = v => v == null || String(v).trim() === '';

export function FormModal({ title, fields, initial = {}, validate, onSubmit, onDelete, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map(f => [f.name, initial[f.name] ?? (f.type === 'select' && f.required ? f.options[0][0] : '')]),
    ),
  );
  const t = useT();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = name => v => setValues(s => ({ ...s, [name]: v }));

  async function submit(e) {
    e.preventDefault();
    const data = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.required && isEmpty(raw)) return setError(t('form.required', { label: f.label }));
      if (isEmpty(raw)) data[f.name] = null;
      else if (f.type === 'number') {
        const n = Number(String(raw).replace(',', '.'));
        if (!Number.isFinite(n)) return setError(t('form.number', { label: f.label }));
        data[f.name] = n;
      } else if (f.type === 'url' && !isHttpUrl(raw)) return setError(t('form.url', { label: f.label }));
      else data[f.name] = typeof raw === 'string' ? raw.trim() : raw;
    }
    const msg = validate?.(data);
    if (msg) return setError(msg);
    setBusy(true);
    try {
      // shortcut: offline saves wait here until reconnect; fine for single-user online use
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(t('form.saveFailed', { msg: err.message }));
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(t('form.confirmDelete'))) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(t('form.deleteFailed', { msg: err.message }));
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
            <button type="button" className="btn danger" onClick={del} disabled={busy}>{t('form.delete')}</button>
          )}
          <button type="button" className="btn secondary" onClick={onClose} disabled={busy}>{t('form.cancel')}</button>
          <button type="submit" className="btn" disabled={busy}>{busy ? t('form.saving') : t('form.save')}</button>
        </footer>
      </form>
    </Modal>
  );
}
