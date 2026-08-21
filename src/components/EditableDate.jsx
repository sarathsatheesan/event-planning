import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../lib/records.js'

function format(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Shared look for the two click-to-edit chips below. */
const chip =
  'focus-ring group inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 font-mono text-xs transition hover:border-border hover:text-accent'

/**
 * When the event happens — date, optional end date for multi-day runs, and the
 * start time. Dates and times are the fields owners actually change (a venue
 * moves a booking, a template gets rolled to next year), so both edit in place.
 */
export default function EditableDate({
  value,
  endDate,
  startTime,
  original,
  onChange,
  onTimeChange,
  onReset,
}) {
  const [editing, setEditing] = useState(false)
  const [editingTime, setEditingTime] = useState(false)
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const isEdited = value !== original

  useEffect(() => {
    if (editing) dateRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (editingTime) timeRef.current?.focus()
  }, [editingTime])

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {editing ? (
        <input
          ref={dateRef}
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
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Change the event date"
          className={`${chip} text-ink-soft`}
        >
          {format(value)}
          <span aria-hidden="true" className="opacity-0 transition group-hover:opacity-100">
            ✎
          </span>
          <span className="sr-only">Change date</span>
        </button>
      )}

      {/* Multi-day events show their span; only the start date is editable. */}
      {endDate && <span className="font-mono text-xs text-ink-soft">&ndash; {format(endDate)}</span>}

      <span aria-hidden="true" className="text-border">
        ·
      </span>

      {editingTime ? (
        <input
          ref={timeRef}
          type="time"
          value={startTime ?? ''}
          onChange={(e) => onTimeChange(e.target.value || null)}
          onBlur={() => setEditingTime(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditingTime(false)
          }}
          className="focus-ring rounded-md border border-accent bg-surface px-2 py-1 font-mono text-xs text-ink"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingTime(true)}
          title="Set the time the event starts"
          className={`${chip} ${startTime ? 'text-ink-soft' : 'italic text-ink-soft/70'}`}
        >
          {startTime ? `starts ${formatTime(startTime)}` : 'Add start time'}
          <span aria-hidden="true" className="opacity-0 transition group-hover:opacity-100">
            ✎
          </span>
        </button>
      )}

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
