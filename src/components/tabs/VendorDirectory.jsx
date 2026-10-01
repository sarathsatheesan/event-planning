import { InlineField, NumberField, RemoveButton, AddButton } from '../fields.jsx'

const BLANK = {
  name: '',
  role: '',
  contact: '',
  phone: '',
  loadIn: '',
  balance: 0,
  contractUrl: '',
}

export default function VendorDirectory({ event, onVendorsChange }) {
  const vendors = event.vendors ?? []
  const outstanding = vendors.reduce((sum, v) => sum + (v.balance ?? 0), 0)

  function patchVendor(index, patch) {
    onVendorsChange(vendors.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No vendors logged</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Suppliers and resource contacts for {event.name} go here — load-in windows, phone
          numbers, and any outstanding balances.
        </p>
        <div className="mt-2 w-64">
          <AddButton onClick={() => onVendorsChange([{ ...BLANK }])}>Add the first vendor</AddButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {vendors.length} vendor{vendors.length === 1 ? '' : 's'} &amp; resource contacts for this
          event.
        </p>
        <p className="text-sm">
          <span className="text-ink-soft">Outstanding balances: </span>
          <span
            className={`font-mono tabular font-semibold ${
              outstanding > 0 ? 'text-warning' : 'text-success'
            }`}
          >
            ${outstanding.toLocaleString()}
          </span>
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {vendors.map((v, i) => (
          <li key={i} className="flex flex-col rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <InlineField
                  value={v.name}
                  onChange={(val) => patchVendor(i, { name: val })}
                  placeholder="Vendor name"
                  className="w-full font-display text-base font-bold text-ink"
                />
                <InlineField
                  value={v.role}
                  onChange={(val) => patchVendor(i, { role: val })}
                  placeholder="What they provide"
                  className="mt-0.5 w-full text-xs text-ink-soft"
                />
              </div>
              <RemoveButton
                onClick={() => onVendorsChange(vendors.filter((_, j) => j !== i), 'Vendor removed.')}
                title="Remove this vendor"
              />
            </div>

            <dl className="mt-1 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-sm">
              <dt className="text-ink-soft">Contact</dt>
              <dd>
                <InlineField
                  value={v.contact}
                  onChange={(val) => patchVendor(i, { contact: val })}
                  placeholder="Who we deal with"
                  className="w-full text-sm text-ink"
                />
              </dd>
              <dt className="text-ink-soft">Phone</dt>
              <dd>
                <InlineField
                  type="tel"
                  value={v.phone}
                  onChange={(val) => patchVendor(i, { phone: val })}
                  placeholder="Phone"
                  className="w-full font-mono text-sm text-ink"
                />
              </dd>
              <dt className="text-ink-soft">Load-in</dt>
              <dd>
                <InlineField
                  value={v.loadIn}
                  onChange={(val) => patchVendor(i, { loadIn: val })}
                  placeholder="When they arrive"
                  className="w-full font-mono text-sm text-ink"
                />
              </dd>
              <dt className="text-ink-soft">Balance</dt>
              <dd>
                <NumberField
                  value={v.balance}
                  onChange={(val) => patchVendor(i, { balance: val ?? 0 })}
                  placeholder="0"
                  prefix="$"
                  className={`w-24 text-sm font-semibold ${
                    (v.balance ?? 0) > 0 ? 'text-warning' : 'text-success'
                  }`}
                />
              </dd>
              <dt className="text-ink-soft">Contract</dt>
              <dd>
                <InlineField
                  type="url"
                  value={v.contractUrl}
                  onChange={(val) => patchVendor(i, { contractUrl: val })}
                  placeholder="Link to the contract"
                  className="w-full text-sm text-accent"
                />
              </dd>
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <AddButton onClick={() => onVendorsChange([...vendors, { ...BLANK }])}>
          Add a vendor
        </AddButton>
      </div>
    </div>
  )
}
