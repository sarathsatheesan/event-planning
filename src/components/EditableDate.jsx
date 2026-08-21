import { useEffect, useRef, useState } from 'react'

function format(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * The event date as a click-to-edit field. Dates are the one thing owners
 * reliably need to change — a venue moves a date, a template gets rolled to
 * next year — so it is editable in place rather than buried in a form.
 */
export default function EditableDate({ value, original, onChange, onReset }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  const isEdited = value !== original

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => {
            // An empty or half-typed value would render as "Invalid Date".
            if (e.target.value) onChange(e.target.value)
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditing(false)
          }}
          className="focus-ring rounded-md border border-accent bg-surface px-2 py-1 font-mono text-xs text-ink"
        />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Change the event date"
        className="focus-ring group inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 font-mono text-xs text-ink-soft transition hover:border-border hover:text-accent"
      >
        {format(value)}
        <span aria-hidden="true" className="opacity-0 transition group-hover:opacity-100">
          ✎
        </span>
        <span className="sr-only">Change date</span>
      </button>
      {isEdited && (
        <button
          type="button"
          onClick={onReset}
          title={`Original date: ${format(original)}`}
          className="focus-ring rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent"
        >
          Edited · reset
        </button>
      )}
    </span>
  )
}
