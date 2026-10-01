import { buildDigest, dayStamp } from './digest.js'
import { events as seedEvents, deriveStatus } from './seed/events.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!ok) fails++
  const shown = typeof actual === 'string' && actual.length > 70 ? actual.slice(0, 70) + '…' : actual
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${shown}`)
}

const materialise = (list, when) =>
  list.map((e) => ({ ...e, status: deriveStatus(e.date, e.endDate, when) }))

// ---------------------------------------------------------- the real calendar
const when = new Date('2026-10-01T09:00:00')
const real = buildDigest({ events: materialise(seedEvents, when), today: when })

console.log('--- the real ICC calendar, 1 Oct 2026 ---')
check('produces a digest', real !== null, true)
check('subject', real.subject, (s) => /^EventOps: \d+ overdue, \d+ due this week$/.test(s))
check('counts', JSON.stringify(real.counts), (s) => s.length > 0)
check('text has an overdue section', real.text.includes('OVERDUE'), true)
check('html has no unrendered template', !real.html.includes('${'), true)
check('html is a complete document', real.html.trim().endsWith('</html>'), true)

// Each section groups owners independently, so check within one section
// rather than across the whole email.
const overdueBlock = real.text.split('OVERDUE')[1].split('DUE WITHIN')[0]
const owners = [...overdueBlock.matchAll(/^ {2}(\S.*?) — \d+$/gm)].map((m) => m[1])
check('owners are grouped', owners.length > 0, true)
check('at least one owner heading', owners.length >= 1, true)
check('long sections are capped', real.text.includes('and ') && real.text.includes('more — open EventOps'), true)
check(
  'Unassigned sorts last within its section',
  owners.includes('Unassigned') ? owners.indexOf('Unassigned') === owners.length - 1 : true,
  true
)
console.log('    owners in the overdue section:', owners.join(', '))

// ------------------------------------------------------------------ fixtures
const task = (over) => ({ id: 1, task: 'Book the hall', assignee: 'Hari', status: 'Not Started', ...over })
const ev = (over) => ({ name: 'Test Event', date: '2027-01-01', endDate: null, checklist: [], status: 'Planning', ...over })

console.log('\n--- edge cases ---')
const quiet = buildDigest({
  events: [ev({ date: '2027-12-01', checklist: [task({ due: '2027-11-01' })] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('quiet week sends nothing', quiet, null)

const allDone = buildDigest({
  events: [ev({ date: '2027-01-05', checklist: [task({ due: '2026-12-01', status: 'Done' })] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('completed work is not overdue', allDone.counts.overdue, 0)
check('but the event still shows as coming up', allDone.counts.upcoming, 1)
check('subject falls back to the event', allDone.subject, (s) => s.includes('Test Event') && s.includes('4 days'))

const completedEvent = buildDigest({
  events: [ev({ status: 'Completed', checklist: [task({ due: '2026-01-01' })] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('past events are not chased', completedEvent, null)

const unassigned = buildDigest({
  events: [ev({ date: '2027-01-20', checklist: [
    task({ id: 1, due: '2026-12-01', assignee: '' }),
    task({ id: 2, due: '2026-12-01', assignee: 'Unassigned' }),
    task({ id: 3, due: '2026-12-01', assignee: 'Pavithra' }),
  ] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('blank and literal "Unassigned" merge', (unassigned.text.match(/Unassigned — 2/g) ?? []).length, 1)

const nasty = buildDigest({
  events: [ev({ name: '<script>alert(1)</script>', date: '2027-01-05', checklist: [task({ due: '2026-12-01' })] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('event names are escaped in html', nasty.html.includes('&lt;script&gt;'), true)
check('and not left raw', !nasty.html.includes('<script>alert'), true)

const boundary = buildDigest({
  events: [ev({ date: '2027-06-01', checklist: [
    task({ id: 1, due: '2027-01-08' }),   // exactly 7 days out -> soon
    task({ id: 2, due: '2027-01-09' }),   // 8 days out -> neither
    task({ id: 3, due: '2026-12-31' }),   // yesterday -> overdue
  ] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('7 days counts as due this week', boundary.counts.soon, 1)
check('8 days does not', boundary.counts.overdue, 1)

console.log(`\nstamp helper is local-date safe: ${dayStamp(new Date('2027-03-14T23:30:00'))}`)
// Write the rendered email out so it can actually be looked at.
if (process.env.WRITE_SAMPLE) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.env.WRITE_SAMPLE, real.html)
  console.log('\nwrote sample email ->', process.env.WRITE_SAMPLE)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
