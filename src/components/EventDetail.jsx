import { useState } from 'react'
import { statusTone, readiness } from '../data/events.js'
import StatusPill from './StatusPill.jsx'
import ReadinessGauge from './ReadinessGauge.jsx'
import PreEventPlanning from './tabs/PreEventPlanning.jsx'
import DayOfCommandCenter from './tabs/DayOfCommandCenter.jsx'
import VendorDirectory from './tabs/VendorDirectory.jsx'
import PostEventWrapUp from './tabs/PostEventWrapUp.jsx'

const TABS = [
  { key: 'preevent', label: 'Pre-Event Planning', phase: 'Phase 1' },
  { key: 'dayof', label: 'Day-Of Command Center', phase: 'Phase 2' },
  { key: 'vendors', label: 'Vendor & Resource Directory', phase: 'Phase 3' },
  { key: 'wrapup', label: 'Post-Event Wrap-Up', phase: 'Phase 4' },
]

export default function EventDetail({ event, today, onBack }) {
  const defaultTab = event.status === 'Live Today' ? 'dayof' : event.status === 'Completed' ? 'wrapup' : 'preevent'
  const [tab, setTab] = useState(defaultTab)
  const pct = readiness(event)
  const tone = statusTone[event.status]

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <button
        type="button"
        onClick={onBack}
        className="focus-ring mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-accent"
      >
        <span aria-hidden="true">&larr;</span> All events
      </button>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill label={event.status} tone={tone} pulse={tone === 'live'} />
            <span className="font-mono text-xs text-ink-soft">
              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{event.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {event.venue} &middot; Lead: {event.lead} &middot; Est. attendance{' '}
            {event.attendanceEst.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="text-right">
            <p className="font-mono tabular text-sm font-semibold">
              ${event.spent.toLocaleString()}{' '}
              <span className="text-ink-soft">/ ${event.budget.toLocaleString()}</span>
            </p>
            <p className="text-xs text-ink-soft">budget spent</p>
          </div>
          <ReadinessGauge percent={pct} size={60} stroke={6} />
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`focus-ring relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'text-accent' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
              {t.phase}
            </span>
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === 'preevent' && <PreEventPlanning event={event} />}
        {tab === 'dayof' && <DayOfCommandCenter event={event} today={today} />}
        {tab === 'vendors' && <VendorDirectory event={event} />}
        {tab === 'wrapup' && <PostEventWrapUp event={event} />}
      </div>
    </div>
  )
}
