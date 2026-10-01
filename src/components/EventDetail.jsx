import { useState } from 'react'
import { statusTone, readiness } from '../data/events.js'
import StatusPill from './StatusPill.jsx'
import ReadinessGauge from './ReadinessGauge.jsx'
import EditableDate from './EditableDate.jsx'
import { InlineField, NumberField } from './fields.jsx'
import ExportDialog from './ExportDialog.jsx'
import EventArt from './EventArt.jsx'
import { useEditable } from '../lib/editing.js'
import PreEventPlanning from './tabs/PreEventPlanning.jsx'
import ArtistSelection from './tabs/ArtistSelection.jsx'
import DayOfCommandCenter from './tabs/DayOfCommandCenter.jsx'
import VendorDirectory from './tabs/VendorDirectory.jsx'
import PostEventWrapUp from './tabs/PostEventWrapUp.jsx'

const TABS = [
  { key: 'preevent', label: 'Pre-Event Planning', phase: 'Phase 1' },
  { key: 'dayof', label: 'Day-Of Command Center', phase: 'Phase 2' },
  { key: 'vendors', label: 'Vendor & Resource Directory', phase: 'Phase 3' },
  { key: 'wrapup', label: 'Post-Event Wrap-Up', phase: 'Phase 4' },
]

/**
 * Artist selection leads, because booking the performers is what the rest of
 * the plan hangs off — the run of show, the budget and half the T-60
 * milestones cannot be settled until a group is confirmed. It is shown for
 * events that use it, plus to editors who might want to switch it on; a
 * read-only visitor looking at a blood drive never sees it.
 */
function tabsFor(event, editable) {
  if (!event.needsArtists && !editable) return TABS
  return [{ key: 'artists', label: 'Artist Selection' }, ...TABS]
}

export default function EventDetail({
  event,
  originalDate,
  today,
  onBack,
  onChange,
  onReset,
  currentUserEmail,
}) {
  const editable = useEditable()
  const defaultTab = event.status === 'Live Today' ? 'dayof' : event.status === 'Completed' ? 'wrapup' : 'preevent'
  const [tab, setTab] = useState(defaultTab)
  const [exporting, setExporting] = useState(false)
  const tabs = tabsFor(event, editable)
  // Switching artists off while its tab is open would otherwise show nothing.
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'preevent'
  const pct = readiness(event)
  const tone = statusTone[event.status]

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="focus-ring inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-accent"
        >
          <span aria-hidden="true">&larr;</span> All events
        </button>
        <button
          type="button"
          onClick={() => setExporting(true)}
          className="focus-ring rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
        >
          Export PDF
        </button>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
        <EventArt theme={event.theme} className="h-20 w-full sm:h-24" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <StatusPill label={event.status} tone={tone} pulse={tone === 'live'} />
            <EditableDate
              value={event.date}
              endDate={event.endDate}
              startTime={event.startTime}
              original={originalDate}
              onChange={(date) => onChange({ date })}
              onTimeChange={(startTime) => onChange({ startTime })}
              onReset={onReset}
            />
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{event.name}</h1>
          {/* Real events arrive with gaps. Rather than hiding what is missing,
              every field is an input with a placeholder naming what belongs there. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-ink-soft">
            <InlineField
              value={event.venue}
              onChange={(v) => onChange({ venue: v || null })}
              placeholder="Add a venue"
              className="w-52 text-sm text-ink-soft"
            />
            <span aria-hidden="true">·</span>
            <span>Lead</span>
            <InlineField
              value={event.lead}
              onChange={(v) => onChange({ lead: v || null })}
              placeholder="Unassigned"
              className="w-32 text-sm text-ink-soft"
            />
            <span aria-hidden="true">·</span>
            <span>Est. attendance</span>
            <NumberField
              value={event.attendanceEst}
              onChange={(v) => onChange({ attendanceEst: v })}
              placeholder="—"
              className="w-20 text-sm text-ink-soft"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="text-right">
            <p className="flex items-center gap-1 font-mono text-sm font-semibold">
              <NumberField
                value={event.spent}
                onChange={(v) => onChange({ spent: v })}
                placeholder="0"
                prefix="$"
                className="w-20 text-sm"
              />
              <span className="text-ink-soft">/</span>
              <NumberField
                value={event.budget}
                onChange={(v) => onChange({ budget: v })}
                placeholder="0"
                prefix="$"
                className="w-20 text-sm text-ink-soft"
              />
            </p>
            <p className="text-xs text-ink-soft">budget spent</p>
          </div>
          <ReadinessGauge percent={pct} size={60} stroke={6} />
        </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`focus-ring relative whitespace-nowrap px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === t.key ? 'text-accent' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.phase && (
              <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
                {t.phase}
              </span>
            )}
            {t.label}
            {activeTab === t.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'preevent' && (
          <PreEventPlanning
            event={event}
            onChecklistChange={(checklist, undoLabel) => onChange({ checklist }, undoLabel)}
          />
        )}
        {activeTab === 'artists' && (
          <ArtistSelection event={event} onChange={onChange} currentUserEmail={currentUserEmail} />
        )}
        {activeTab === 'dayof' && (
          <DayOfCommandCenter
            event={event}
            today={today}
            onRunOfShowChange={(runOfShow, undoLabel) => onChange({ runOfShow }, undoLabel)}
          />
        )}
        {activeTab === 'vendors' && (
          <VendorDirectory
            event={event}
            onVendorsChange={(vendors, undoLabel) => onChange({ vendors }, undoLabel)}
          />
        )}
        {activeTab === 'wrapup' && (
          <PostEventWrapUp
            event={event}
            onRetroChange={(retro, undoLabel) => onChange({ retro }, undoLabel)}
          />
        )}
      </div>

      {exporting && <ExportDialog event={event} onClose={() => setExporting(false)} />}
    </div>
  )
}
