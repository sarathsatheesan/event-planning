// Run with: node src/lib/filters.test.mjs
import { filterEvents, yearsIn, orgsIn, statusesIn, activeCount, EMPTY_FILTERS, ALL } from './filters.js'
import { events as seedEvents, deriveStatus } from '../data/events.js'
import { applyOverrides } from '../data/storage.js'
import { isPaid } from '../data/sponsors.js'

let fails = 0
const check = (label, actual, expected) => {
  // Most of what this file asserts is a list, so compare by value — a === on
  // two arrays is false however equal they are, and a test that always fails
  // teaches you to ignore it.
  const ok =
    typeof expected === 'function'
      ? expected(actual)
      : Array.isArray(expected)
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)?.slice(0, 80)}`)
}

const ev = (over) => ({ id: 'x', name: 'Diwali', date: '2027-03-01', endDate: null, org: 'ICC', status: 'Planning', ...over })
const only = (list, filters) => filterEvents(list, { ...EMPTY_FILTERS, ...filters }).map((e) => e.name)

console.log('--- the backfill ---')
// The migration that matters: every existing record reads as ICC without a
// script having run anywhere.
const materialised = applyOverrides(seedEvents, {})
check('every seed event has an org', materialised.every((e) => e.org), true)
check('and all of them are ICC', [...new Set(materialised.map((e) => e.org))].join(), 'ICC')

// An override document written before the field existed, and a created event
// from an older build — neither carries org, both must still read as ICC.
const legacy = applyOverrides(seedEvents, {
  'india-mela': { venue: 'Krishna Temple' },
  'evt-old': { name: 'Legacy created event', date: '2027-05-01' },
})
check('an old override still has an org', legacy.find((e) => e.id === 'india-mela').org, 'ICC')
check('and it kept its edit', legacy.find((e) => e.id === 'india-mela').venue, 'Krishna Temple')
check('an event created before the field reads as ICC', legacy.find((e) => e.id === 'evt-old').org, 'ICC')
// A real Temple event must not be rewritten by the backfill.
const temple = applyOverrides(seedEvents, { 'evt-t': { name: 'Temple Annadanam', date: '2027-04-01', org: 'Temple' } })
check('an explicit Temple value survives', temple.find((e) => e.id === 'evt-t').org, 'Temple')

console.log('\n--- the sponsors backfill ---')
// Same shape of promise as org: a record written before the field existed
// reads as an empty list, not undefined, so the tab never has to guess.
check('every seed event has a sponsors array', materialised.every((e) => Array.isArray(e.sponsors)), true)
check('all 15 start from the same 77 businesses', materialised.every((e) => e.sponsors.length === 77), true)
check('an old override still gets the list', legacy.find((e) => e.id === 'evt-old').sponsors.length, 77)
check('and India Mela keeps its own through an override', legacy.find((e) => e.id === 'india-mela').sponsors.length, 77)
// The list travels; one event's results do not. $8,250 was pledged to the
// Mela, and it must not appear as received on the other fourteen.
{
  const mela = materialised.find((e) => e.id === 'india-mela').sponsors
  const others = materialised.filter((e) => e.id !== 'india-mela')
  check('the same names everywhere', others.every((e) => e.sponsors.every((s, i) => s.name === mela[i].name)), true)
  check('nothing agreed anywhere else', others.every((e) => e.sponsors.every((s) => !s.response)), true)
  check('no money anywhere else', others.reduce((n, e) => n + e.sponsors.reduce((m, s) => m + (s.amount ?? 0), 0), 0), 0)
  check('nobody assigned anywhere else', others.every((e) => e.sponsors.every((s) => !s.templePoc)), true)
}
// The four the committee has actually closed, after the column drift was undone.
{
  const mela = materialised.find((e) => e.id === 'india-mela').sponsors
  const agreed = mela.filter((s) => s.response === 'Agreed')
  check('four agreed', agreed.length, 4)
  check('nothing tiered that did not agree', mela.filter((s) => s.tier && s.response !== 'Agreed').length, 0)
  check('$8,250 pledged', agreed.reduce((n, s) => n + s.amount, 0), 8250)
  check('and all of it received', agreed.every(isPaid), true)
  // Derived from "Paid by"/"Paid on", not a third field that can disagree.
  check('nothing stores a received flag any more', mela.some((s) => 'paymentReceived' in s), false)
  check('a mode alone counts as paid', isPaid({ mode: 'ICC Wix' }), true)
  check('a date alone counts as paid', isPaid({ datePaid: '2026-10-03' }), true)
  check('an amount with neither does not', isPaid({ amount: 2000, response: 'Agreed' }), false)
  check('an old stored tick is still honoured', isPaid({ paymentReceived: true }), true)
  check('an empty sponsor is not paid', isPaid({}), false)
  check('no tier left sitting in the person column', mela.filter((s) => ['Title', 'Gold', 'Platinum'].includes(s.templePoc)).length, 0)
  check('no outcome left sitting in the person column', mela.filter((s) => /declined|no response/i.test(s.templePoc)).length, 0)
  check('Sagar kept the reason he declined', mela.find((s) => s.name === 'Sagar').comments, 'Will open a Vendor stall for HVAC')
  check('13 have somebody on them', mela.filter((s) => s.templePoc).length, 13)
  check('every id is unique', new Set(mela.map((s) => s.id)).size, 77)
}

console.log('\n--- business vendors ---')
{
  const mela = materialised.find((e) => e.id === 'india-mela')
  const others = materialised.filter((e) => e.id !== 'india-mela')
  check('India Mela runs them', mela.needsBusinessVendors, true)
  check('and nobody else does', others.some((e) => e.needsBusinessVendors), false)
  check('30 booths, both tables of the sheet', mela.businessVendors.length, 30)
  check('every other event reads as an empty list', others.every((e) => Array.isArray(e.businessVendors) && e.businessVendors.length === 0), true)
  check('11 confirmed', mela.businessVendors.filter((v) => v.status === 'Confirmed').length, 11)
  check('11 paid', mela.businessVendors.filter((v) => v.payment === 'Paid').length, 11)
  check('3 carry a tax id', mela.businessVendors.filter((v) => v.taxId).length, 3)
  check('nothing is placed on a booth yet', mela.businessVendors.filter((v) => v.booth).length, 0)
  check('every id is unique', new Set(mela.businessVendors.map((v) => v.id)).size, 30)
  // The second table's people are here too, tax IDs and all.
  check('Nakshatra kept its tax id', mela.businessVendors.find((v) => v.taxId === '844198141')?.business, 'Nakshatra Collections')
  // Sagar has two booths, which is not the same as a duplicate row.
  check('Saaga is two businesses', mela.businessVendors.filter((v) => v.email === 'sagarkavi@gmail.com').length, 3)
}

console.log('\n--- filtering ---')
const list = [
  ev({ id: 'a', name: 'Diwali Celebrations', date: '2027-11-01', org: 'ICC', status: 'Planning' }),
  ev({ id: 'b', name: 'Temple Annadanam', date: '2027-04-01', org: 'Temple', status: '30 Days Out' }),
  ev({ id: 'c', name: 'India Mela', date: '2026-06-07', org: 'ICC', status: 'Completed' }),
  ev({ id: 'd', name: 'Temple Pooja', date: '2026-12-31', endDate: '2027-01-01', org: 'Temple', status: 'Planning' }),
]

check('no filters, everything', only(list, {}).length, 4)
check('by org', only(list, { org: 'Temple' }), (r) => r.length === 2 && r.every((n) => n.startsWith('Temple')))
check('by year', only(list, { year: '2026' }), (r) => r.includes('India Mela') && r.includes('Temple Pooja'))
check('an event spanning new year matches both', only(list, { year: '2027' }).includes('Temple Pooja'), true)
check('by status', only(list, { status: 'Completed' }), ['India Mela'])
check('search is case-insensitive', only(list, { q: 'dIwAlI' }), ['Diwali Celebrations'])
check('search matches anywhere in the name', only(list, { q: 'mela' }), ['India Mela'])
check('search ignores surrounding space', only(list, { q: '  Pooja  ' }), ['Temple Pooja'])
check('filters combine', only(list, { org: 'Temple', year: '2027', status: 'Planning' }), ['Temple Pooja'])
check('a combination matching nothing returns nothing', only(list, { org: 'Temple', q: 'Diwali' }), [])

console.log('\n--- the controls only offer what exists ---')
check('years, newest first', yearsIn(list), ['2027', '2026'])
check('orgs are sorted and deduped', orgsIn(list), ['ICC', 'Temple'])
check('a known org with no events is still offered', orgsIn([list[0]], ['ICC', 'Temple']), ['ICC', 'Temple'])
check('statuses follow the life of an event', statusesIn(list), ['30 Days Out', 'Planning', 'Completed'])
check('and skip ones nobody is in', statusesIn(list).includes('Live Today'), false)

console.log('\n--- the badge ---')
check('nothing active', activeCount(EMPTY_FILTERS), 0)
check('whitespace is not a filter', activeCount({ ...EMPTY_FILTERS, q: '   ' }), 0)
check('three at once', activeCount({ q: 'x', year: '2027', org: 'Temple', status: ALL }), 3)

// Status is derived, not stored, so filtering by it has to agree with the app.
const when = new Date('2026-10-01T09:00:00')
const derived = materialised.map((e) => ({ ...e, status: deriveStatus(e.date, e.endDate, when) }))
check(
  'filtering by a derived status works on real events',
  filterEvents(derived, { ...EMPTY_FILTERS, status: 'Completed' }).length > 0,
  true
)

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
