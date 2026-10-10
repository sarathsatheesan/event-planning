// Run with: node src/lib/assignees.test.mjs
//
// participantsOf decides who a committee-scoped read will let into an event,
// so it gets a test. The rule it has to satisfy: anybody with work on this
// event is in the list, whichever field that work hangs off, and anybody
// without an address is not — because an address is the only thing a security
// rule can match against the signed-in user.

import { assigneesOf, assigneeNames, withAssignees, participantsOf } from '../data/assignees.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    Array.isArray(expected) || (expected && typeof expected === 'object')
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}`)
}

console.log('--- reading owners, old shape and new ---')
check('the single-owner shape still reads', assigneesOf({ assignee: 'Hari', assigneeEmail: 'h@icc.org' }), [{ name: 'Hari', email: 'h@icc.org' }])
check('a list reads as itself', assigneeNames({ assignees: [{ name: 'Hari' }, { name: 'Ravi' }] }), ['Hari', 'Ravi'])
check('nobody reads as nobody', assigneesOf({ assignee: '', assigneeEmail: null }), [])
check('a name with no address is still an owner', assigneeNames({ assignee: 'Someone Who Left' }), ['Someone Who Left'])
check('the mirror follows the first', withAssignees([{ name: 'Ravi', email: 'r@icc.org' }, { name: 'Suma', email: 's@icc.org' }]).assignee, 'Ravi')
check('and clears with the last', withAssignees([]), { assignees: [], assignee: '', assigneeEmail: null })

console.log('\n--- who a scoped read lets in ---')
const event = {
  leadEmail: 'Lead@ICC.org',
  checklist: [
    { assignees: [{ name: 'Hari', email: 'hari@icc.org' }, { name: 'Ravi', email: 'ravi@icc.org' }] },
    { assignee: 'Pavithra', assigneeEmail: 'pavithra@icc.org' },
    { assignee: 'Someone Who Left' },
  ],
  runOfShow: [{ owner: 'Suma', ownerEmail: 'suma@icc.org' }, { owner: 'nobody' }],
  retro: { actions: [{ assignee: 'Dhana', assigneeEmail: 'dhana@icc.org' }] },
  sponsors: [{ templePoc: 'Ashwin', templePocEmail: 'ashwin@icc.org' }, { templePoc: '' }],
}
check('every field contributes', participantsOf(event), [
  'ashwin@icc.org', 'dhana@icc.org', 'hari@icc.org', 'lead@icc.org',
  'pavithra@icc.org', 'ravi@icc.org', 'suma@icc.org',
])
// A rule can only match an address, so a typed name must not look like access.
check('a name with no address is not in it', participantsOf(event).includes('someone who left'), false)
check('addresses are lower-cased to match the signed-in user', participantsOf(event).includes('lead@icc.org'), true)
check('the same person twice appears once', participantsOf({
  leadEmail: 'hari@icc.org',
  checklist: [{ assigneeEmail: 'HARI@icc.org', assignee: 'Hari' }],
}), ['hari@icc.org'])
check('an event nobody is on is empty, not undefined', participantsOf({}), [])
check('and so is nothing at all', participantsOf(undefined), [])

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
