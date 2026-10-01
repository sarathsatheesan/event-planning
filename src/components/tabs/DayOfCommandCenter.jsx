import { useEffect, useMemo, useState } from 'react'
import { taskStatusTone } from '../../data/events.js'
import StatusPill from '../StatusPill.jsx'
import { InlineField, RemoveButton, AddButton } from '../fields.jsx'
import { formatTime, toMinutes, offsetFromStart } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'

export default function DayOfCommandCenter({ event, today, onRunOfShowChange }) {
  const editable = useEditable()
  const isLiveDay = event.status === 'Live Today'
  const [clock, setClock] = useState(() => (isLiveDay ? new Date() : today))
  // On the day this is a floor tool — big tap targets, no text fields to fumble
  // with. Editing is a separate mode you opt into while planning.
  const [editing, setEditing] = useState(false)

  // Tapping a row advances its status, so it is a button for people who may
  // edit and inert markup for everyone else.
  const Row = editable ? 'button' : 'div'

  const items = useMemo(
    () => [...event.runOfShow].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)),
    [event.runOfShow]
  )

  useEffect(() => {
    if (!isLiveDay) return
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [isLiveDay])

  const nowMinutes = clock.getHours() * 60 + clock.getMinutes()

  // First item at or after the start time — everything above it is setup.
  const startIndex = useMemo(() => {
    if (!event.startTime) return -1
    const start = toMinutes(event.startTime)
    return items.findIndex((it) => toMinutes(it.time) >= start)
  }, [items, event.startTime])

  const nextIndex = useMemo(() => {
    if (!isLiveDay) return -1
    const idx = items.findIndex((it) => toMinutes(it.time) > nowMinutes)
    return idx === -1 ? items.length : idx
  }, [items, nowMinutes, isLiveDay])

  // Keyed by position, not by time: a real run of show routinely has two things
  // happening at once, and matching on time would advance every item in the slot.
  function cycleStatus(index) {
    const order = ['Not Started', 'In Progress', 'Done']
    onRunOfShowChange(
      items.map((it, i) =>
        i === index ? { ...it, status: order[(order.indexOf(it.status) + 1) % order.length] } : it
      )
    )
  }

  function patchItem(index, patch) {
    onRunOfShowChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeItem(index) {
    onRunOfShowChange(items.filter((_, i) => i !== index), 'Schedule item removed.')
  }

  function addItem() {
    const last = items[items.length - 1]
    onRunOfShowChange([
      ...items,
      { time: last ? last.time : (event.startTime ?? '09:00'), item: '', owner: '', status: 'Not Started' },
    ])
    setEditing(true)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No run of show yet</p>
        <p className="max-w-md text-sm text-ink-soft">
          Build the timed schedule for {event.name} — load-in, doors, performances, close-out. On
          the day it becomes a single-tap checklist for floor volunteers, with a live
          &ldquo;now&rdquo; marker.
        </p>
        <div className="mt-2 w-64">
          <AddButton onClick={addItem}>Add the first item</AddButton>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div
        className="mb-5 flex items-center justify-between rounded-xl border px-5 py-4"
        style={{
          borderColor: isLiveDay ? 'var(--live)' : 'var(--border)',
          background: isLiveDay ? 'var(--live-soft)' : 'var(--surface)',
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {isLiveDay ? 'Live now' : 'Command center — inactive'}
          </p>
          <p
            className="font-display tabular text-3xl font-bold leading-none"
            style={{ color: isLiveDay ? 'var(--live)' : 'var(--ink)' }}
          >
            {clock.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: isLiveDay ? '2-digit' : undefined,
            })}
          </p>
        </div>
        <div className="text-right">
          {event.startTime ? (
            <p className="font-mono text-xs font-semibold text-ink">
              Doors / start {formatTime(event.startTime)}
            </p>
          ) : (
            <p className="text-xs italic text-ink-soft">
              No start time set — add one on the event header to see prep vs. showtime.
            </p>
          )}
          {!isLiveDay && (
            <p className="mt-0.5 max-w-[11rem] text-xs text-ink-soft">
              Activates automatically the morning of the event.
            </p>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          {!editable
            ? 'Run of show for the day. Sign in as a committee member to advance items.'
            : editing
            ? 'Editing the schedule. Items sort by time automatically.'
            : 'Single-tap mode for floor volunteers — tap an item to advance it.'}
        </p>
        {editable && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="focus-ring shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
          >
            {editing ? 'Done editing' : 'Edit schedule'}
          </button>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {items.map((it, idx) => (
          <li key={`${it.time}-${idx}`}>
            {!editing && startIndex === idx && (
              <div className="my-1 flex items-center gap-2 px-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                  Event starts {formatTime(event.startTime)}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            {!editing && isLiveDay && idx === nextIndex && (
              <div className="my-1 flex items-center gap-2 px-1">
                <span className="h-2 w-2 shrink-0 rounded-full bg-live" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-live">Now</span>
                <span className="h-px flex-1 bg-live/40" />
              </div>
            )}

            {editing ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                <InlineField
                  type="time"
                  value={it.time}
                  onChange={(v) => v && patchItem(idx, { time: v })}
                  className="w-24 shrink-0 font-mono text-sm font-semibold text-ink-soft"
                />
                <div className="min-w-0 flex-1">
                  <InlineField
                    value={it.item}
                    onChange={(v) => patchItem(idx, { item: v })}
                    placeholder="What happens at this time"
                    className="w-full text-sm font-semibold text-ink"
                  />
                  <InlineField
                    value={it.owner}
                    onChange={(v) => patchItem(idx, { owner: v })}
                    placeholder="Owner"
                    className="mt-0.5 w-40 text-xs text-ink-soft"
                  />
                </div>
                <RemoveButton onClick={() => removeItem(idx)} title="Remove this item" />
              </div>
            ) : (
              <Row
                {...(editable ? { type: 'button', onClick: () => cycleStatus(idx) } : {})}
                className={`flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-4 text-left transition ${
                  editable ? 'focus-ring' : ''
                } ${it.status === 'Done' ? 'opacity-60' : ''}`}
              >
                <span className="w-14 shrink-0">
                  <span className="font-mono tabular block text-base font-semibold text-ink-soft">
                    {it.time}
                  </span>
                  {offsetFromStart(it.time, event.startTime) && (
                    <span className="font-mono block text-[10px] text-ink-soft/70">
                      {offsetFromStart(it.time, event.startTime)}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-snug text-ink">
                    {it.item || <span className="text-ink-soft">Untitled item</span>}
                  </span>
                  <span className="block text-xs text-ink-soft">{it.owner || 'Unassigned'}</span>
                </span>
                <StatusPill label={it.status} tone={taskStatusTone[it.status] ?? 'neutral'} />
              </Row>
            )}
          </li>
        ))}

        {!editing && isLiveDay && nextIndex === items.length && (
          <li className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-soft">
            End of run of show
          </li>
        )}
      </ol>

      {editing && (
        <div className="mt-3">
          <AddButton onClick={addItem}>Add a schedule item</AddButton>
        </div>
      )}
    </div>
  )
}
