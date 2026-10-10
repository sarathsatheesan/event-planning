// Run with: node src/lib/committee.test.mjs
//
// These three readers decide what a person can see once committee scoping
// ships, so they get a test of their own. Two stored shapes are in play at
// once — the plain array written before roles existed, and the map written
// since — and the whole point of the readers is that neither needs migrating.

import { committeeIdsOf, committeeRoleOf, storedCommitteesOf, storedRoleOf } from './committee.js'
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
const ALL = COMMITTEES.map((c) => c.id)

console.log('--- an admin manages everything ---')
const admin = { role: 'admin', committees: { kitchen: 'volunteer' } }
check('in every committee', committeeIdsOf(admin), ALL)
check('manages one they never picked', committeeRoleOf(admin, 'development'), 'manager')
check('outranks their own stored volunteer', committeeRoleOf(admin, 'kitchen'), 'manager')
// The reason it is derived: demoting them has to give back what they chose.
check('their own choice is kept underneath', storedCommitteesOf(admin), ['kitchen'])
check('and comes back when demoted', committeeIdsOf({ ...admin, role: 'member' }), ['kitchen'])

console.log('\n--- the array shape, written before roles existed ---')
const old = { role: 'member', committees: ['cultural', 'kitchen'] }
check('still reads its committees', committeeIdsOf(old), ['cultural', 'kitchen'])
check('with no role recorded, reads as volunteer', committeeRoleOf(old, 'cultural'), 'volunteer')
check('and null where they are not', committeeRoleOf(old, 'religious'), null)

console.log('\n--- the map shape, written since ---')
const now = { role: 'member', committees: { cultural: 'manager', kitchen: 'volunteer' } }
check('manager where it says manager', committeeRoleOf(now, 'cultural'), 'manager')
check('volunteer where it says volunteer', committeeRoleOf(now, 'kitchen'), 'volunteer')
check('null where it says nothing', committeeRoleOf(now, 'sponsorship'), null)
check('ids come out in order', committeeIdsOf(now), ['cultural', 'kitchen'])
// A value nobody recognises must not become the elevated role by accident.
check('an unknown role reads down, not up', committeeRoleOf({ committees: { kitchen: 'owner' } }, 'kitchen'), 'volunteer')
check('a falsy value is not membership', committeeRoleOf({ committees: { kitchen: false } }, 'kitchen'), null)

console.log('\n--- nothing at all ---')
for (const empty of [undefined, null, {}, { committees: null }, { committees: 'kitchen' }]) {
  check(`${JSON.stringify(empty)} has no committees`, committeeIdsOf(empty), [])
  check(`${JSON.stringify(empty)} has no role`, committeeRoleOf(empty, 'cultural'), null)
}

console.log('\n--- the raw reader the editor seeds from ---')
// committeeRoleOf answers "what is this person to that committee"; the editor
// needs "what is written down". Reading the first in the editor would promote
// an admin's own volunteer committees to manager and save them that way.
const adminVol = { role: 'admin', committees: { kitchen: 'volunteer' } }
check('derived says manager', committeeRoleOf(adminVol, 'kitchen'), 'manager')
check('stored still says volunteer', storedRoleOf(adminVol, 'kitchen'), 'volunteer')
check('and nothing where nothing is written', storedRoleOf(adminVol, 'cultural'), null)

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
