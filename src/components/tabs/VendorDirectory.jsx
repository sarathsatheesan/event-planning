export default function VendorDirectory({ event }) {
  const vendors = event.vendors ?? []
  const outstanding = vendors.reduce((sum, v) => sum + v.balance, 0)

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No vendors logged</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Suppliers and resource contacts for {event.name} go here — load-in windows, phone
          numbers, and any outstanding balances.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {vendors.length} vendors &amp; resource contacts for this event.
        </p>
        <p className="text-sm">
          <span className="text-ink-soft">Outstanding balances: </span>
          <span className={`font-mono tabular font-semibold ${outstanding > 0 ? 'text-warning' : 'text-success'}`}>
            ${outstanding.toLocaleString()}
          </span>
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {vendors.map((v) => (
          <li
            key={v.name}
            className="flex flex-col rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold leading-tight">{v.name}</h3>
                <p className="text-xs text-ink-soft">{v.role}</p>
              </div>
              {v.balance > 0 ? (
                <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
                  ${v.balance.toLocaleString()} due
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  Paid
                </span>
              )}
            </div>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink-soft">Contact</dt>
              <dd className="font-medium text-ink">{v.contact}</dd>
              <dt className="text-ink-soft">Phone</dt>
              <dd className="font-mono tabular text-ink">{v.phone}</dd>
              <dt className="text-ink-soft">Load-in</dt>
              <dd className="font-mono tabular text-ink">{v.loadIn}</dd>
            </dl>
            <a
              href={v.contractUrl}
              className="focus-ring mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              View contract &rarr;
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
