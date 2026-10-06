import { useMemo, useState } from 'react'
import { InlineField, InlineSelect, RemoveButton, AddButton } from '../fields.jsx'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'

/**
 * The business and craft booths — the stalls that sell jewellery, henna,
 * insurance and HVAC, as distinct from the food stalls next door.
 *
 * Same shape as the sponsor pipeline: eleven columns is too many for a row,
 * so the row carries what you scan by and the rest opens on a tap. Keeping the
 * two tabs built the same way is deliberate; a committee member who has
 * learned one has learned both.
 */

// The conversation, in the order it goes. The sheet only ever used three of
// these; the rest are the states it had no word for.
const STATUSES = [
  '',
  'Invited',
  'No Response',
  'Not Participating',
  'Confirmed',
  'Waitlisted',
  'Cancelled',
]

const PAYMENTS = ['', 'Not paid', 'Partial', 'Paid', 'Waived', 'Refunded']

// Pitches on the field. A closed list because a booth number is a position,
// not a note, and two vendors sent to the same one is a morning wasted.
const BOOTHS = ['', ...Array.from({ length: 25 }, (_, i) => String(i + 1))]

const BLANK = {
  requestor: '',
  business: '',
  email: '',
  phone: '',
  nonProfit: false,
  logo: false,
  booth: '',
  status: '',
  payment: '',
  taxId: '',
  services: '',
  comments: '',
}

const NONE = Object.freeze([])

const STATUS_TONE = {
  Confirmed: 'border-success/50 bg-success-soft/40 text-success',
  Invited: 'border-accent/50 bg-accent-soft/50 text-accent',
  Waitlisted: 'border-warning/50 bg-warning-soft/40 text-warning',
  'No Response': 'border-warning/50 bg-warning-soft/40 text-warning',
  'Not Participating': 'border-border bg-paper text-ink-soft',
  Cancelled: 'border-border bg-paper text-ink-soft',
}

