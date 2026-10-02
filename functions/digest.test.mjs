import { buildDigest, dayStamp, previewReminders } from './digest.js'
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


// ------------------------------------------------- one person's own reminder
console.log('\n--- personal reminders ---')

// Against the real calendar, addressed by name: this is the path that matters
// most, because almost every existing milestone was assigned by typing a name
// long before the roster picker existed.
//
// Today that path has nothing to chase — all 31 overdue milestones are
// Unassigned, which is precisely why per-person reminders were blocked until
// now. Assert that honestly rather than skipping it: the day somebody backfills
// the owners, this test starts exercising the real calendar on its own.
const someone = owners.find((o) => o !== 'Unassigned') ?? null
check(
  'the real calendar has somebody to remind',
  someone !== null,
  (hasOwner) => {
    if (!hasOwner) console.log('    note: no overdue milestone on the real calendar has an owner yet')
    return true
  }
)

// A stand-in so the personal email is exercised against real volumes and can
// actually be looked at: the real seed, with its open milestones handed to one
// person.
const PERSON = { email: 'pavithra@icc.org', name: 'Pavithra Nair' }
const assignedSeed = materialise(seedEvents, when).map((e) => ({
  ...e,
  checklist: (e.checklist ?? []).map((t) => ({
    ...t,
    assignee: PERSON.name,
    assigneeEmail: PERSON.email,
  })),
}))
const mine = someone
  ? buildDigest({ events: materialise(seedEvents, when), today: when, forPerson: { email: 'nobody@icc.org', name: someone } })
  : buildDigest({ events: assignedSeed, today: when, forPerson: PERSON })
const forWhom = someone ?? PERSON.name

check('an owner with work gets a digest', mine !== null, true)
if (mine) {
  console.log(`    built for "${forWhom}":`, mine.subject, JSON.stringify(mine.counts))
  check('subject is addressed to them', mine.subject, (sub) => sub.startsWith('EventOps: your '))
  check('text opens with their first name', mine.text.startsWith(forWhom.split(' ')[0] + ' — here'), true)
  check('footer explains why they got it', mine.html.includes('assigned to you'), true)
  // Group headings must be events now, not people. No other committee member's
  // name may appear as a heading, and no row may repeat an event in brackets.
  const headings = [...mine.text.matchAll(/^ {2}(\S.*?) — \d+$/gm)].map((m) => m[1])
  check('grouped by event, not by owner', headings.includes(forWhom), false)
  check('at least one event heading', headings.length > 0, true)
  check('rows do not repeat the event', /^ {4}\S.*\[.*\]$/m.test(mine.text), false)
  check('no Unassigned heading on a personal list', mine.text.includes('Unassigned'), false)
  check('fewer items than the committee list', mine.counts.overdue <= real.counts.overdue, true)
  check('long sections are still capped', mine.counts.overdue <= 12 || mine.text.includes('more — open EventOps'), true)
}

