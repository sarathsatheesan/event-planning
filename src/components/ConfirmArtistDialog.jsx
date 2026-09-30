import { useEffect, useState } from 'react'

/**
 * Confirming a group is the moment money gets committed, so it asks for the
 * reasoning and will not proceed without it. Six months later, when someone
 * asks why this group and not the cheaper one, the answer is on the record
 * instead of in somebody's memory of a meeting.
 */
export default function ConfirmArtistDialog({ artist, replacing, onConfirm, onClose }) {
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = rationale.trim()
    if (trimmed.length < 3) {
      setError('Say why this group — a few words is enough.')
      return
    }
    onConfirm(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Confirm artist selection"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Select {artist.name}?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {replacing ? (
            <>
              This replaces <span className="font-semibold text-ink">{replacing.name}</span> as the
              selected group. The previous reasoning is overwritten.
            </>
          ) : (
            <>
              They become the confirmed group for this event. The other candidates stay on the
              board.
            </>
          )}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs">
          <div>
            <dt className="text-ink-soft">Performers</dt>
            <dd className="tabular font-semibold text-ink">{artist.headcount ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Honorarium</dt>
            <dd className="tabular font-semibold text-ink">
              {artist.honorarium == null ? '—' : `$${artist.honorarium.toLocaleString('en-US')}`}
            </dd>
          </div>
        </dl>

        <label className="mt-4 flex flex-col gap-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Why this group?
          </span>
          <textarea
            rows={3}
            autoFocus
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Strongest classical programme of the three, and the only group that can cover both the morning and evening slots within budget."
            className="focus-ring w-full resize-y rounded-md border border-border bg-paper px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
          />
        </label>

        {error && <p className="mt-2 text-xs font-medium text-critical">{error}</p>}

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
            Confirm selection
          </button>
        </div>
      </form>
    </div>
  )
}
