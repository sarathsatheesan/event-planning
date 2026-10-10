// Run with: node src/lib/work.test.mjs
//
// My work edits a row that has been lifted out of its event, so every one of
// these is really about the trip back: the right array, the right item, and
// nothing else in the event disturbed — `saveOverride` replaces the document
// rather than merging, so a patch that drops a field drops it for good.

import { statusPatch, ownersPatch } from './work.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    expected && typeof expected === 'object'
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}`)
}

const event = () => ({
  id: 'india-mela',
  name: 'India Mela',
  checklist: [
    { id: 'c1', task: 'Book the hall', status: 'Not Started', due: '2026-11-01' },
    { id: 'c2', task: 'Order flyers', status: 'Blocked', assignee: 'Hari', assigneeEmail: 'hari@icc.org' },
  ],
  retro: {
    notes: 'went well',
    actions: [{ id: 'a1', action: 'Book January slot', status: 'Not Started' }],
  },
})

const HARI = { name: 'Hari', email: 'hari@icc.org' }
const GANGA = { name: 'Ganga', email: 'ganga@icc.org' }

console.log('--- status, milestone ---')
const s1 = statusPatch(event(), { kind: 'milestone', itemId: 'c1' })
check('only the checklist is in the patch', Object.keys(s1), ['checklist'])
check('the named row advanced', s1.checklist[0].status, 'In Progress')
check('its neighbour did not', s1.checklist[1].status, 'Blocked')
check('and nothing else on the row was touched', s1.checklist[0].task, 'Book the hall')

console.log('\n--- status, follow-up ---')
const s2 = statusPatch(event(), { kind: 'action', itemId: 'a1' })
check('only retro is in the patch', Object.keys(s2), ['retro'])
check('the action advanced', s2.retro.actions[0].status, 'In Progress')
// The retro carries more than its actions, and saveOverride replaces rather
// than merges, so rebuilding it from the actions alone would erase the notes.
check('the rest of the retro survives', s2.retro.notes, 'went well')

console.log('\n--- owners ---')
const o1 = ownersPatch(event(), { kind: 'milestone', itemId: 'c1' }, [HARI, GANGA])
check('both owners are written', o1.checklist[0].assignees, [HARI, GANGA])
// The scalars are mirrored for a digest that has not been redeployed yet.
check('the first owner is mirrored to the old field', o1.checklist[0].assignee, 'Hari')
check('and their address with it', o1.checklist[0].assigneeEmail, 'hari@icc.org')
check('the untouched row keeps its owner', o1.checklist[1].assignee, 'Hari')

const o2 = ownersPatch(event(), { kind: 'milestone', itemId: 'c2' }, [])
check('clearing writes an empty list', o2.checklist[1].assignees, [])
check('and empties the mirror rather than leaving it stale', o2.checklist[1].assignee, '')
check('including the address, which is what grants access', o2.checklist[1].assigneeEmail, null)

const o3 = ownersPatch(event(), { kind: 'action', itemId: 'a1' }, [GANGA])
check('a follow-up takes owners too', o3.retro.actions[0].assignees, [GANGA])
check('and keeps its own status', o3.retro.actions[0].status, 'Not Started')

console.log('\n--- nothing to write ---')
// An id that is not there must produce no patch at all. An empty patch is not
// harmless here: it still costs a whole-document write.
for (const [label, patch] of [
  ['missing event', statusPatch(null, { kind: 'milestone', itemId: 'c1' })],
  ['missing row', statusPatch(event(), null)],
  ['unknown milestone id', statusPatch(event(), { kind: 'milestone', itemId: 'nope' })],
  ['unknown action id', statusPatch(event(), { kind: 'action', itemId: 'nope' })],
  ['no retro at all', statusPatch({ id: 'x', checklist: [] }, { kind: 'action', itemId: 'a1' })],
  ['owners on an unknown id', ownersPatch(event(), { kind: 'milestone', itemId: 'nope' }, [HARI])],
  ['owners with no retro', ownersPatch({ id: 'x' }, { kind: 'action', itemId: 'a1' }, [HARI])],
]) {
  check(label + ' writes nothing', patch, null)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
