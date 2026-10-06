import { useMemo, useState } from 'react'
import {
  InlineField,
  InlineSelect,
  NumberField,
  PersonField,
  RemoveButton,
  AddButton,
} from '../fields.jsx'
import { nextId } from '../../lib/records.js'
import { isPaid } from '../../data/sponsors.js'
import { useEditable } from '../../lib/editing.js'

/**
 * The sponsor pipeline, for every event.
 *
 * Replaces the "2026 Sponsors" tab of the committee's workbook: seventy-odd
 * businesses, worked through by whoever has a relationship with them, most of
 * them never getting past "we should ask".
 *
 * Shape of the screen, and why. Seventeen columns is a spreadsheet, not a
 * page: laid out flat it is unreadable on a laptop and impossible on a phone.
 * But seventy-seven cards is no better — the common job here is *scanning*
 * ("who has nobody on them", "who declined", "what have we actually raised"),
 * and scanning wants rows. So: one dense row per sponsor carrying the six
 * fields that answer those questions, and the other eleven behind a tap on the
 * row that needs them. One layout, not a table and a card view drifting apart.
 */

// Closed lists, because a column that only ever holds six values should not be
// free text — that is how "Realtor", "realtor" and "Real estate" end up being
// three different things in a filter.
const CATEGORIES = [
  '',
  'Realtor',
  'Restaurant',
  'Grocery',
  'Business',
  'Financial Management',
  'Insurance',
  'Healthcare',
  'Education',
  'Technology',
  'Legal',
  'Travel',
  'Automotive',
  'Retail',
  'Construction & Trades',
  'Media',
  'Non-Profit',
  'Individual',
  'Other',
]

// The pipeline, in the order a sponsor moves through it.
const RESPONSES = ['', 'No response', 'Declined', 'Interested', 'Agreed']

// Title down to Bronze is the committee's own ladder; In-kind is the sponsor
// who gives tents rather than money, which the 2023 sheet recorded in notes.
const TIERS = ['', 'Title', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'In-kind']

const MODES = ['', 'Check', 'Cash', 'Zelle', 'Venmo', 'Card', 'Online', 'ICC Wix', 'Other']

// The three things that have to exist before the event, tracked as ticks
// rather than a Y someone has to type.
const ARTEFACTS = [
  { key: 'logo', label: 'Logo in' },
  { key: 'logoOnPoster', label: 'On poster' },
  { key: 'banner', label: 'Banner in' },
]

const BLANK = {
  name: '',
  category: '',
  templePoc: '',
  templePocEmail: '',
  response: '',
  tier: '',
  amount: null,
  phone: '',
  email: '',
  mode: '',
  datePaid: '',
  nameOnCheck: '',
  comments: '',
  banner: false,
  logo: false,
  logoOnPoster: false,
}

// A fresh [] every render would re-run the rollup on every keystroke.
const NONE = Object.freeze([])

const money = (n) => (n == null || n === '' ? '—' : `$${Number(n).toLocaleString('en-US')}`)

// Whole class strings, because Tailwind scans source text and would purge
// anything assembled at runtime. Same tokens the status pills use elsewhere.
const RESPONSE_TONE = {
  Agreed: 'border-success/50 bg-success-soft/40 text-success',
  Interested: 'border-accent/50 bg-accent-soft/50 text-accent',
  Declined: 'border-border bg-paper text-ink-soft',
  'No response': 'border-warning/50 bg-warning-soft/40 text-warning',
}

