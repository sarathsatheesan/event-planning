import { useMemo, useState } from 'react'
import { InlineField, InlineSelect, NumberField, RemoveButton, AddButton } from '../fields.jsx'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'
import { findClashes, clashCounts, stallClashLevel } from '../../lib/menu.js'
import { CLASH_TONE } from '../../lib/clashTone.js'
import { ViewToggle } from '../KanbanBoard.jsx'
import MenuBoard from '../MenuBoard.jsx'
import MenuImportDialog from '../MenuImportDialog.jsx'

/**
 * Food stalls and their menus, for an event that sells food.
 *
 * Replaces two sheets in the committee's workbook that had to be read side by
 * side — "Food Vendors 2026" (who is coming and how far through the paperwork
 * they are) and "Food Menu2026" (what each sells, laid out as eight pairs of
 * columns across the page). Putting a stall's menu under the stall is the whole
 * point: the question asked at every meeting is "is anyone else selling that".
 */

// Every closed list in one place. These are the values the committee already
// uses in the workbook, not invented ones — free text in a column that only
// ever holds five values is how you end up with "Reg Org", "reg org" and
// "Registered Org" meaning the same thing and sorting differently.
const TYPES = ['', 'Reg Org', 'Friends', 'Restaurant', 'Temple', 'Non-Profit', 'Other']
const CONFIRMED = ['', 'Confirmed', 'Not this year']

// The paperwork trail, in the order the committee walks it.
const STEPS = [
  { key: 'attendedMeeting1', label: 'Meeting 1' },
  { key: 'attendedCityMeeting', label: 'City meeting' },
  { key: 'posMeeting', label: 'POS meeting' },
  { key: 'menuProvided', label: 'Menu in' },
  { key: 'poster', label: 'Poster' },
  { key: 'depositPaid', label: 'Deposit' },
  { key: 'stallPayment', label: 'Stall payment' },
  { key: 'finalSettlement', label: 'Settled' },
]

const BLANK_VENDOR = {
  stall: '',
  tradingName: '',
  contact: '',
  mobile: '',
  email: '',
  type: '',
  confirmed: '',
  specialRequests: '',
  attendedMeeting1: false,
  attendedCityMeeting: false,
  posMeeting: false,
  menuProvided: false,
  poster: false,
  depositPaid: false,
  stallPayment: false,
  finalSettlement: false,
  menu: [],
}

// A fresh [] every render would make the clash scan — which is O(n²) over
// eighty-odd items — run again on every keystroke. One frozen instance keeps
// the memo stable for an event that has no stalls.
const NO_VENDORS = Object.freeze([])

const money = (n) => (n == null || n === '' ? '—' : `$${Number(n).toFixed(2)}`)

/**
 * `simple` strips the tab back to a menu and nothing else.
 *
 * India Mela runs a food operation: two dozen stalls, a city meeting, a
 * deposit and a settlement, all of which have to be tracked. No other ICC
 * event does — a Navratri concert has a caterer and a price list. So
 * everywhere but the Mela this is a list of who is cooking, how to reach them,
 * and what they are selling; the type, the confirmation status, the special
 * requests and the eight-step paperwork trail are not shown, because there is
 * no paperwork to trail.
 *
 * Shown, not deleted: the fields stay on the record, so an event switched to
 * the full version later still has whatever was entered.
 */