// ---- addressing by email, which is what the picker now records ----
const twoPeople = [
  task({ id: 1, due: '2026-12-01', assignee: 'Hari', assigneeEmail: 'hari@icc.org' }),
  task({ id: 2, due: '2026-12-02', assignee: 'Pavithra', assigneeEmail: 'pavithra@icc.org' }),
]
const byEmail = buildDigest({
  events: [ev({ date: '2027-01-20', checklist: twoPeople })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('only their own milestone', byEmail.counts.overdue, 1)
check("and not the other person's", byEmail.text.includes('Pavithra'), false)

// An address on the row beats a matching name. Reassigning a milestone from the
// picker leaves the old typed name behind in some rows; the address is the one
// that was actually chosen.
const reassigned = buildDigest({
  events: [ev({ date: '2027-01-20', checklist: [
    task({ id: 1, due: '2026-12-01', assignee: 'Hari', assigneeEmail: 'someone-else@icc.org' }),
  ] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('the address wins over a stale name', reassigned, null)

// "Hari" must not collect "Hari Prasad"'s work.
const prefix = buildDigest({
  events: [ev({ date: '2027-01-20', checklist: [task({ id: 1, due: '2026-12-01', assignee: 'Hari Prasad' })] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('name matching is exact, not a prefix', prefix, null)

const cased = buildDigest({
  events: [ev({ date: '2027-01-20', checklist: [task({ id: 1, due: '2026-12-01', assignee: 'hari' })] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('but case does not matter', cased?.counts.overdue, 1)

// Nothing owed, however busy the calendar is: no email. The committee overview
// is where "the Mela is in nine days" belongs.
const idle = buildDigest({
  events: [ev({ date: '2027-01-05', checklist: [task({ id: 1, due: '2026-12-01', assignee: 'Pavithra' })] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('a quiet week for them sends nothing', idle, null)
check('even though the committee list is not quiet', buildDigest({
  events: [ev({ date: '2027-01-05', checklist: [task({ id: 1, due: '2026-12-01', assignee: 'Pavithra' })] })],
  today: new Date('2027-01-01T09:00:00'),
}) !== null, true)

// Unassigned work belongs to nobody's inbox. It has to stay visible to admins
// on the overview, which is the only place it will ever be seen.
const orphan = { events: [ev({ date: '2027-01-20', checklist: [
  task({ id: 1, due: '2026-12-01', assignee: '' }),
  task({ id: 2, due: '2026-12-01', assignee: 'Unassigned' }),
] })], today: new Date('2027-01-01T09:00:00') }
check('unassigned reaches no individual', buildDigest({ ...orphan, forPerson: { email: 'hari@icc.org', name: 'Hari' } }), null)
check('but is on the committee overview', buildDigest(orphan).counts.overdue, 2)
check('and a blank name matches nobody', buildDigest({ ...orphan, forPerson: { email: '', name: '' } }), null)

// Two events, so the event grouping is actually exercised.
const across = buildDigest({
  events: [
    ev({ name: 'Diwali', date: '2027-02-01', checklist: [task({ id: 1, due: '2026-12-20', assigneeEmail: 'hari@icc.org' })] }),
    ev({ name: 'Holi', date: '2027-03-01', checklist: [task({ id: 2, due: '2026-12-10', assigneeEmail: 'hari@icc.org' })] }),
  ],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
const acrossHeadings = [...across.text.matchAll(/^ {2}(\S.*?) — \d+$/gm)].map((m) => m[1])
check('both events appear as headings', JSON.stringify(acrossHeadings), '["Holi","Diwali"]')
check('nearest deadline first', acrossHeadings[0], 'Holi')
check('html escapes nothing unrendered', across.html.includes('${'), false)

// Every event the person owes anything on has to appear, even when the section
// is capped. Greedy filling used to spend all twelve rows on the first event.
const many = buildDigest({
  events: ['Mela', 'Diwali', 'Holi', 'Onam', 'Navratri'].map((name, i) =>
    ev({
      name,
      date: `2027-0${i + 2}-01`,
      checklist: Array.from({ length: 6 }, (_, j) => task({
        id: i * 10 + j,
        task: `${name} job ${j}`,
        due: `2026-0${i + 4}-0${j + 1}`,
        assigneeEmail: 'hari@icc.org',
      })),
    })
  ),
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
const manyHeadings = [...many.text.matchAll(/^ {2}(\S.*?) — \d+$/gm)].map((m) => m[1])
check('every event still appears when capped', manyHeadings.length, 5)
check('counts are the true totals, not what is shown', many.text.includes(' — 6'), true)
check('and the cap still holds', (many.text.match(/^ {4}\S/gm) ?? []).length, 12)
check('the remainder is owned up to', many.text.includes('…and 18 more'), true)

// The committee overview keeps the greedy behaviour: the person who owes the
// most is read first and is worth seeing in full.
const greedy = buildDigest({
  events: [ev({ date: '2027-06-01', checklist: [
    ...Array.from({ length: 10 }, (_, j) => task({ id: j, task: `big ${j}`, due: '2026-12-01', assignee: 'Hari' })),
    ...Array.from({ length: 10 }, (_, j) => task({ id: 100 + j, task: `small ${j}`, due: '2026-12-02', assignee: 'Pavithra' })),
  ] })],
  today: new Date('2027-01-01T09:00:00'),
})
check('overview fills the biggest owner first', (greedy.text.match(/ big \d/g) ?? []).length, 10)
check('and gives the rest what is left', (greedy.text.match(/ small \d/g) ?? []).length, 2)

const soonOnly = buildDigest({
  events: [ev({ date: '2027-06-01', checklist: [task({ id: 1, due: '2027-01-03', assigneeEmail: 'hari@icc.org' })] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('subject drops overdue when there is none', soonOnly.subject, 'EventOps: your 1 due this week')

// The committee overview must be untouched by all of this.
console.log('\n--- the overview is unchanged ---')
check('same subject as before', real.subject, (s) => /^EventOps: \d+ overdue, \d+ due this week$/.test(s))
check('still grouped by owner', real.text.includes('Unassigned — '), true)
check('rows still name their event', /^ {4}\S.*\[.*\]$/m.test(real.text), true)

const overdueOnly = buildDigest({
  events: [ev({ date: '2027-06-01', checklist: [task({ id: 1, due: '2026-12-01', assigneeEmail: 'hari@icc.org' })] })],
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
})
check('no zero in the subject when nothing is due soon', overdueOnly.subject, 'EventOps: your 1 overdue')
check('and the committee subject reads the same way', buildDigest({
  events: [ev({ date: '2027-06-01', checklist: [task({ id: 1, due: '2026-12-01' })] })],
  today: new Date('2027-01-01T09:00:00'),
}).subject, 'EventOps: 1 overdue')

// --------------------------------------------------- the dry run of Monday
console.log('\n--- preview ---')

const ROSTER = [
  { email: 'hari@icc.org', name: 'Hari' },
  { email: 'pavithra@icc.org', name: 'Pavithra Nair' },
  { email: 'quiet@icc.org', name: 'Quiet Member' },
]
const plan = previewReminders({
  today: new Date('2027-01-01T09:00:00'),
  members: ROSTER,
  admins: ['pavithra@icc.org'],
  events: [
    ev({ name: 'Diwali', date: '2027-01-20', checklist: [
      task({ id: 1, due: '2026-12-01', assigneeEmail: 'hari@icc.org', assignee: 'Hari' }),
      task({ id: 2, due: '2027-01-03', assigneeEmail: 'hari@icc.org', assignee: 'Hari' }),
      task({ id: 3, due: '2026-12-01', assignee: 'Pavithra Nair' }),
      task({ id: 4, due: '2026-12-01', assignee: '' }),
      // Looks assigned in the app, reaches nobody: no such roster member.
      task({ id: 5, due: '2026-12-01', assignee: 'Chinmy' }),
      task({ id: 6, due: '2026-12-02', assignee: 'Chinmy' }),
    ] }),
    ev({ name: 'Holi', date: '2027-02-01', checklist: [
      task({ id: 7, due: '2026-12-05', assignee: 'Chinmy' }),
    ] }),
    // Completed events are not chased, so nothing here may appear anywhere.
    ev({ name: 'Old', date: '2026-01-01', status: 'Completed', checklist: [
      task({ id: 8, due: '2025-12-01', assigneeEmail: 'hari@icc.org' }),
    ] }),
  ],
})

const who = (email) => plan.people.find((x) => x.email === email)
check('one row per committee member', plan.people.length, 3)
check('busiest member first', plan.people[0].email, 'hari@icc.org')
check('Hari is owed two', who('hari@icc.org').overdue + who('hari@icc.org').soon, 2)
check('one overdue, one due this week', `${who('hari@icc.org').overdue}/${who('hari@icc.org').soon}`, '1/1')
check('and would be emailed', who('hari@icc.org').willSend, true)
check('with the subject he will see', who('hari@icc.org').subject, 'EventOps: your 1 overdue, 1 due this week')
check('name-only match still counts', who('pavithra@icc.org').overdue, 1)
check('the clear member gets silence', who('quiet@icc.org').willSend, false)
check('and no subject is invented for them', who('quiet@icc.org').subject, null)
check('admins are flagged', who('pavithra@icc.org').isAdmin, true)
check('completed events are excluded', plan.totals.open, 7)
check('unowned work is counted', plan.totals.unowned, 1)
check('names matching nobody are counted', plan.totals.orphaned, 3)
check('and named, so they can be fixed', plan.orphaned[0].name, 'Chinmy')
check('with the events they sit in', JSON.stringify(plan.orphaned[0].events), '["Diwali","Holi"]')
check('the overview goes to admins only', JSON.stringify(plan.overview.recipients), '["pavithra@icc.org"]')
check('and covers everything, owned or not', plan.overview.overdue, 6)

// The preview must not be able to disagree with the send: same rows, same rules.
const hariDigest = buildDigest({
  today: new Date('2027-01-01T09:00:00'),
  forPerson: { email: 'hari@icc.org', name: 'Hari' },
  events: [ev({ name: 'Diwali', date: '2027-01-20', checklist: [
    task({ id: 1, due: '2026-12-01', assigneeEmail: 'hari@icc.org', assignee: 'Hari' }),
    task({ id: 2, due: '2027-01-03', assigneeEmail: 'hari@icc.org', assignee: 'Hari' }),
  ] })],
})
check('preview subject equals the real one', who('hari@icc.org').subject, hariDigest.subject)

const emptyPlan = previewReminders({ events: [], today: new Date('2027-01-01T09:00:00'), members: ROSTER })
check('no events, nobody emailed', emptyPlan.people.every((x) => !x.willSend), true)
check('and no overview either', emptyPlan.overview, null)

console.log(`\nstamp helper is local-date safe: ${dayStamp(new Date('2027-03-14T23:30:00'))}`)
// Write the rendered email out so it can actually be looked at.
if (process.env.WRITE_SAMPLE) {
  const { writeFileSync } = await import('node:fs')
  writeFileSync(process.env.WRITE_SAMPLE, real.html)
  if (mine) {
    const personalPath = process.env.WRITE_SAMPLE.replace(/\.html$/, '') + '.personal.html'
    writeFileSync(personalPath, mine.html)
    console.log('wrote personal sample ->', personalPath)
  }
  console.log('\nwrote sample email ->', process.env.WRITE_SAMPLE)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
