import { useMemo, useState } from 'react'
import { taskStatusTone } from '../data/events.js'
import StatusPill from './StatusPill.jsx'
import ViewSwitch from './ViewSwitch.jsx'

/**
 * Every milestone across every event, for one person.
 *
 * The per-event checklist answers "is this event on track". It cannot answer
 * the question the chair actually asks every week — "what is due, and who owes
 * it" — because that spans fifteen events. This view is that question.
 *
 * Assignees are free text ("Hari", "Pavithra"), not accounts, so there is no
 * way to tell which of them is the signed-in user. Hence a name picker rather
 * than an automatic "mine". Tying the two together is on the roadmap.
 */

const PERSON_KEY = 'eventops.workPerson'
const EVERYONE = '__everyone__'
const UNASSIGNED = '__unassigned__'

/**
 * Some seed rows carry the literal string "Unassigned" in the assignee field
 * rather than leaving it blank, so without this the owner picker lists
 * "Unassigned" twice — once as a person, once as the real empty bucket.
 */
function ownerOf(assignee) {
  const trimmed = assignee?.trim() ?? ''
  return trimmed.toLowerCase() === 'unassigned' ? '' : trimmed
}

function readPerson() {
  try {
    return window.localStorage.getItem(PERSON_KEY) ?? EVERYONE
  } catch {
    return EVERYONE
  }
}

