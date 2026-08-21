// Shared editing primitives.
//
// Every phase of an event is editable in place, so these three shapes carry a
// lot of the app. They are deliberately plain: a quiet border says "you can
// change this" without turning a page of records into a wall of form controls.

/** Text, date, time or number input styled to sit inline in a record. */
export function InlineField({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  ariaLabel,
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`focus-ring rounded-md border border-border-soft bg-transparent px-1.5 py-0.5 transition hover:border-border focus:border-accent focus:bg-surface ${className}`}
    />
  )
}

/** A money or count field. Empty means "not tracked", which is not the same
 *  as zero — so it round-trips to null rather than 0. */
export function NumberField({ value, onChange, placeholder, prefix, className = '' }) {
  return (
    <span className="inline-flex items-center">
      {prefix && <span className="text-ink-soft">{prefix}</span>}
      <InlineField
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(v) => onChange(v === '' ? null : Number(v))}
        className={`tabular ${className}`}
      />
    </span>
  )
}

/** The small × that removes a record. */
export function RemoveButton({ onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-sm text-ink-soft transition hover:bg-critical-soft hover:text-critical"
    >
      <span aria-hidden="true">×</span>
      <span className="sr-only">{title}</span>
    </button>
  )
}

/** The dashed "add another one of these" control. */
export function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
    >
      + {children}
    </button>
  )
}

/** A dropdown styled to match InlineField, for fields with a fixed set of
 *  values — the phase a milestone sits in, the category it belongs to. */
export function InlineSelect({ value, onChange, options, className = '', ariaLabel }) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={`focus-ring rounded-md border border-border-soft bg-transparent px-1 py-0.5 transition hover:border-border focus:border-accent focus:bg-surface ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
