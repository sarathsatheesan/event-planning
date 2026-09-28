import { useEditable } from '../lib/editing.js'
import { formatTime } from '../lib/records.js'

// Shared editing primitives.
//
// Every phase of an event is editable in place, so these shapes carry a lot of
// the app. They are deliberately plain: a quiet border says "you can change
// this" without turning a page of records into a wall of form controls.
//
// They are also the one choke point for permission. A read-only visitor gets
// the same information rendered as text, so the page reads the same whether or
// not you can change it — and there are no dead controls that look live until
// you click them.

/** How a stored value should read when it is text rather than an input. */
function display(value, type) {
  if (value === null || value === undefined || value === '') return null
  if (type === 'date') {
    return new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  if (type === 'time') return formatTime(value)
  return String(value)
}

/** Static stand-in for an input, padded to match so rows keep their rhythm. */
function ReadOnly({ value, type, placeholder, className = '' }) {
  const text = display(value, type)
  // A number's placeholder is a sample value ("0"), which read as text would
  // claim a figure nobody entered. Untracked numbers say so instead.
  const empty = type === 'number' ? '\u2014' : (placeholder ?? '\u2014')
  return (
    <span className={`inline-block px-1.5 py-0.5 ${className}`}>
      {text ?? <span className="italic opacity-60">{empty}</span>}
    </span>
  )
}

/** Text, date, time or number input styled to sit inline in a record. */
export function InlineField({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  ariaLabel,
}) {
  const editable = useEditable()
  if (!editable) {
    return <ReadOnly value={value} type={type} placeholder={placeholder} className={className} />
  }
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

/** The small × that removes a record. Absent entirely when read-only. */
export function RemoveButton({ onClick, title }) {
  const editable = useEditable()
  if (!editable) return null
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

/** The dashed "add another one of these" control. Absent when read-only. */
export function AddButton({ onClick, children }) {
  const editable = useEditable()
  if (!editable) return null
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
  const editable = useEditable()
  if (!editable) return <ReadOnly value={value} className={className} />
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