/** Local date parts, not toISOString — an evening in Utah is not tomorrow. */
function dayStamp(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysBetween(fromStamp, toStamp) {
  const a = new Date(fromStamp + 'T00:00:00')
  const b = new Date(toStamp + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

function shortDate(stamp) {
  if (!stamp) return '—'
  return new Date(stamp + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const BUCKETS = [
  { key: 'overdue', label: 'Overdue', tone: 'text-critical' },
  { key: 'today', label: 'Due today', tone: 'text-live' },
  { key: 'week', label: 'Next 7 days', tone: 'text-ink' },
  { key: 'month', label: 'Next 30 days', tone: 'text-ink-soft' },
  { key: 'later', label: 'Later', tone: 'text-ink-soft' },
  { key: 'undated', label: 'No due date', tone: 'text-ink-soft' },
]

function bucketFor(due, today) {
  if (!due) return 'undated'
  const delta = daysBetween(today, due)
  if (delta < 0) return 'overdue'
  if (delta === 0) return 'today'
  if (delta <= 7) return 'week'
  if (delta <= 30) return 'month'
  return 'later'
}

export default function MyWork({
  events,
  today,
  onOpenEvent,
  view,
  onViewChange,
  onEmailCommittee,
  onPreviewReminders,
}) {
  const [person, setPerson] = useState(readPerson)
  const [showDone, setShowDone] = useState(false)
  // Events that already happened still hold unticked milestones. They are
  // history, not work, and left in they drown the list — the first run of this
  // view showed 65 "overdue" items, nearly all from events long since over.
  const [includePast, setIncludePast] = useState(false)
  const stamp = dayStamp(today)

  // Flatten once. Fifteen events with a 130-task checklist among them is small
  // enough to do on every render, and memoising keeps it off the critical path.
  const all = useMemo(
    () =>
      events
        .filter((event) => includePast || event.status !== 'Completed')
        .flatMap((event) =>
        (event.checklist ?? []).map((task) => ({
            key: `${event.id}:${task.id}`,
            eventId: event.id,
            eventName: event.name,
            anchor: task.anchor,
            task: task.task,
            category: task.category,
            assignee: ownerOf(task.assignee),
            due: task.due ?? null,
            status: task.status,
          }))
        ),
    [events, includePast]
  )

  const people = useMemo(() => {
    const names = new Set()
    let hasUnassigned = false
    for (const t of all) {
      if (t.assignee) names.add(t.assignee)
      else hasUnassigned = true
    }
    return { names: [...names].sort((a, b) => a.localeCompare(b)), hasUnassigned }
  }, [all])

  const rows = useMemo(() => {
    const mine = all.filter((t) => {
      if (person === EVERYONE) return true
      if (person === UNASSIGNED) return !t.assignee
      return t.assignee === person
    })
    const open = showDone ? mine : mine.filter((t) => t.status !== 'Done')
    return open.sort((a, b) => {
      if (!a.due) return 1
      if (!b.due) return -1
      return a.due.localeCompare(b.due)
    })
  }, [all, person, showDone])

  const grouped = useMemo(() => {
    const byBucket = new Map()
    for (const row of rows) {
      const key = bucketFor(row.due, stamp)
      if (!byBucket.has(key)) byBucket.set(key, [])
      byBucket.get(key).push(row)
    }
    return BUCKETS.filter((b) => byBucket.has(b.key)).map((b) => [b, byBucket.get(b.key)])
  }, [rows, stamp])

  const overdue = rows.filter((r) => bucketFor(r.due, stamp) === 'overdue').length
  const thisWeek = rows.filter((r) => ['today', 'week'].includes(bucketFor(r.due, stamp))).length

  function choosePerson(value) {
    setPerson(value)
    try {
      window.localStorage.setItem(PERSON_KEY, value)
    } catch {
      // Private browsing. The choice just will not persist.
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            India Cultural Center of Utah
          </p>
          <h1 className="font-display text-3xl font-bold leading-none sm:text-4xl">My work</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
            Milestones across every upcoming event, by owner and due date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewSwitch view={view} onChange={onViewChange} />
          {/* Admins only. Sending spends the committee's attention, and the
              function re-checks the caller regardless of this button. */}
          {/* Reads live data and sends nothing — the function behind it has no
              mail password bound at all. */}
          {onPreviewReminders && (
            <button
              type="button"
              onClick={onPreviewReminders}
              className="focus-ring rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
            >
              Preview Monday
            </button>
          )}
          {onEmailCommittee && (
            <button
              type="button"
              onClick={onEmailCommittee}
              className="focus-ring rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
            >
              Email the committee
            </button>
          )}
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          Owner
          <select
            value={person}
            onChange={(e) => choosePerson(e.target.value)}
            className="focus-ring rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink"
          >
            <option value={EVERYONE}>Everyone</option>
            {people.names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            {people.hasUnassigned && <option value={UNASSIGNED}>Unassigned</option>}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="focus-ring h-3.5 w-3.5 accent-[var(--accent)]"
          />
          Show completed
        </label>

        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={includePast}
            onChange={(e) => setIncludePast(e.target.checked)}
            className="focus-ring h-3.5 w-3.5 accent-[var(--accent)]"
          />
          Include past events
        </label>

        <p className="text-xs text-ink-soft">
          {overdue > 0 && (
            <span className="font-semibold text-critical">{overdue} overdue</span>
          )}
          {overdue > 0 && thisWeek > 0 && ' · '}
          {thisWeek > 0 && <span>{thisWeek} due within 7 days</span>}
          {overdue === 0 && thisWeek === 0 && rows.length > 0 && <span>Nothing due this week.</span>}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-ink-soft">
          {showDone
            ? 'No milestones match this owner.'
            : 'Nothing outstanding here. Tick “Show completed” to see finished work.'}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([bucket, items]) => (
            <section key={bucket.key}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className={`font-display text-lg font-bold ${bucket.tone}`}>{bucket.label}</h2>
                <span className="text-xs text-ink-soft">
                  {items.length} milestone{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <ul className="overflow-hidden rounded-xl border border-border">
                {items.map((row, i) => (
                  <li
                    key={row.key}
                    className={`flex flex-col gap-1 bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 ${
                      i !== items.length - 1 ? 'border-b border-border-soft' : ''
                    }`}
                  >
                    <span className="tabular w-28 shrink-0 font-mono text-xs text-ink-soft">
                      {shortDate(row.due)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {row.task || '(untitled)'}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-soft">
                        <button
                          type="button"
                          onClick={() => onOpenEvent(row.eventId)}
                          className="focus-ring rounded font-medium text-accent transition hover:underline"
                        >
                          {row.eventName}
                        </button>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{row.anchor}</span>
                        {person === EVERYONE && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{row.assignee || 'Unassigned'}</span>
                          </>
                        )}
                      </span>
                    </span>
                    <StatusPill label={row.status} tone={taskStatusTone[row.status]} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
