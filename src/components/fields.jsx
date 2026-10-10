import { useEditable } from '../lib/editing.js'
import { useCommittee } from '../lib/committee.js'
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
/**
 * `placeholder` names the empty option. Without it a blank choice renders as a
 * blank line, which is fine in a labelled row and useless in a column of five
 * identical boxes on a phone.
 */
/**
 * `options` takes plain strings, or { value, label } when what is stored is not
 * what should be read — a committee is stored as `cultural` and shown as
 * Cultural. Read-only renders the label, never the stored id.
 */
export function InlineSelect({ value, onChange, options, className = '', ariaLabel, placeholder }) {
  const editable = useEditable()
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  const shown = opts.find((o) => o.value === value)?.label ?? value
  if (!editable) return <ReadOnly value={shown} placeholder={placeholder} className={className} />
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className={`focus-ring rounded-md border border-border-soft bg-transparent px-1 py-0.5 transition hover:border-border focus:border-accent focus:bg-surface ${className}`}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.value === '' && placeholder ? placeholder : o.label}
        </option>
      ))}
    </select>
  )
}

const UNASSIGNED = ''
const LEGACY = '__legacy__'

const OWNER_CHIP =
  'inline-flex items-center gap-1 rounded-full border border-border-soft bg-paper px-2 py-0.5 text-[11px] font-medium text-ink'

/**
 * The people on one piece of work.
 *
 * Same promises as PersonField, which it replaces wherever work can be shared:
 * picking from the roster records the address beside the name, a typed name
 * that matches nobody is kept and labelled rather than wiped, and with no
 * roster loaded it degrades to a plain text field.
 *
 * Chips plus an add control rather than a multi-select listbox: most work has
 * one owner and should still read as one word, and a listbox tall enough to
 * pick three from thirteen would dominate a milestone row.
 */
export function PeopleField({ people: chosen, onChange, placeholder = 'Unassigned', className = '' }) {
  const editable = useEditable()
  const roster = useCommittee()
  const list = chosen ?? []

  const labelFor = (a) => {
    const matched = a.email ? roster.find((p) => p.email === String(a.email).toLowerCase()) : null
    return matched?.label ?? (a.name || a.email || '')
  }

  if (!editable) {
    return (
      <ReadOnly value={list.map(labelFor).join(', ')} placeholder={placeholder} className={className} />
    )
  }

  if (roster.length === 0) {
    // No roster has loaded, so there is nobody to pick. One free-text owner is
    // what this field was before the roster existed, and still beats nothing.
    return (
      <InlineField
        value={list[0]?.name ?? ''}
        onChange={(v) => onChange(v.trim() ? [{ name: v, email: null }] : [])}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  const taken = new Set(list.map((a) => (a.email ?? '').toLowerCase()).filter(Boolean))
  const available = roster.filter((p) => !taken.has(p.email))

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {list.map((a, i) => (
        <span key={a.email || `${a.name}-${i}`} className={OWNER_CHIP}>
          {labelFor(a)}
          {!a.email && <span className="text-ink-soft"> — not on the committee</span>}
          <button
            type="button"
            onClick={() => onChange(list.filter((_, j) => j !== i))}
            className="focus-ring rounded text-ink-soft transition hover:text-critical"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remove {labelFor(a)}</span>
          </button>
        </span>
      ))}
      {available.length > 0 && (
        <select
          value={UNASSIGNED}
          aria-label={list.length ? 'Add another owner' : placeholder}
          onChange={(e) => {
            const person = roster.find((p) => p.email === e.target.value)
            if (person) onChange([...list, { name: person.name || person.email, email: person.email }])
          }}
          className="focus-ring rounded-md border border-border-soft bg-transparent px-1 py-0.5 transition hover:border-border focus:border-accent focus:bg-surface"
        >
          <option value={UNASSIGNED}>{list.length ? '+ add' : placeholder}</option>
          {available.map((p) => (
            <option key={p.email} value={p.email}>
              {p.label}
            </option>
          ))}
        </select>
      )}
    </span>
  )
}

/**
 * Picks a person from the committee roster, storing their address alongside
 * the name so reminders have somewhere to go.
 *
 * Three things it has to tolerate. Hundreds of milestones already carry typed
 * names like "Hari" with no address — those resolve automatically when a
 * roster member has the same name, and otherwise stay put rather than being
 * silently wiped. And with no roster at all (a local checkout, or before the
 * committee has been saved) it falls back to the free-text box it replaced,
 * because a dropdown with nothing in it cannot be used.
 */
export function PersonField({ value, email, onChange, placeholder = 'Unassigned', className = '' }) {
  const editable = useEditable()
  const people = useCommittee()

  const typed = (value ?? '').trim()
  const matchedByEmail = email ? people.find((p) => p.email === String(email).toLowerCase()) : null
  const matchedByName =
    !matchedByEmail && typed
      ? people.find((p) => p.name && p.name.toLowerCase() === typed.toLowerCase())
      : null
  const matched = matchedByEmail ?? matchedByName

  if (!editable) {
    return <ReadOnly value={matched?.label ?? typed} placeholder={placeholder} className={className} />
  }

  if (people.length === 0) {
    return (
      <InlineField
        value={value}
        onChange={(v) => onChange(v, null)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  const selected = matched ? matched.email : typed ? LEGACY : UNASSIGNED

  return (
    <select
      value={selected}
      aria-label={placeholder}
      onChange={(e) => {
        const next = e.target.value
        if (next === LEGACY) return
        if (next === UNASSIGNED) return onChange('', null)
        const person = people.find((p) => p.email === next)
        if (person) onChange(person.name || person.email, person.email)
      }}
      className={`focus-ring rounded-md border border-border-soft bg-transparent px-1 py-0.5 transition hover:border-border focus:border-accent focus:bg-surface ${className}`}
    >
      <option value={UNASSIGNED}>{placeholder}</option>
      {people.map((p) => (
        <option key={p.email} value={p.email}>
          {p.label}
        </option>
      ))}
      {selected === LEGACY && <option value={LEGACY}>{typed} — not on the committee</option>}
    </select>
  )
}
