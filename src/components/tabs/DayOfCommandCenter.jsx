import { useEffect, useMemo, useState } from 'react'
import { taskStatusTone } from '../../data/events.js'
import StatusPill from '../StatusPill.jsx'

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default function DayOfCommandCenter({ event, today }) {
  const isLiveDay = event.status === 'Live Today'
  const [clock, setClock] = useState(() => (isLiveDay ? new Date() : today))
  const [items, setItems] = useState(event.runOfShow)

  useEffect(() => {
    if (!isLiveDay) return
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [isLiveDay])

  const nowMinutes = clock.getHours() * 60 + clock.getMinutes()

  const nextIndex = useMemo(() => {
    if (!isLiveDay) return -1
    let idx = items.findIndex((it) => toMinutes(it.time) > nowMinutes)
    return idx === -1 ? items.length : idx
  }, [items, nowMinutes, isLiveDay])

  // Keyed by position, not by time: a real run of show routinely has two things
  // happening at once (water and snacks both staged at 06:30), and matching on
  // time would advance every item sharing that slot.
  function cycleStatus(index) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it
        const order = ['Not Started', 'In Progress', 'Done']
        const idx = order.indexOf(it.status)
        return { ...it, status: order[(idx + 1) % order.length] }
      })
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
          <p className="font-display tabular text-3xl font-bold leading-none" style={{ color: isLiveDay ? 'var(--live)' : 'var(--ink)' }}>
            {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: isLiveDay ? '2-digit' : undefined })}
          </p>
        </div>
        {!isLiveDay && (
          <p className="max-w-[10rem] text-right text-xs text-ink-soft">
            Activates automatically the morning of the event.
          </p>
        )}
      </div>

      <p className="mb-3 text-xs text-ink-soft">
        High-contrast, single-tap mode for floor volunteers &amp; coordinators. Tap an item to advance
        it &mdash; Not Started &rarr; In Progress &rarr; Done.
      </p>

      <ol className="flex flex-col gap-2">
        {items.map((it, idx) => {
          return (
            <li key={`${it.time}-${idx}`}>
              {isLiveDay && idx === nextIndex && (
                <div className="my-1 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-live" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-live">Now</span>
                  <span className="h-px flex-1 bg-live/40" />
                </div>
              )}
              <button
                type="button"
                onClick={() => cycleStatus(idx)}
                className={`focus-ring flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${
                  it.status === 'Done' ? 'opacity-60' : ''
                }`}
                style={{
                  borderColor: it.status === 'Done' ? 'var(--border)' : 'var(--border)',
                  background: 'var(--surface)',
                }}
              >
                <span className="font-mono tabular w-14 shrink-0 text-base font-semibold text-ink-soft">
                  {it.time}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-snug text-ink">{it.item}</span>
                  <span className="block text-xs text-ink-soft">{it.owner}</span>
                </span>
                <StatusPill label={it.status} tone={taskStatusTone[it.status] ?? 'neutral'} />
              </button>
            </li>
          )
        })}
        {isLiveDay && nextIndex === items.length && (
          <li className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-soft">
            End of run of show
          </li>
        )}
      </ol>
    </div>
  )
}
