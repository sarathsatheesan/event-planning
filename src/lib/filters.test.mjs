// Run with: node src/lib/filters.test.mjs
import { filterEvents, yearsIn, orgsIn, statusesIn, activeCount, EMPTY_FILTERS, ALL } from './filters.js'
import { events as seedEvents, deriveStatus } from '../data/events.js'
import { applyOverrides } from '../data/storage.js'

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
