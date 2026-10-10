import { statusTone, readiness, formatDateRange, ORGS, COMMITTEES } from '../data/events.js'
import { formatTime } from '../lib/records.js'
import StatusPill from './StatusPill.jsx'
import ReadinessGauge from './ReadinessGauge.jsx'
import EventArt from './EventArt.jsx'
import ViewSwitch from './ViewSwitch.jsx'
import { useEditable } from '../lib/editing.js'
import EventFilters from './EventFilters.jsx'
import { EMPTY_FILTERS, filterEvents, activeCount } from '../lib/filters.js'

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

export default function Dashboard({
  events,
  today,
  onSelectEvent,
  view,
  onViewChange,
  onNewEvent,
  filters = EMPTY_FILTERS,
  onFiltersChange,
}) {
  const editable = useEditable()
  // The summary follows the filter. Narrowing to the temple and still being
  // told the ICC's average readiness would answer a question nobody asked.
  const shown = filterEvents(events, filters)
  const narrowed = activeCount(filters)
  const live = shown.filter((e) => e.status === 'Live Today').length
  const upcoming = shown.filter((e) => e.status !== 'Completed' && e.status !== 'Live Today').length
  const open = shown.filter((e) => e.status !== 'Completed')
  const avgReadiness = Math.round(
    open.reduce((sum, e) => sum + readiness(e), 0) / Math.max(1, open.length)
  )
  const sorted = [...shown].sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Sri Ganesha Hindu Temple of Utah
          </p>
          <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
            Annual Event Operations Hub
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Master calendar of recurring events — milestone tracking, Day-Of execution, and
            year-over-year blueprints in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewSwitch view={view} onChange={onViewChange} />
          {editable && (
            <button
              type="button"
              onClick={onNewEvent}
              className="focus-ring rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink shadow-sm transition hover:brightness-110 active:scale-[0.98]"
            >
              New event
            </button>
          )}
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label={narrowed ? 'Events shown' : 'Events tracked'} value={shown.length} />
        <SummaryStat label="Live today" value={live} tone={live > 0 ? 'live' : undefined} />
        <SummaryStat label="In planning" value={upcoming} />
        <SummaryStat label="Avg. readiness" value={`${avgReadiness}%`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-xl font-bold tracking-tight">Event Calendar</h2>
        <EventFilters
          events={events}
          filters={filters}
          onChange={onFiltersChange}
          knownOrgs={ORGS}
          knownCommittees={COMMITTEES}
        />
        <p className="w-full text-xs text-ink-soft sm:w-auto">
          {narrowed
            ? `${sorted.length} of ${events.length} events`
            : `${sorted.length} events, chronological`}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">No events match</p>
          <p className="max-w-sm text-sm text-ink-soft">
            {events.length} event{events.length === 1 ? '' : 's'} on the calendar, none of them
            matching these filters.
          </p>
          <button
            type="button"
            onClick={() => onFiltersChange(EMPTY_FILTERS)}
            className="focus-ring mt-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
          >
            Clear filters
          </button>
        </div>
      ) : (
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Every tile is the same height because every slot inside it has a
            fixed line budget — two lines of title, one of date, one of venue
            — rather than because the row stretches them to match. Fifteen
            events, some carrying a venue and a lead and some only a name and a
            date, used to produce three different card heights down the page,
            which reads as three different kinds of thing.

            Nothing here is reserved for content that may not arrive, which is
            why the card is as short as it is: the description moved to the
            event page, where there is room for all of it rather than the first
            two lines, and a screen of events now fits more of them. */}
        {sorted.map((event) => {
          const pct = readiness(event)
          const tone = statusTone[event.status]
          return (
            <li key={event.id} className="h-full">
              <article className="event-tile group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
                {/* The readiness ring sits on the artwork rather than on a row
                    of its own. It was costing the card a whole line of height
                    for one number, and the gap it left between the status, the
                    title and the date was the most visible thing on the
                    screen. Overlapping the edge also ties the two halves of
                    the card together, which the flat strip did not. */}
                <div className="relative shrink-0">
                  <EventArt theme={event.theme} className="event-tile__art h-12 w-full" />
                  <span className="absolute -bottom-4 right-4 z-10 rounded-full border border-border bg-surface p-0.5 shadow-sm">
                    <ReadinessGauge percent={pct} size={38} stroke={4} />
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className="focus-ring relative z-10 flex flex-1 flex-col px-5 pb-3 pt-3 text-left"
                >
                  <span className="pr-14">
                    <StatusPill label={event.status} tone={tone} pulse={tone === 'live'} />
                  </span>
                  <h3 className="mt-2 line-clamp-2 min-h-[2.7rem] font-display text-lg font-bold leading-[1.2] tracking-tight transition-colors duration-200 group-hover:text-accent">
                    {event.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 font-mono text-xs">
                    <span className="tabular text-ink-soft">
                      {formatDateRange(event.date, event.endDate)}
                      {event.startTime && `, ${formatTime(event.startTime)}`}
                    </span>
                    <span className="text-border">&middot;</span>
                    <TMinusLabel dateStr={event.date} today={today} />
                  </div>
                  {/* A missing venue used to render as nothing, which moved
                      everything below it up by a line. The placeholder keeps
                      the rhythm and says the same thing the event page says. */}
                  <p className="mt-1.5 truncate text-sm text-ink-soft">
                    {event.venue || <span className="italic opacity-70">Venue to be confirmed</span>}
                  </p>
                </button>
                <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-border-soft bg-paper/50 px-5 py-2">
                  <span className="truncate text-xs text-ink-soft">
                    {event.lead ? (
                      <>
                        Lead: <span className="font-medium text-ink">{event.lead}</span>
                      </>
                    ) : (
                      <span className="italic">No lead assigned</span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-md border border-border-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    {event.org}
                  </span>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}

function SummaryStat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <p
        className="font-display tabular mt-0.5 text-3xl font-bold leading-none tracking-tight"
        style={tone === 'live' ? { color: 'var(--live)' } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
