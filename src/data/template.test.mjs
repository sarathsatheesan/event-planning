// The blueprints: two shapes, one of which 15 seed events depend on never
// changing. Run with `node src/data/template.test.mjs`.
import assert from 'node:assert/strict'
import {
  TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_CATEGORIES,
  TEMPLE_CATEGORIES,
  ANCHOR_DAYS,
  ANCHOR_ORDER,
  templateById,
  shiftDate,
  buildTemplateChecklist,
  realignDueDates,
} from './template.js'
import { buildEvent } from './blueprint.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

console.log('template')

// --- the registry -----------------------------------------------------------

test('both blueprints are offered, under the names the committee asked for', () => {
  assert.deepEqual(
    TEMPLATES.map((t) => [t.id, t.name]),
    [
      ['icc', 'Standard ICC Template'],
      ['temple', 'Standard Temple Template'],
    ]
  )
})

test('the cultural blueprint is the default', () => {
  assert.equal(DEFAULT_TEMPLATE_ID, 'icc')
  assert.equal(templateById(DEFAULT_TEMPLATE_ID).id, 'icc')
})

test('an unknown id falls back rather than producing an event with no checklist', () => {
  assert.equal(templateById('does-not-exist').id, 'icc')
  assert.equal(templateById(undefined).id, 'icc')
  assert.equal(templateById(null).id, 'icc')
})

test('every row is well formed: anchor known, offset matching, category declared', () => {
  for (const t of TEMPLATES) {
    assert.ok(t.rows.length > 0, `${t.id} has rows`)
    assert.ok(t.categories.length > 0, `${t.id} has categories`)
    for (const [anchor, days, task, category] of t.rows) {
      assert.ok(ANCHOR_ORDER.includes(anchor), `${t.id}: unknown anchor ${anchor}`)
      assert.equal(days, ANCHOR_DAYS[anchor], `${t.id}: ${anchor} offset disagrees`)
      assert.ok(task.trim().length > 0, `${t.id}: empty task`)
      assert.ok(t.categories.includes(category), `${t.id}: category ${category} not declared`)
    }
  }
})

test('rows run from the longest lead time to the shortest', () => {
  for (const t of TEMPLATES) {
    const offsets = t.rows.map(([anchor]) => ANCHOR_DAYS[anchor])
    assert.deepEqual(offsets, [...offsets].sort((a, b) => b - a), `${t.id} is out of order`)
  }
})

test('the two blueprints really are different shapes', () => {
  const temple = templateById('temple')
  assert.deepEqual(temple.categories, TEMPLE_CATEGORIES)
  assert.deepEqual(templateById('icc').categories, TEMPLATE_CATEGORIES)
  // No artists, no ticketing: that is the whole point of a second blueprint.
  assert.equal(temple.categories.includes('Artists'), false)
  assert.equal(temple.categories.includes('Registration'), false)
  // And a shorter runway — a puja is planned in two months, not three.
  assert.equal(
    Math.max(...temple.rows.map(([a]) => ANCHOR_DAYS[a])),
    60
  )
})

// --- the guard the seed depends on -----------------------------------------

test('one argument still means the cultural blueprint, byte for byte', () => {
  // src/data/events.js calls buildTemplateChecklist(date) for 13 seed events.
  // If the default ever moved, every one of them would silently change shape.
  assert.deepEqual(
    buildTemplateChecklist('2027-01-31'),
    buildTemplateChecklist('2027-01-31', 'icc')
  )
  assert.equal(buildTemplateChecklist('2027-01-31').length, templateById('icc').rows.length)
})

// --- building a checklist ---------------------------------------------------

test('a fresh checklist is dated off the event and assigned to nobody', () => {
  const list = buildTemplateChecklist('2027-03-15', 'temple')
  assert.equal(list.length, templateById('temple').rows.length)
  list.forEach((task, i) => {
    assert.equal(task.id, i + 1)
    assert.equal(task.assignee, '')
    assert.equal(task.status, 'Not Started')
    assert.equal(task.due, shiftDate('2027-03-15', ANCHOR_DAYS[task.anchor]))
  })
})

test('the muhurtham task leads the temple blueprint', () => {
  const [first] = buildTemplateChecklist('2027-03-15', 'temple')
  assert.equal(first.anchor, 'T-60')
  assert.equal(first.category, 'Rituals')
  assert.match(first.task, /muhurtham/)
  assert.equal(first.due, '2027-01-14')
})

test('due dates survive a spring-forward crossing', () => {
  // Utah moves to DST on 2027-03-14. A UTC-based shift would land a day out.
  assert.equal(shiftDate('2027-03-15', 7), '2027-03-08')
  assert.equal(shiftDate('2027-03-15', 60), '2027-01-14')
})

test('realignDueDates re-spaces a temple checklist and keeps every edit', () => {
  const list = buildTemplateChecklist('2027-03-15', 'temple').map((t) =>
    t.id === 1 ? { ...t, assignee: 'priest@example.org', status: 'Complete' } : t
  )
  const moved = realignDueDates(list, '2027-04-15')
  assert.equal(moved[0].due, '2027-02-14')
  assert.equal(moved[0].assignee, 'priest@example.org')
  assert.equal(moved[0].status, 'Complete')
  assert.equal(moved.length, list.length)
})

// --- through buildEvent -----------------------------------------------------

test('a new event built from the temple blueprint carries its categories', () => {
  const built = buildEvent({ name: ' Maha Shivaratri ', date: '2027-03-15', templateId: 'temple' })
  assert.equal(built.name, 'Maha Shivaratri')
  assert.deepEqual(built.categories, TEMPLE_CATEGORIES)
  assert.equal(built.checklist.length, templateById('temple').rows.length)
  assert.equal(
    built.checklist.every((t) => t.assignee === '' && t.status === 'Not Started'),
    true
  )
  assert.equal(built.lead, null)
})

test('no templateId still builds the cultural event it always did', () => {
  const built = buildEvent({ name: 'Diwali 2027', date: '2027-10-29' })
  assert.deepEqual(built.categories, TEMPLATE_CATEGORIES)
  assert.deepEqual(built.checklist, buildTemplateChecklist('2027-10-29'))
})

test('copying a previous event ignores the blueprint and keeps the copy', () => {
  const source = {
    ...buildEvent({ name: 'Last year', date: '2026-03-15', templateId: 'temple' }),
    id: 'seed',
  }
  const copy = buildEvent({
    name: 'This year',
    date: '2027-03-15',
    source,
    templateId: 'icc',
  })
  assert.deepEqual(copy.categories, TEMPLE_CATEGORIES)
  assert.equal(copy.checklist.length, source.checklist.length)
  assert.equal(copy.checklist[0].due, '2027-01-14')
})

console.log(`\n${passed} passed\n`)
