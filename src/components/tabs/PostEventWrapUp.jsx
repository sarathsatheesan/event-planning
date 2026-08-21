export default function PostEventWrapUp({ event }) {
  if (!event.retro) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">Wrap-up not yet available</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Payment reconciliation, sponsor acknowledgments, and the lessons-learned log unlock once{' '}
          {event.name} moves to Completed.
        </p>
      </div>
    )
  }

  const { whatWorked, whatDidnt, sponsorAcks, finalReconciliation } = event.retro
  const variancePositive = finalReconciliation.variance >= 0

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-bold">Final Payment Reconciliation</h3>
        <div className="grid grid-cols-3 gap-4 font-mono tabular">
          <div>
            <p className="text-xs text-ink-soft">Budgeted</p>
            <p className="text-xl font-semibold">${finalReconciliation.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Spent</p>
            <p className="text-xl font-semibold">${finalReconciliation.spent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Variance</p>
            <p className={`text-xl font-semibold ${variancePositive ? 'text-success' : 'text-critical'}`}>
              {variancePositive ? '+' : '-'}${Math.abs(finalReconciliation.variance).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-bold">Sponsor Acknowledgments</h3>
        <ul className="flex flex-wrap gap-2">
          {sponsorAcks.map((s) => (
            <li key={s} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display mb-3 text-lg font-bold text-success">What worked</h3>
          <ul className="flex flex-col gap-2">
            {whatWorked.map((note, i) => (
              <li key={i} className="text-sm leading-snug text-ink">
                {note}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display mb-3 text-lg font-bold text-warning">What didn't — for next year's blueprint</h3>
          <ul className="flex flex-col gap-2">
            {whatDidnt.map((note, i) => (
              <li key={i} className="text-sm leading-snug text-ink">
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