export default function Sponsors({ event, onSponsorsChange }) {
  const editable = useEditable()
  const sponsors = event.sponsors ?? NONE
  const [open, setOpen] = useState(() => new Set())
  const [filter, setFilter] = useState('All')

  const totals = useMemo(() => {
    let agreed = 0
    let received = 0
    let agreedCount = 0
    let unowned = 0
    for (const s of sponsors) {
      if (s.response === 'Agreed') {
        agreedCount++
        agreed += Number(s.amount) || 0
        if (isPaid(s)) received += Number(s.amount) || 0
      }
      if (!s.templePoc) unowned++
    }
    return { agreed, received, agreedCount, unowned }
  }, [sponsors])

  const shown = sponsors.filter((s) => {
    if (filter === 'All') return true
    if (filter === 'Nobody on it') return !s.templePoc
    if (filter === 'Open') return !s.response || s.response === 'Interested'
    if (filter === 'Awaiting payment') return s.response === 'Agreed' && !isPaid(s)
    return s.response === filter
  })

  function patch(id, change) {
    onSponsorsChange(sponsors.map((s) => (s.id === id ? { ...s, ...change } : s)))
  }
  function add() {
    const id = nextId(sponsors)
    onSponsorsChange([...sponsors, { ...BLANK, id }])
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

  if (sponsors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No sponsors yet</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Who is being approached for {event.name}, who is approaching them, and what has actually
          been agreed and received.
        </p>
        {editable && (
          <div className="mt-2 w-64">
            <AddButton onClick={add}>Add the first sponsor</AddButton>
          </div>
        )}
      </div>
    )
  }

  const FILTERS = ['All', 'Open', 'Agreed', 'Awaiting payment', 'Declined', 'No response', 'Nobody on it']

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
              + Add a sponsor
            </button>
          )}
        </div>

        {/* What the committee is actually asked at a meeting. Agreed and
            received are kept apart on purpose: a promise is not money. */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs text-ink-soft">
          <span>
            <span className="tabular font-semibold text-ink">{sponsors.length}</span> on the list
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{totals.agreedCount}</span> agreed
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{money(totals.agreed)}</span> pledged
          </span>
          <span>
            <span className="tabular font-semibold text-ink">{money(totals.received)}</span> received
          </span>
          {totals.unowned > 0 && (
            <span className="font-semibold text-warning">
              {totals.unowned} with nobody on them
            </span>
          )}
        </div>
      </div>

      {/* Column headings, desktop only. Five unlabelled dropdowns on a row
          is a puzzle; on a phone the row stacks and each control carries its
          own placeholder instead. */}
      <div className="mb-1 hidden items-center gap-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:flex">
        <span className="min-w-0 flex-1">Sponsor</span>
        <span className="w-44">Category</span>
        <span className="w-40">Temple POC</span>
        <span className="w-32">Response</span>
        <span className="w-20 text-right">Amount</span>
        <span className="w-6" aria-hidden="true" />
      </div>

      <ul className="flex flex-col gap-1.5">
        {shown.map((s) => {
          const isOpen = open.has(s.id)
          return (
            <li key={s.id} className="rounded-xl border border-border bg-surface">
              {/* The scanning row: name, who owns it, where it stands, money. */}
              <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <InlineField
                    value={s.name}
                    onChange={(v) => patch(s.id, { name: v })}
                    placeholder="Business or person"
                    className="w-full font-semibold text-ink"
                  />
                </div>
                <div className="w-full sm:w-44">
                  <InlineSelect
                    value={
                      s.category && !CATEGORIES.includes(s.category)
                        ? s.category
                        : s.category || ''
                    }
                    onChange={(v) => patch(s.id, { category: v })}
                    options={
                      s.category && !CATEGORIES.includes(s.category)
                        ? [...CATEGORIES, s.category]
                        : CATEGORIES
                    }
                    ariaLabel="Category"
                    placeholder="Category"
                    className="w-full text-xs text-ink-soft"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <PersonField
                    value={s.templePoc}
                    email={s.templePocEmail}
                    onChange={(name, email) =>
                      patch(s.id, { templePoc: name, templePocEmail: email ?? '' })
                    }
                    placeholder="Temple POC"
                    className="w-full text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className="w-32">
                    <InlineSelect
                      value={s.response ?? ''}
                      onChange={(v) => patch(s.id, { response: v })}
                      options={RESPONSES}
                      ariaLabel="Response"
                      placeholder="Response"
                      className={`w-full rounded-full border px-2 text-xs font-semibold ${
                        RESPONSE_TONE[s.response] ?? 'border-border text-ink-soft'
                      }`}
                    />
                  </span>
                  <span className="tabular w-20 shrink-0 text-right text-sm font-semibold text-ink">
                    {money(s.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-expanded={isOpen}
                    aria-label={`Details for ${s.name || 'this sponsor'}`}
                    className="focus-ring w-6 shrink-0 rounded text-ink-soft"
                  >
                    {isOpen ? '▴' : '▾'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border-soft px-3 py-3">
                  <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
                    <dt className="text-ink-soft">Tier</dt>
                    <dd>
                      <InlineSelect
                        value={s.tier ?? ''}
                        onChange={(v) => patch(s.id, { tier: v })}
                        options={TIERS}
                        ariaLabel="Sponsorship tier"
                        placeholder="Not set"
                        className="text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Amount</dt>
                    <dd>
                      <NumberField
                        value={s.amount}
                        onChange={(v) => patch(s.id, { amount: v })}
                        placeholder="0"
                        prefix="$"
                        className="w-28 text-sm font-semibold text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Phone</dt>
                    <dd>
                      <InlineField
                        type="tel"
                        value={s.phone}
                        onChange={(v) => patch(s.id, { phone: v })}
                        placeholder="Phone"
                        className="w-full font-mono text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Email</dt>
                    <dd>
                      <InlineField
                        type="email"
                        value={s.email}
                        onChange={(v) => patch(s.id, { email: v })}
                        placeholder="name@example.com"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Paid by</dt>
                    <dd>
                      <InlineSelect
                        value={s.mode ?? ''}
                        onChange={(v) => patch(s.id, { mode: v })}
                        options={MODES}
                        ariaLabel="Mode of payment"
                        placeholder="Not set"
                        className="text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Paid on</dt>
                    <dd>
                      <InlineField
                        type="date"
                        value={s.datePaid}
                        onChange={(v) => patch(s.id, { datePaid: v })}
                        placeholder="Date of payment"
                        className="text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft">Name on check</dt>
                    <dd className="sm:col-span-3">
                      <InlineField
                        value={s.nameOnCheck}
                        onChange={(v) => patch(s.id, { nameOnCheck: v })}
                        placeholder="As written on the check"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                    <dt className="text-ink-soft sm:col-start-1">Comments</dt>
                    <dd className="sm:col-span-3">
                      <InlineField
                        value={s.comments}
                        onChange={(v) => patch(s.id, { comments: v })}
                        placeholder="Anything worth knowing next year"
                        className="w-full text-sm text-ink"
                      />
                    </dd>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {/* Said, not ticked. Filling "Paid by" or "Paid on" is
                        what records the money arriving; a separate box could
                        only ever agree or contradict. */}
                    <span
                      className={`text-xs font-semibold ${
                        isPaid(s) ? 'text-success' : 'text-ink-soft'
                      }`}
                    >
                      {isPaid(s)
                        ? `Received${s.mode ? ` by ${s.mode.toLowerCase()}` : ''}`
                        : s.response === 'Agreed'
                          ? 'Pledged, not yet received'
                          : 'No payment recorded'}
                    </span>
                    {ARTEFACTS.map((a) => (
                      <label
                        key={a.key}
                        className={`flex items-center gap-1.5 text-xs ${
                          s[a.key] ? 'text-ink' : 'text-ink-soft'
                        } ${editable ? 'cursor-pointer' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(s[a.key])}
                          disabled={!editable}
                          onChange={(e) => patch(s.id, { [a.key]: e.target.checked })}
                          className="focus-ring h-3.5 w-3.5 accent-[var(--accent)]"
                        />
                        {a.label}
                      </label>
                    ))}
                    {editable && (
                      <span className="ml-auto">
                        <RemoveButton
                          onClick={() =>
                            onSponsorsChange(
                              sponsors.filter((x) => x.id !== s.id),
                              'Sponsor removed.'
                            )
                          }
                          title="Remove this sponsor"
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
          No sponsors match this filter.
        </div>
      )}
    </div>
  )
}