export default function BusinessVendors({ event, onVendorsChange }) {
  const editable = useEditable()
  const vendors = event.businessVendors ?? NONE
  const [open, setOpen] = useState(() => new Set())
  const [filter, setFilter] = useState('All')

  // Two vendors sent to the same pitch is the kind of mistake that is obvious
  // on the day and invisible on the page, so it is counted here.
  const clashingBooths = useMemo(() => {
    const seen = new Map()
    for (const v of vendors) {
      if (!v.booth) continue
      seen.set(v.booth, (seen.get(v.booth) ?? 0) + 1)
    }
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([b]) => b))
  }, [vendors])

  const counts = useMemo(() => {
    let confirmed = 0
    let paid = 0
    let unplaced = 0
    for (const v of vendors) {
      if (v.status === 'Confirmed') {
        confirmed++
        if (!v.booth) unplaced++
      }
      if (v.payment === 'Paid') paid++
    }
    return { confirmed, paid, unplaced }
  }, [vendors])

  const shown = vendors.filter((v) => {
    if (filter === 'All') return true
    if (filter === 'Unpaid') return v.status === 'Confirmed' && v.payment !== 'Paid'
    if (filter === 'No booth') return v.status === 'Confirmed' && !v.booth
    return v.status === filter
  })

  function patch(id, change) {
    onVendorsChange(vendors.map((v) => (v.id === id ? { ...v, ...change } : v)))
  }
  function add() {
    const id = nextId(vendors)
    onVendorsChange([...vendors, { ...BLANK, id }])
    setOpen((prev) => new Set(prev).add(id))
  }
  function toggle(id) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No business vendors yet</p>
        <p className="max-w-sm text-sm text-ink-soft">
          The jewellery, henna, craft and service booths — who asked for one, whether they are
          confirmed and paid, and which pitch they are on.
        </p>
        {editable && (
          <div className="mt-2 w-64">
            <AddButton onClick={add}>Add the first vendor</AddButton>
          </div>
        )}
      </div>
    )
  }

  const FILTERS = ['All', 'Confirmed', 'Unpaid', 'No booth', 'No Response', 'Not Participating']

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`focus-ring rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  filter === f
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-ink-soft hover:border-ink-soft'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {editable && (
            <button
              type="button"
              onClick={add}
              className="focus-ring whitespace-nowrap rounded-md border border-dashed border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
            >
              + Add a vendor
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs text-ink-soft">
          <span>
            <span className="tabular font-semibold text-ink">{vendors.length}</span> asked
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{counts.confirmed}</span> confirmed
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{counts.paid}</span> paid
          </span>
          {counts.unplaced > 0 && (
            <span className="font-semibold text-warning">
              {counts.unplaced} confirmed with no booth
            </span>
          )}
          {clashingBooths.size > 0 && (
            <span className="font-semibold text-critical">
              booth {[...clashingBooths].join(', ')} given to more than one vendor
            </span>
          )}
        </div>
      </div>

      <div className="mb-1 hidden items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:flex">
        <span className="min-w-0 flex-1">Business</span>
        <span className="w-40">Requestor</span>
        <span className="w-36">Status</span>
        <span className="w-24">Payment</span>
        <span className="w-20 text-right">Booth</span>
        <span className="w-6" aria-hidden="true" />
      </div>

      <ul className="flex flex-col gap-1.5">
        {shown.map((v) => {
          const isOpen = open.has(v.id)
          const clash = v.booth && clashingBooths.has(v.booth)
          return (
            <li
              key={v.id}
              className={`relative rounded-xl border bg-surface ${
                clash ? 'border-critical/50' : 'border-border'
              }`}
            >
              <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <InlineField
                    value={v.business}
                    onChange={(x) => patch(v.id, { business: x })}
                    placeholder="Business or stall"
                    className="w-full font-semibold text-ink"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <InlineField
                    value={v.requestor}
                    onChange={(x) => patch(v.id, { requestor: x })}
                    placeholder="Requestor"
                    className="w-full text-xs text-ink-soft"
                  />
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className="w-36">
                    <InlineSelect
                      value={v.status ?? ''}
                      onChange={(x) => patch(v.id, { status: x })}
                      options={STATUSES}
                      ariaLabel="Status"
                      placeholder="Status"
                      className={`w-full rounded-full border px-2 text-xs font-semibold ${
                        STATUS_TONE[v.status] ?? 'border-border text-ink-soft'
                      }`}
                    />
                  </span>
                  <span className="w-24">
                    <InlineSelect
                      value={v.payment ?? ''}
                      onChange={(x) => patch(v.id, { payment: x })}
                      options={PAYMENTS}
                      ariaLabel="Payment"
                      placeholder="Payment"
                      className="w-full text-xs text-ink"
                    />
                  </span>
                  <span className="w-20 text-right">
                    <InlineSelect
                      value={v.booth ?? ''}
                      onChange={(x) => patch(v.id, { booth: x })}
                      options={BOOTHS}
                      ariaLabel="Booth number"
                      placeholder="Booth"
                      className={`w-full text-xs font-semibold ${
                        clash ? 'text-critical' : 'text-ink'
                      }`}
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(v.id)}
                    aria-expanded={isOpen}
                    aria-label={`Details for ${v.business || v.requestor || 'this vendor'}`}
                    className="focus-ring w-6 shrink-0 rounded text-ink-soft"
                  >
                    {isOpen ? '▴' : '▾'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border-soft px-3 py-3">
                  <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
                    <dt className="text-ink-soft">Email</dt>
                    <dd>
                      <InlineField
                        type="email"
                        value={v.email}
                        onChange={(x) => patch(v.id, { email: x })}
                        placeholder="name@example.com"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Phone</dt>
                    <dd>
                      <InlineField
                        type="tel"
                        value={v.phone}
                        onChange={(x) => patch(v.id, { phone: x })}
                        placeholder="Phone"
                        className="w-full font-mono text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Tax ID</dt>
                    <dd>
                      <InlineField
                        value={v.taxId}
                        onChange={(x) => patch(v.id, { taxId: x })}
                        placeholder="Tax ID"
                        className="w-full font-mono text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Services</dt>
                    <dd>
                      <InlineField
                        value={v.services}
                        onChange={(x) => patch(v.id, { services: x })}
                        placeholder="What they are selling"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft sm:col-start-1">Comments</dt>
                    <dd className="sm:col-span-3">
                      <InlineField
                        value={v.comments}
                        onChange={(x) => patch(v.id, { comments: x })}
                        placeholder="Where the conversation got to"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {[
                      { key: 'nonProfit', label: 'Non-profit' },
                      { key: 'logo', label: 'Logo in' },
                    ].map((f) => (
                      <label
                        key={f.key}
                        className={`flex items-center gap-1.5 text-xs ${
                          v[f.key] ? 'text-ink' : 'text-ink-soft'
                        } ${editable ? 'cursor-pointer' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(v[f.key])}
                          disabled={!editable}
                          onChange={(e) => patch(v.id, { [f.key]: e.target.checked })}
                          className="focus-ring h-3.5 w-3.5 accent-[var(--accent)]"
                        />
                        {f.label}
                      </label>
                    ))}
                    {clash && (
                      <span className="text-xs font-semibold text-critical">
                        Booth {v.booth} is also given to another vendor
                      </span>
                    )}
                    {editable && (
                      <span className="ml-auto">
                        <RemoveButton
                          onClick={() =>
                            onVendorsChange(
                              vendors.filter((x) => x.id !== v.id),
                              'Vendor removed.'
                            )
                          }
                          title="Remove this vendor"
                        />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
          No vendors match this filter.
        </div>
      )}
    </div>
  )
}
