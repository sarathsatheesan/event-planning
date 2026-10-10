// Run with: node src/lib/committee.test.mjs
//
// These three readers decide what a person can see once committee scoping
// ships, so they get a test of their own. Two stored shapes are in play at
// once — the plain array written before roles existed, and the map written
// since — and the whole point of the readers is that neither needs migrating.

import {
  committeeIdsOf,
  committeeRoleOf,
  managerListsOf,
  storedCommitteesOf,
  storedRoleOf,
} from './committee.js'
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

console.log('\n--- the manager lists the security rules read ---')
// The rules cannot search `members` for the signed-in address, so the roster
// carries this second view of who manages what. Everything here is about the
// two staying in agreement: a disagreement does not degrade gracefully, it
// fails the whole query for whoever is on the wrong side of it.
const roster = [
  { email: 'Manager@Icc.org', role: 'member', committees: { cultural: 'manager', kitchen: 'volunteer' } },
  { email: 'helper@icc.org', role: 'member', committees: { cultural: 'volunteer' } },
  { email: 'two@icc.org', role: 'member', committees: { kitchen: 'manager', religious: 'manager' } },
  { email: 'boss@icc.org', role: 'admin', committees: { cultural: 'volunteer' } },
  { email: 'old@icc.org', role: 'member', committees: ['cultural'] },
  { email: '  ', role: 'member', committees: { cultural: 'manager' } },
]
const lists = managerListsOf(roster)
check('one committee, one manager, lower-cased', lists.cultural, ['manager@icc.org'])
check('a manager of two appears in both', lists.religious, ['two@icc.org'])
check('kitchen has its manager and not its volunteer', lists.kitchen, ['two@icc.org'])
check('a committee nobody manages is absent', 'sponsorship' in lists, false)
// An admin manages everything by a separate test in the rules. Writing them in
// here as well would mean re-saving every admin row for each new committee.
check('an admin is not listed', JSON.stringify(lists).includes('boss@'), false)
// The array shape predates roles and reads as volunteer everywhere else; it
// must not be promoted here, of all places.
check('the pre-roles array shape manages nothing', lists.cultural.includes('old@icc.org'), false)
check('a blank row is skipped', JSON.stringify(lists).includes('  '), false)
check('nothing in, nothing out', managerListsOf(undefined), {})

// The agreement that matters: for every non-admin, the committees the client
// will query are exactly the committees that list them. If these two ever
// disagree the client asks for something the rules deny, and a denied document
// fails the entire read.
console.log('\n--- the client and the lists agree ---')
for (const m of roster) {
  if (!String(m.email).trim() || m.role === 'admin') continue
  const asksFor = COMMITTEES.map((c) => c.id).filter((id) => committeeRoleOf(m, id) === 'manager')
  const listedIn = COMMITTEES.map((c) => c.id).filter((id) =>
    (lists[id] ?? []).includes(String(m.email).trim().toLowerCase())
  )
  check(`${m.email.trim()} is listed in exactly what they would query`, listedIn, asksFor)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