export default function FoodStalls({
  event,
  onVendorsChange,
  view = 'list',
  onViewChange,
  simple = false,
}) {
  const editable = useEditable()
  const vendors = event.foodVendors ?? NO_VENDORS
  const [open, setOpen] = useState(() => new Set())
  const [filter, setFilter] = useState('All')
  // Which stall is having a menu imported into it, if any.
  const [importing, setImporting] = useState(null)

  const clashes = useMemo(() => findClashes(vendors), [vendors])
  const counts = clashCounts(clashes)
  const itemCount = vendors.reduce((n, v) => n + (v.menu?.length ?? 0), 0)
  const confirmedCount = vendors.filter((v) => v.confirmed === 'Confirmed').length

  const shown = vendors.filter((v) => {
    if (filter === 'All') return true
    if (filter === 'With a menu') return (v.menu?.length ?? 0) > 0
    return v.confirmed === filter
  })

  function patchVendor(id, patch) {
    onVendorsChange(vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }
  function patchItem(vendorId, itemId, patch) {
    patchVendor(vendorId, {
      menu: (vendors.find((v) => v.id === vendorId)?.menu ?? []).map((m) =>
        m.id === itemId ? { ...m, ...patch } : m
      ),
    })
  }
  function addVendor() {
    const id = nextId(vendors)
    onVendorsChange([...vendors, { ...BLANK_VENDOR, id }])
    setOpen((prev) => new Set(prev).add(id))
  }
  function addItem(vendor) {
    addItems(vendor, [{ item: '', price: null }])
  }
  /** One path for a typed dish and for eighty imported ones. */
  function addItems(vendor, entries) {
    const allItems = vendors.flatMap((v) => v.menu ?? [])
    let next = nextId(allItems)
    patchVendor(vendor.id, {
      menu: [...(vendor.menu ?? []), ...entries.map((e) => ({ id: next++, ...e }))],
    })
    setOpen((prev) => new Set(prev).add(vendor.id))
  }

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No food stalls yet</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Who is cooking at {event.name}, what they are selling and for how much — and a flag when
          two stalls turn up with the same dish.
        </p>
        {editable && (
          <div className="mt-2 w-64">
            <AddButton onClick={addVendor}>Add the first stall</AddButton>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div
            className={`flex flex-wrap gap-1.5 ${view === 'board' || simple ? 'hidden' : ''}`}
          >
            {['All', 'Confirmed', 'Not this year', 'With a menu'].map((f) => (
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
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink-soft">
              {simple ? (
                <>
                  <span className="tabular font-semibold text-ink">{vendors.length}</span>{' '}
                  {vendors.length === 1 ? 'stall' : 'stalls'}
                </>
              ) : (
                <>
                  <span className="tabular font-semibold text-ink">{confirmedCount}</span> of{' '}
                  <span className="tabular">{vendors.length}</span> stalls confirmed
                </>
              )}{' '}
              ·{' '}
              <span className="tabular font-semibold text-ink">{itemCount}</span> menu items
            </p>
            {onViewChange && (
              <ViewToggle view={view} onChange={onViewChange} boardLabel="Menu board" />
            )}
            {editable && (
              <button
                type="button"
                onClick={addVendor}
                className="focus-ring whitespace-nowrap rounded-md border border-dashed border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
              >
                + Add a stall
              </button>
            )}
          </div>
        </div>

        {(counts.duplicate > 0 || counts.similar > 0) && (
          <p className="rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs text-ink-soft">
            {counts.duplicate > 0 && (
              <span className="font-semibold text-critical">
                {counts.duplicate} item{counts.duplicate === 1 ? '' : 's'} offered at more than one
                stall
              </span>
            )}
            {counts.duplicate > 0 && counts.similar > 0 && ' · '}
            {counts.similar > 0 && (
              <span className="font-semibold text-warning">
                {counts.similar} near-match{counts.similar === 1 ? '' : 'es'} worth checking
              </span>
            )}
            {view === 'board' ? ' — the board shows which.' : ' — open a stall to see which.'}
          </p>
        )}
      </div>

      {view === 'board' ? (
        <div key="board" className="view-fade">
          <MenuBoard
            vendors={vendors}
            clashes={clashes}
            onItemChange={patchItem}
            onItemRemove={(vendorId, itemId) =>
              patchVendor(vendorId, {
                menu: (vendors.find((v) => v.id === vendorId)?.menu ?? []).filter(
                  (m) => m.id !== itemId
                ),
              })
            }
            onAddItem={(vendorId) => addItem(vendors.find((v) => v.id === vendorId))}
            onImport={(vendorId) => setImporting(vendors.find((v) => v.id === vendorId))}
          />
        </div>
      ) : (
        <div key="list" className="view-fade">
      <ul className="flex flex-col gap-3">
        {shown.map((vendor) => {
          const isOpen = open.has(vendor.id)
          const menu = vendor.menu ?? []
          const flagged = menu.filter((m) => clashes.has(m.id)).length
          // A stall whose dishes clash is tinted as a whole, so the ones
          // needing a phone call are visible without opening every card.
          const stallLevel = stallClashLevel(vendor, clashes)
          const stallTone = stallLevel ? CLASH_TONE[stallLevel] : null
          return (
            <li
              key={vendor.id}
              className={`rounded-xl border ${
                stallTone ? stallTone.card : 'border-border bg-surface'
              }`}
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <InlineField
                      value={vendor.stall}
                      onChange={(v) => patchVendor(vendor.id, { stall: v })}
                      placeholder="Stall or organisation"
                      className="w-full font-display text-base font-bold text-ink"
                    />
                    <InlineField
                      value={vendor.tradingName}
                      onChange={(v) => patchVendor(vendor.id, { tradingName: v })}
                      placeholder="Trading name on the day"
                      className="mt-0.5 w-full text-xs text-ink-soft"
                    />
                  </div>
                  <RemoveButton
                    onClick={() =>
                      onVendorsChange(
                        vendors.filter((v) => v.id !== vendor.id),
                        'Stall removed.'
                      )
                    }
                    title="Remove this stall"
                  />
                </div>

                <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
                  <dt className="text-ink-soft">Contact</dt>
                  <dd>
                    <InlineField
                      value={vendor.contact}
                      onChange={(v) => patchVendor(vendor.id, { contact: v })}
                      placeholder="Who we deal with"
                      className="w-full text-sm text-ink"
                    />
                  </dd>
                  <dt className="text-ink-soft">Mobile</dt>
                  <dd>
                    <InlineField
                      type="tel"
                      value={vendor.mobile}
                      onChange={(v) => patchVendor(vendor.id, { mobile: v })}
                      placeholder="Mobile"
                      className="w-full font-mono text-sm text-ink"
                    />
                  </dd>
                  <dt className="text-ink-soft">Email</dt>
                  <dd>
                    <InlineField
                      type="email"
                      value={vendor.email}
                      onChange={(v) => patchVendor(vendor.id, { email: v })}
                      placeholder="name@example.com"
                      className="w-full text-sm text-ink"
                    />
                  </dd>
                  {!simple && (
                    <>
                  <dt className="text-ink-soft">Type</dt>
                  <dd>
                    <InlineSelect
                      value={vendor.type}
                      onChange={(v) => patchVendor(vendor.id, { type: v })}
                      options={
                        vendor.type && !TYPES.includes(vendor.type)
                          ? [...TYPES, vendor.type]
                          : TYPES
                      }
                      ariaLabel="Vendor type"
                      className="text-sm text-ink"
                    />
                  </dd>
                  <dt className="text-ink-soft">Status</dt>
                  <dd>
                    <InlineSelect
                      value={vendor.confirmed}
                      onChange={(v) => patchVendor(vendor.id, { confirmed: v })}
                      options={CONFIRMED}
                      ariaLabel="Confirmed"
                      className="text-sm text-ink"
                    />
                  </dd>
                  {/* Starts its own row: a sentence does not belong in a
                      column sized for "Mobile". */}
                  <dt className="text-ink-soft sm:col-start-1">Requests</dt>
                  <dd className="sm:col-span-3">
                    <InlineField
                      value={vendor.specialRequests}
                      onChange={(v) => patchVendor(vendor.id, { specialRequests: v })}
                      placeholder="Power, extra tables, placement — anything they have asked for"
                      className="w-full text-sm text-ink"
                    />
                  </dd>
                    </>
                  )}
                </dl>

                {/* The paperwork trail. Checkboxes rather than a Y/blank column:
                    the sheet's "Y" was a tick that someone had to type. */}
                {!simple && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {STEPS.map((step) => (
                    <label
                      key={step.key}
                      className={`flex items-center gap-1.5 text-xs ${
                        vendor[step.key] ? 'text-ink' : 'text-ink-soft'
                      } ${editable ? 'cursor-pointer' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(vendor[step.key])}
                        disabled={!editable}
                        onChange={(e) => patchVendor(vendor.id, { [step.key]: e.target.checked })}
                        className="focus-ring h-3.5 w-3.5 accent-[var(--accent)]"
                      />
                      {step.label}
                    </label>
                  ))}
                </div>
                )}
              </div>

              <div className="border-t border-border-soft px-4 py-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setOpen((prev) => {
                      const next = new Set(prev)
                      if (next.has(vendor.id)) next.delete(vendor.id)
                      else next.add(vendor.id)
                      return next
                    })
                  }
                  aria-expanded={isOpen}
                  className="focus-ring flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Menu
                    <span className="tabular ml-1.5 font-normal normal-case">
                      {menu.length} item{menu.length === 1 ? '' : 's'}
                    </span>
                    {flagged > 0 && (
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${stallTone.badge}`}
                      >
                        {flagged} flagged
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="text-ink-soft">
                    {isOpen ? '▴' : '▾'}
                  </span>
                </button>

                {isOpen && (
                  <div className="pt-2">
                    {menu.length === 0 ? (
                      <p className="py-3 text-center text-xs text-ink-soft">
                        No menu yet for this stall.
                      </p>
                    ) : (
                      <ul className="flex flex-col">
                        {menu.map((entry) => {
                          const clash = clashes.get(entry.id)
                          return (
                            <li
                              key={entry.id}
                              className={`flex flex-col gap-0.5 border-l-2 py-1.5 pl-2.5 sm:flex-row sm:items-center sm:gap-3 ${
                                clash ? CLASH_TONE[clash.level].row : 'border-transparent'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <InlineField
                                  value={entry.item}
                                  onChange={(v) => patchItem(vendor.id, entry.id, { item: v })}
                                  placeholder="Dish"
                                  className="w-full text-sm text-ink"
                                />
                                {clash && (
                                  <p
                                    className={`pl-1.5 text-xs font-medium ${CLASH_TONE[clash.level].text}`}
                                  >
                                    {clash.level === 'duplicate' ? 'Also at ' : 'Similar to '}
                                    {clash.with
                                      .map((w) => `${w.stall} — ${w.item}`)
                                      .join('; ')}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2 pl-1.5 sm:pl-0">
                                {editable ? (
                                  <NumberField
                                    value={entry.price}
                                    onChange={(v) => patchItem(vendor.id, entry.id, { price: v })}
                                    placeholder="0.00"
                                    prefix="$"
                                    className="w-20 text-sm font-semibold text-ink"
                                  />
                                ) : (
                                  <span className="tabular w-20 text-sm font-semibold text-ink">
                                    {money(entry.price)}
                                  </span>
                                )}
                                <RemoveButton
                                  onClick={() =>
                                    patchVendor(vendor.id, {
                                      menu: menu.filter((m) => m.id !== entry.id),
                                    })
                                  }
                                  title="Remove this item"
                                />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {editable && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="sm:max-w-xs sm:flex-1">
                          <AddButton onClick={() => addItem(vendor)}>Add a menu item</AddButton>
                        </div>
                        {/* Eighty dishes one at a time is why the Food Menu tab
                            of the workbook took a season to fill. */}
                        <button
                          type="button"
                          onClick={() => setImporting(vendor)}
                          className="focus-ring whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
                        >
                          Import from a file or paste
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
          No stalls match this filter.
        </div>
      )}
        </div>
      )}

      {importing && (
        <MenuImportDialog
          vendor={importing}
          vendors={vendors}
          onAdd={(entries) => addItems(importing, entries)}
          onClose={() => setImporting(null)}
        />
      )}
    </div>
  )
}
