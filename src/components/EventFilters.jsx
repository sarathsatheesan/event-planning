import { useState } from 'react'
import { ALL, activeCount, yearsIn, orgsIn, statusesIn } from '../lib/filters.js'

/**
 * The calendar's filters.
 *
 * Desktop puts them on the same line as the heading, where they read as part of
 * the list rather than a separate screen. Below sm there is no room for four
 * controls and a heading, so they collapse behind a Filters button that carries
 * a count — a filtered list with its controls hidden is how people conclude
 * their events have vanished, and the count is what prevents that.
 *
 * Options come from the events themselves. A Year of 2029 that matches nothing
 * is a dead end, and offering a status nobody is in wastes a line.
 */

const CONTROL =
  'focus-ring rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink'

export default function EventFilters({ events, filters, onChange, knownOrgs = [] }) {
  const [open, setOpen] = useState(false)
  const active = activeCount(filters)
  const years = yearsIn(events)
  const orgs = orgsIn(events, knownOrgs)
  const statuses = statusesIn(events)

  const set = (patch) => onChange({ ...filters, ...patch })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${CONTROL} flex items-center gap-1.5 sm:hidden`}
      >
        Filters
        {active > 0 && (
          <span className="rounded bg-accent px-1.5 text-[10px] font-bold text-accent-ink">
            {active}
          </span>
        )}
        <span aria-hidden="true" className="text-ink-soft">
          {open ? '▴' : '▾'}
        </span>
      </button>

      <div
        className={`${open ? 'flex' : 'hidden'} w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center`}
      >
        <label className="relative">
          <span className="sr-only">Search events by name</span>
          <input
            type="search"
            list="eventops-event-names"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search events"
            className={`${CONTROL} w-full font-normal sm:w-44`}
          />
        </label>
        {/* Native typeahead: no dependency, and it still works on a phone. */}
        <datalist id="eventops-event-names">
          {[...new Set(events.map((e) => e.name))].sort().map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        {/* Org is the headline of this screen and has two values, so it gets
            buttons rather than a select — one tap instead of three. */}
        <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
          {[ALL, ...orgs].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => set({ org: value })}
              aria-pressed={filters.org === value}
              className={`focus-ring rounded px-2 py-0.5 text-xs font-semibold transition ${
                filters.org === value ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {value === ALL ? 'All orgs' : value}
            </button>
          ))}
        </div>

        <select
          value={filters.year}
          onChange={(e) => set({ year: e.target.value })}
          aria-label="Filter by year"
          className={CONTROL}
        >
          <option value={ALL}>All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          aria-label="Filter by status"
          className={CONTROL}
        >
          <option value={ALL}>Any status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange({ q: '', year: ALL, org: ALL, status: ALL })}
            className="focus-ring self-start rounded-md px-2 py-1 text-xs font-semibold text-ink-soft underline-offset-2 transition hover:text-ink hover:underline sm:self-auto"
          >
            Clear
          </button>
        )}
      </div>
    </>
  )
}
