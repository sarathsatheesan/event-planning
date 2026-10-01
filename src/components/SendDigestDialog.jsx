import { useEffect, useState } from 'react'

/**
 * Confirms an ad-hoc send.
 *
 * Sending is not undoable and it spends the committee's attention, so it asks
 * once and says exactly who will receive it. The same email the Monday
 * schedule would produce — there is one code path, so a manual push cannot
 * quietly differ from the automatic one.
 */
export default function SendDigestDialog({ recipientCount, busy, onSend, onClose }) {
  const [scope, setScope] = useState('upcoming')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  const options = [
    {
      key: 'upcoming',
      label: 'This week',
      detail: 'Overdue and due within 7 days, plus events in the next fortnight. What the Monday email sends.',
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
          Goes to{' '}
          <span className="font-semibold text-ink">
            {recipientCount} committee member{recipientCount === 1 ? '' : 's'}
          </span>{' '}
          now, from the ICC address. This cannot be unsent.
        </p>

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
          If there is nothing overdue, due soon or coming up, no email is sent and you will be told
          so.
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
            onClick={() => onSend(scope)}
            disabled={busy || recipientCount === 0}
            className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  )
}
