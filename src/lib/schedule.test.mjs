// Run with: node src/lib/schedule.test.mjs
//
// The bug these come from: a two-day event whose start moved and whose end did
// not. Half of these are about the span surviving the move; the rest are about
// the ways a date range can be made nonsense and what should happen instead.

import { addDays, daysBetween, moveStart, moveEnd, suggestedEnd } from './schedule.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    expected && typeof expected === 'object'
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}`)
}

const twoDay = { date: '2027-03-06', endDate: '2027-03-07' }
const threeDay = { date: '2027-05-08', endDate: '2027-05-10' }
const oneDay = { date: '2027-02-14', endDate: null }

console.log('--- the arithmetic ---')
check('a day later', addDays('2027-03-06', 1), '2027-03-07')
check('across a month boundary', addDays('2027-02-28', 1), '2027-03-01')
// 2028 is a leap year; 2027 is not. Both have to land right.
check('28 Feb 2028 plus one is the 29th', addDays('2028-02-28', 1), '2028-02-29')
check('28 Feb 2027 plus one is the 1st', addDays('2027-02-28', 1), '2027-03-01')
check('across a year', addDays('2027-12-31', 1), '2028-01-01')
check('the span of a two-day event is one night', daysBetween('2027-03-06', '2027-03-07'), 1)
// Dates are handled at local midnight everywhere in this codebase; a UTC
// parse would make a US evening read as the next day and shift every span.
check('a US daylight-saving spring forward does not eat a day', daysBetween('2027-03-13', '2027-03-15'), 2)

console.log('\n--- moving the start takes the end with it ---')
check('two-day event pushed a month', moveStart(twoDay, '2027-04-06'), { date: '2027-04-06', endDate: '2027-04-07' })
check('three-day event keeps all three', moveStart(threeDay, '2027-06-01'), { date: '2027-06-01', endDate: '2027-06-03' })
check('moving backwards works the same', moveStart(twoDay, '2027-01-02'), { date: '2027-01-02', endDate: '2027-01-03' })
check('across a month boundary', moveStart(twoDay, '2027-02-28'), { date: '2027-02-28', endDate: '2027-03-01' })
// This is the bug: the end must not be left behind, which would make the
// event finish before it starts and read as Completed in deriveStatus.
const moved = moveStart(twoDay, '2027-09-01')
check('the end is never left in the past', daysBetween(moved.date, moved.endDate) > 0, true)

console.log('\n--- single-day events stay single-day ---')
check('no end date, no end date in the patch', moveStart(oneDay, '2027-03-01'), { date: '2027-03-01' })
check('a missing field behaves like a null one', moveStart({ date: '2027-02-14' }, '2027-03-01'), { date: '2027-03-01' })

console.log('\n--- nothing to write ---')
check('the same date again', moveStart(twoDay, '2027-03-06'), null)
check('an empty date', moveStart(twoDay, ''), null)
check('an event with no date at all', moveStart({}, '2027-03-06'), null)

console.log('\n--- the end date on its own ---')
check('a later end lengthens the event', moveEnd(twoDay, '2027-03-09'), { endDate: '2027-03-09' })
check('the same end again writes nothing', moveEnd(twoDay, '2027-03-07'), null)
check('adding an end to a single-day event', moveEnd(oneDay, '2027-02-15'), { endDate: '2027-02-15' })
// An end on or before the start is not a shorter event, it is a one-day one.
check('an end equal to the start clears it', moveEnd(twoDay, '2027-03-06'), { endDate: null })
check('an end before the start clears it', moveEnd(twoDay, '2027-03-01'), { endDate: null })
check('an empty end clears it', moveEnd(twoDay, ''), { endDate: null })
check('an event with no date at all', moveEnd({}, '2027-03-07'), null)

console.log('\n--- what the add control offers ---')
check('the day after the start', suggestedEnd(oneDay), '2027-02-15')
check('nothing without a start', suggestedEnd({}), null)

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
