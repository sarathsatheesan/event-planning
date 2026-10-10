import { useEffect, useMemo, useState } from 'react'

/**
 * Confirms an ad-hoc send.
 *
 * Sending is not undoable and it spends the committee's attention, so it asks
 * once and says exactly who will receive it — and nobody is ticked to begin
 * with. Sending to the whole committee should be a thing somebody chose, not
 * the thing that happens when a dialog is dismissed with the primary button.
 *
 * This is the shared list — one email, everyone's work on it. The Monday run
 * does something different now: each member gets only their own milestones and
 * admins get this overview as well. Both are built by the same function from
 * the same data, so the two can disagree about what is due only if the calendar
 * changed in between.
 */
export default function SendDigestDialog({ members = [], busy, onSend, onClose }) {
  const [scope, setScope] = useState('upcoming')
  const [chosen, setChosen] = useState(() => new Set())

  const roster = useMemo(
    () =>
      members
        .filter((m) => m?.email)
        .map((m) => ({ email: String(m.email).toLowerCase(), label: m.label || m.name || m.email })),
    [members]
  )
  const picked = roster.filter((m) => chosen.has(m.email))
  const toggle = (email) =>
    setChosen((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const options = [
    {
      key: 'upcoming',
      label: 'This week',
      detail:
        'Overdue and due within 7 days, plus events in the next fortnight.',
    },
    {
      key: 'all',
      label: 'Everything',
      detail: 'Also includes events already past. Useful for a full sweep before a committee meeting.',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Email the committee"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Email the committee</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Goes out now, from the committee address, to the people you tick below. This cannot be
          unsent.
        </p>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Send to{picked.length > 0 ? ` · ${picked.length} of ${roster.length}` : ''}
          </span>
          <span className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setChosen(new Set(roster.map((m) => m.email)))}
              className="focus-ring rounded font-semibold text-accent transition hover:underline"
            >
              Select all
            </button>
            {picked.length > 0 && (
              <button
                type="button"
                onClick={() => setChosen(new Set())}
                className="focus-ring rounded font-semibold text-ink-soft transition hover:text-ink hover:underline"
              >
                Clear
              </button>
            )}
          </span>
        </div>
        <ul className="mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border-soft">
          {roster.map((m, i) => (
            <li key={m.email}>
              <label
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm transition hover:bg-paper/60 ${
                  i !== roster.length - 1 ? 'border-b border-border-soft' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={chosen.has(m.email)}
                  onChange={() => toggle(m.email)}
                  className="focus-ring h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1 truncate text-ink">{m.label}</span>
                <span className="shrink-0 truncate text-xs text-ink-soft">{m.email}</span>
              </label>
            </li>
          ))}
        </ul>

        <ul className="mt-4 flex flex-col gap-1">
          {options.map((o) => (
            <li key={o.key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-soft px-3 py-2.5 transition hover:border-border">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === o.key}
                  onChange={() => setScope(o.key)}
                  className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{o.label}</span>
                  <span className="block text-xs leading-snug text-ink-soft">{o.detail}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-ink-soft">
          Everyone ticked gets the same shared list — everybody's milestones, including the ones
          nobody owns — so it shows more than a volunteer can open in the app. If there is nothing
          overdue, due soon or coming up, no email is sent and you will be told so. Separately,
          every Monday each member is emailed their own milestones and admins get this overview.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSend(scope, picked.map((m) => m.email))}
            disabled={busy || picked.length === 0}
            className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Sending…' : picked.length > 0 ? `Send to ${picked.length}` : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  )
}
