// Run with: node src/lib/access.test.mjs
//
// The rules this file pins down are the ones a leak would come through, so
// each check is written as the question somebody would ask after one.

import { scopeFor, canSeeEvent, visibleEvents, EVERYTHING, NOTHING } from './access.js'
import { COMMITTEES } from '../data/events.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    Array.isArray(expected) || (expected && typeof expected === 'object')
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}`)
}
const ev = (over) => ({ id: 'e', name: 'Event', committee: 'cultural', participants: [], ...over })

console.log('--- working out somebody\'s scope ---')
check('an admin gets everything', scopeFor({ email: 'a@x.org', member: {}, isAdmin: true }), EVERYTHING)
check('signed in but on no roster gets nothing', scopeFor({ email: 'a@x.org', member: null, isAdmin: false }), NOTHING)
check('no address at all gets nothing', scopeFor({ email: '', member: {}, isAdmin: false }), NOTHING)
const manager = scopeFor({ email: 'Priya@ICC.org', member: { committees: { cultural: 'manager', kitchen: 'volunteer' } }, isAdmin: false })
check('only the committees they manage are listed', manager.manages, ['cultural'])
check('the address is lower-cased to match what is stored', manager.email, 'priya@icc.org')
const volunteer = scopeFor({ email: 'anil@icc.org', member: { committees: { cultural: 'volunteer' } }, isAdmin: false })
check('a volunteer manages nothing', volunteer.manages, [])

console.log('\n--- what each of them can open ---')
check('an admin sees an event in a committee they are not in', canSeeEvent(ev({ committee: 'religious' }), EVERYTHING), true)
check('a manager sees their own committee', canSeeEvent(ev({ committee: 'cultural' }), manager), true)
check("a manager does not see another committee's event", canSeeEvent(ev({ committee: 'religious' }), manager), false)
// The committee they only help in is not theirs to browse.
check('being a volunteer somewhere is not the same as managing it', canSeeEvent(ev({ committee: 'kitchen' }), manager), false)
check('...unless they are personally on it', canSeeEvent(ev({ committee: 'kitchen', participants: ['priya@icc.org'] }), manager), true)

console.log('\n--- a volunteer sees only what is theirs ---')
check('not their whole committee', canSeeEvent(ev({ committee: 'cultural' }), volunteer), false)
check('but yes the events they are on', canSeeEvent(ev({ committee: 'cultural', participants: ['anil@icc.org'] }), volunteer), true)
// Borrowed work: the point of the third test is that it ignores committee.
check('including one in a committee they are not in at all', canSeeEvent(ev({ committee: 'religious', participants: ['anil@icc.org'] }), volunteer), true)

console.log('\n--- the shapes that could fail open ---')
check('an event with no committee falls to the default, not to everyone', canSeeEvent({ id: 'x' }, volunteer), false)
check('and a manager of the default still gets it', canSeeEvent({ id: 'x' }, manager), true)
check('participants missing is not participants empty', canSeeEvent(ev({ participants: undefined }), volunteer), false)
check('nobody on the roster sees nothing', canSeeEvent(ev({ participants: ['anil@icc.org'] }), NOTHING), false)
check('an unrecognised scope sees nothing', canSeeEvent(ev(), { kind: 'wat' }), false)
check('a near-miss address is not a match', canSeeEvent(ev({ participants: ['anil@icc.org.uk'] }), volunteer), false)

console.log('\n--- filtering a calendar ---')
const calendar = [
  ev({ id: 'a', committee: 'cultural' }),
  ev({ id: 'b', committee: 'religious' }),
  ev({ id: 'c', committee: 'kitchen', participants: ['anil@icc.org'] }),
]
check('a volunteer keeps only theirs', visibleEvents(calendar, volunteer).map((e) => e.id), ['c'])
check('a cultural manager keeps their committee', visibleEvents(calendar, manager).map((e) => e.id), ['a'])
check('an admin keeps the lot', visibleEvents(calendar, EVERYTHING).map((e) => e.id), ['a', 'b', 'c'])
check('every committee is a real one', manager.manages.every((id) => COMMITTEES.some((c) => c.id === id)), true)

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
