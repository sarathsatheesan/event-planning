import { useEffect, useState } from 'react'
import { previewMondayReminders } from '../lib/firebase.js'

/**
 * The dry run of Monday morning.
 *
 * Reads live data through a function that binds no SMTP secret, so nothing here
 * can reach an inbox. Three questions, in the order they bite:
 *
 *   Who gets an email, and what will the subject line say?
 *   Who gets silence — and is that because they are genuinely clear?
 *   Which work reaches nobody at all?
 *
 * That last one is the reason this screen exists. Unowned milestones are at
 * least visible in the app; a milestone assigned to a typed name that matches
 * nobody on the roster *looks* assigned and is chased by no one.
 */
export default function ReminderPreviewDialog({ onClose }) {
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let live = true
    previewMondayReminders()
      .then((data) => live && setPlan(data))
      .catch((err) => live && setError(err?.message ?? 'Could not read the preview.'))
    return () => {
      live = false
    }
  }, [])

  const receiving = plan?.people.filter((p) => p.willSend) ?? []
  const silent = plan?.people.filter((p) => !p.willSend) ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preview Monday's reminders"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Monday’s reminders</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Exactly what the 8am Monday run would send, from live data. Nothing is sent — this
          cannot email anyone.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        {!plan && !error && <p className="mt-4 text-sm text-ink-soft">Reading the calendar…</p>}

        {plan && (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Emails sent', receiving.length],
                ['Nobody notified', plan.totals.unowned + plan.totals.orphaned],
                ['Overdue', plan.totals.overdue],
                ['Due this week', plan.totals.soon],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border-soft px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</dt>
                  <dd className="font-display text-xl font-bold text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <Section title={`Would be emailed (${receiving.length})`}>
              {receiving.length === 0 ? (
                <Empty>
                  Nobody. Every open milestone is either unowned or assigned to a name that is
                  not on the committee, so the personal run has nobody to write to.
                </Empty>
              ) : (
                receiving.map((p) => (
                  <li key={p.email} className="py-1.5">
                    <span className="text-sm font-semibold text-ink">{p.name || p.email}</span>
                    {p.isAdmin && (
                      <span className="ml-1.5 rounded bg-surface-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                        also gets the overview
                      </span>
                    )}
                    <span className="block text-xs text-ink-soft">
                      {p.subject} · {p.events} event{p.events === 1 ? '' : 's'}
                    </span>
                  </li>
                ))
              )}
            </Section>

            <Section title={`Gets nothing (${silent.length})`}>
              {silent.length === 0 ? (
                <Empty>Everyone on the committee owes something.</Empty>
              ) : (
                <li className="py-1.5 text-sm text-ink-soft">
                  {silent.map((p) => p.name || p.email).join(', ')} — nothing overdue or due within
                  seven days.
                </li>
              )}
            </Section>

            {plan.orphaned.length > 0 && (
              <Section title={`Assigned to nobody real (${plan.totals.orphaned})`}>
                <li className="pb-1 text-xs text-ink-soft">
                  These milestones carry a name that matches no committee member, so they look
                  assigned in the app and are chased by no one. Add the person to the committee,
                  or re-pick the owner.
                </li>
                {plan.orphaned.map((o) => (
                  <li key={o.name} className="py-1.5">
                    <span className="text-sm font-semibold text-ink">{o.name}</span>
                    <span className="block text-xs text-ink-soft">
                      {o.count} milestone{o.count === 1 ? '' : 's'} · {o.events.join(', ')}
                    </span>
                  </li>
                ))}
              </Section>
            )}

            {plan.totals.unowned > 0 && (
              <Section title={`Unassigned (${plan.totals.unowned})`}>
                <li className="py-1.5 text-sm text-ink-soft">
                  Visible to admins on the shared overview, and to nobody else. Pick an owner and
                  they move onto that person’s Monday list.
                </li>
              </Section>
            )}

            <Section title="The shared overview">
              <li className="py-1.5 text-sm text-ink-soft">
                {plan.overview
                  ? `${plan.overview.recipients.join(', ')} — "${plan.overview.subject}"`
                  : 'Nothing to report, so no overview would be sent.'}
              </li>
            </Section>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      <ul className="mt-1 divide-y divide-border-soft">{children}</ul>
    </section>
  )
}

function Empty({ children }) {
  return <li className="py-1.5 text-sm text-ink-soft">{children}</li>
}
