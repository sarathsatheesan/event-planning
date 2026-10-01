import { useEffect, useMemo, useState } from 'react'
import { describeSource } from '../data/blueprint.js'

/**
 * Create an event, optionally from a previous one.
 *
 * The "start from" choice is the useful part. Most of the ICC calendar repeats
 * every year, so last year's event already holds the right milestones, the
 * right vendors and the right run of show — what it does not hold is this
 * year's dates or a clean set of statuses.
 */

const FIELD =
  'focus-ring w-full rounded-md border border-border bg-paper px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-soft/60'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-ink-soft'

function labelFor(event) {
  const when = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${event.name} — ${when}`
}

export default function NewEventDialog({ events, onCreate, onClose }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [error, setError] = useState(null)

  // Most recent first: last year's running of an event is the one worth copying.
  const sources = useMemo(
    () => [...events].sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  )
  const source = sources.find((e) => e.id === sourceId) ?? null
  const summary = describeSource(source)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the event a name.')
      return
    }
    if (!date) {
      setError('Pick the date it happens.')
      return
    }
    onCreate({ name: trimmed, date, sourceId: sourceId || null })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-10"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Create an event"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">New event</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Start from the standard blueprint, or copy a previous event and let the dates re-space
          themselves.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Event name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Diwali Celebrations 2027"
              className={FIELD}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={LABEL}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${FIELD} font-mono`}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={LABEL}>Start from</span>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className={FIELD}
            >
              <option value="">Standard template — 23 milestones</option>
              {sources.map((e) => (
                <option key={e.id} value={e.id}>
                  {labelFor(e)}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
            {source ? (
              <>
                Copies <span className="font-semibold text-ink">{summary}</span> from{' '}
                <span className="font-semibold text-ink">{source.name}</span>, along with its
                venue, owners and vendor contacts.
                <br />
                Every status resets to Not Started and due dates re-space around
                {date ? ' the new date' : ' the date you pick'}. Budget spend, the wrap-up and
                artist candidates do not carry over.
              </>
            ) : (
              <>
                Creates the standard 23-milestone blueprint — T-90 through T-1 — with due dates
                calculated from
                {date ? ' the date above' : ' the date you pick'}.
              </>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition"
          >
            Create event
          </button>
        </div>
      </form>
    </div>
  )
}
