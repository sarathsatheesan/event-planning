import { statusTone, readiness, formatDateRange } from '../data/events.js'
import { formatTime } from '../lib/records.js'
import StatusPill from './StatusPill.jsx'
import ReadinessGauge from './ReadinessGauge.jsx'
import EventArt from './EventArt.jsx'
import { useEditable } from '../lib/editing.js'

function daysUntil(dateStr, today) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = new Date(today.toDateString())
  return Math.round((d - t) / 86400000)
}

function TMinusLabel({ dateStr, today }) {
  const n = daysUntil(dateStr, today)
  if (n === 0) return <span className="text-live font-semibold">Today</span>
  if (n < 0) return <span className="text-ink-soft">{Math.abs(n)}d ago</span>
  return <span className="text-ink-soft">T&minus;{n}d</span>
}

export default function Dashboard({ events, today, onSelectEvent, onCloneEvent }) {
  const editable = useEditable()
  const live = events.filter((e) => e.status === 'Live Today').length
  const upcoming = events.filter((e) => e.status !== 'Completed' && e.status !== 'Live Today').length
  const avgReadiness = Math.round(
    events.filter((e) => e.status !== 'Completed').reduce((sum, e) => sum + readiness(e), 0) /
      Math.max(1, events.filter((e) => e.status !== 'Completed').length)
  )
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          India Cultural Center of Utah
        </p>
        <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">
          Annual Event Operations Hub
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Master calendar of recurring events — milestone tracking, Day-Of execution, and
          year-over-year blueprints in one place.
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Events tracked" value={events.length} />
        <SummaryStat label="Live today" value={live} tone={live > 0 ? 'live' : undefined} />
        <SummaryStat label="In planning" value={upcoming} />
        <SummaryStat label="Avg. readiness" value={`${avgReadiness}%`} />
      </div>

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Event Calendar</h2>
        <p className="text-xs text-ink-soft">{sorted.length} events, chronological</p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((event) => {
          const pct = readiness(event)
          const tone = statusTone[event.status]
          return (
            <li key={event.id}>
              <div className="focus-ring group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <EventArt theme={event.theme} className="h-16 w-full shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className="focus-ring flex flex-1 flex-col px-5 pt-4 text-left"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <StatusPill label={event.status} tone={tone} pulse={tone === 'live'} />
                    <ReadinessGauge percent={pct} size={52} stroke={5} />
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight group-hover:text-accent">
                    {event.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{event.venue}</p>
                  <div className="mt-3 flex items-center gap-2 font-mono text-xs">
                    <span className="tabular">
                      {formatDateRange(event.date, event.endDate)}
                      {event.startTime && `, ${formatTime(event.startTime)}`}
                    </span>
                    <span className="text-border">&middot;</span>
                    <TMinusLabel dateStr={event.date} today={today} />
                  </div>
                  <p className="mt-3 text-sm leading-snug text-ink-soft">{event.heroNote}</p>
                </button>
                <div className="mt-4 flex items-center justify-between border-t border-border-soft px-5 py-3">
                  <span className="text-xs text-ink-soft">
                    {event.lead ? (
                      <>
                        Lead: <span className="font-medium text-ink">{event.lead}</span>
                      </>
                    ) : (
                      <span className="italic">No lead assigned</span>
                    )}
                  </span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onCloneEvent(event.id)}
                      className="focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
                    >
                      Clone as template
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SummaryStat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p
        className="font-display tabular text-2xl font-bold"
        style={tone === 'live' ? { color: 'var(--live)' } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
