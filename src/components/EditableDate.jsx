import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../lib/records.js'
import { useEditable } from '../lib/editing.js'
import { suggestedEnd } from '../lib/schedule.js'

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
  onEndChange,
  onTimeChange,
  onReset,
}) {
  const editable = useEditable()
  const [editing, setEditing] = useState(false)
  const [editingEnd, setEditingEnd] = useState(false)
  const [editingTime, setEditingTime] = useState(false)
  const dateRef = useRef(null)
  const endRef = useRef(null)
  const timeRef = useRef(null)
  const isEdited = value !== original

  useEffect(() => {
    if (editing) dateRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (editingEnd) endRef.current?.focus()
  }, [editingEnd])

  useEffect(() => {
    if (editingTime) timeRef.current?.focus()
  }, [editingTime])

  // Read-only visitors see the same facts without the click-to-edit affordance.
  if (!editable) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft">
        <span>{format(value)}</span>
        {endDate && <span>&ndash; {format(endDate)}</span>}
        {startTime && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span>starts {formatTime(startTime)}</span>
          </>
        )}
      </span>
    )
  }

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

      {/* The end of a multi-day run, editable in its own right. Moving the
          start carries this with it — see moveStart in src/lib/schedule.js —
          so this control is for changing how long the event runs, not where
          it sits in the calendar. */}
      {editingEnd ? (
        <>
          <span className="font-mono text-xs text-ink-soft">&ndash;</span>
          <input
            ref={endRef}
            type="date"
            value={endDate ?? suggestedEnd({ date: value }) ?? ''}
            min={value}
            onChange={(e) => onEndChange(e.target.value || null)}
            onBlur={() => setEditingEnd(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingEnd(false)
            }}
            className="focus-ring rounded-md border border-accent bg-surface px-2 py-1 font-mono text-xs text-ink"
          />
        </>
      ) : endDate ? (
        <>
          <span className="font-mono text-xs text-ink-soft">&ndash;</span>
          <button
            type="button"
            onClick={() => setEditingEnd(true)}
            title="Change the day this event finishes"
            className={`${chip} text-ink-soft`}
          >
            {format(endDate)}
            <span aria-hidden="true" className="opacity-0 transition group-hover:opacity-100">
              ✎
            </span>
            <span className="sr-only">Change end date</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            // Opening the picker on a single-day event proposes the next day,
            // so the common case — a weekend — is one click and a confirm.
            onEndChange(suggestedEnd({ date: value }))
            setEditingEnd(true)
          }}
          title="Make this a multi-day event"
          className={`${chip} italic text-ink-soft/70`}
        >
          + end date
        </button>
      )}

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
