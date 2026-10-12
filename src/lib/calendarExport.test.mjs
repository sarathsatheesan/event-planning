// The calendar export: rows, CSV and a hand-written xlsx.
//
// The xlsx is the part worth testing hardest, because it is a zip of XML this
// repo writes itself. Asserting on the bytes would prove nothing, so every
// workbook here is read back with read-excel-file — the same parser the menu
// importer uses — which is as close to "Excel opened it" as Node gets.
//
// Run with `node src/lib/calendarExport.test.mjs`.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readXlsx from 'read-excel-file/node'
import {
  EXPORT_COLUMNS,
  buildRows,
  toCsv,
  toXlsx,
  describeScope,
  calendarFileName,
} from './calendarExport.js'
import { ALL } from './filters.js'
import { COMMITTEES } from '../data/events.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}
async function asyncTest(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const done = (n) => Array.from({ length: n }, () => ({ status: 'Done' }))
const todo = (n) => Array.from({ length: n }, () => ({ status: 'Not Started' }))

const EVENTS = [
  {
    name: 'Golden Era of Bollywood',
    date: '2027-02-28',
    endDate: '2027-03-01',
    status: 'Planning',
    lead: 'Suma',
    org: 'ICC',
    committee: 'cultural',
    venue: 'Community Hall, "A" wing',
    checklist: [...done(5), ...todo(15)],
  },
  {
    name: 'Maha Shivaratri',
    date: '2027-03-06',
    endDate: null,
    status: 'Planning',
    lead: null,
    org: 'Temple',
    committee: 'religious',
    venue: null,
    checklist: todo(26),
  },
  {
    name: 'Annadanam, Sunday',
    date: '2027-04-11',
    endDate: null,
    status: '30 Days Out',
    lead: 'Vidya',
    org: 'Temple',
    committee: 'kitchen',
    venue: 'Temple kitchen',
    checklist: [],
  },
]

/** Write the workbook, then read it back with the parser the app already
 *  ships. Asserting on the bytes would only prove this file agrees with
 *  itself. */
async function roundTrip(rows) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'eventops-')), 'events.xlsx')
  fs.writeFileSync(file, toXlsx(rows))
  // read-excel-file returns the rows for a single-sheet file in some builds
  // and a list of sheets in others. Normalise rather than pin the version.
  const result = await readXlsx(file)
  return Array.isArray(result?.[0]) ? result : result[0].data
}

console.log('calendarExport')

// ---- rows ------------------------------------------------------------------

test('one row per event, with the committee spelled out', () => {
  const rows = buildRows(EVENTS, COMMITTEES)
  assert.equal(rows.length, 3)
  assert.equal(rows[0].name, 'Golden Era of Bollywood')
  assert.equal(rows[0].committee, 'Cultural')
  assert.equal(rows[1].committee, 'Religious')
  assert.equal(rows[2].committee, 'Kitchen')
})

test('readiness comes from the checklist, and an empty one is 0 rather than NaN', () => {
  const rows = buildRows(EVENTS, COMMITTEES)
  assert.equal(rows[0].readiness, 25)
  assert.equal(rows[1].readiness, 0)
  assert.equal(rows[2].readiness, 0)
})

test('a missing lead, end date or venue stays blank, not a dash', () => {
  // A column of em dashes cannot be counted, sorted or filtered on. The PDF
  // puts the dash back; the spreadsheet must not.
  const [, shivaratri] = buildRows(EVENTS, COMMITTEES)
  assert.equal(shivaratri.lead, '')
  assert.equal(shivaratri.endDate, '')
  assert.equal(shivaratri.venue, '')
})

test('every column has a key the rows actually carry', () => {
  const [row] = buildRows(EVENTS, COMMITTEES)
  for (const c of EXPORT_COLUMNS) {
    assert.ok(c.key in row, `no value for column ${c.label}`)
    assert.ok(c.width > 0, `no width for column ${c.label}`)
  }
})

// ---- scope and file names --------------------------------------------------

test('an unfiltered calendar still says what it is', () => {
  assert.equal(describeScope({}, COMMITTEES), 'All years')
  assert.equal(
    describeScope({ year: ALL, org: ALL, committee: ALL, status: ALL, q: '' }, COMMITTEES),
    'All years'
  )
})

test('a filtered one names every narrowing, committee by its label', () => {
  assert.equal(
    describeScope(
      { year: '2027', org: 'Temple', committee: 'religious', status: '30 Days Out', q: ' yoga ' },
      COMMITTEES
    ),
    '2027 · Temple · Religious · 30 Days Out · matching “yoga”'
  )
})

test('the file name carries the scope, so three downloads are told apart', () => {
  assert.equal(calendarFileName({}, 'csv', COMMITTEES), 'event-calendar-all-years.csv')
  assert.equal(
    calendarFileName({ year: '2027', org: 'Temple', committee: 'religious' }, 'xlsx', COMMITTEES),
    'event-calendar-2027-temple-religious.xlsx'
  )
})

// ---- CSV -------------------------------------------------------------------

test('CSV leads with a byte order mark and ends its lines CRLF', () => {
  const csv = toCsv(buildRows(EVENTS, COMMITTEES))
  // Without the BOM, Excel on Windows renders “Diwali” as mojibake.
  assert.equal(csv[0], '﻿')
  assert.ok(csv.includes('\r\n'))
  assert.equal(csv.trimEnd().split('\r\n').length, 4)
})

test('CSV quotes a comma and doubles a quote inside a cell', () => {
  const csv = toCsv(buildRows(EVENTS, COMMITTEES))
  assert.ok(csv.includes('"Community Hall, ""A"" wing"'))
})

test('CSV headers are the columns, in order', () => {
  const [header] = toCsv(buildRows(EVENTS, COMMITTEES)).slice(1).split('\r\n')
  assert.equal(header, EXPORT_COLUMNS.map((c) => c.label).join(','))
})

// ---- XLSX ------------------------------------------------------------------

await asyncTest('the workbook parses, with the header row first', async () => {
  const data = await roundTrip(buildRows(EVENTS, COMMITTEES))
  assert.deepEqual(data[0], EXPORT_COLUMNS.map((c) => c.label))
  assert.equal(data.length, 4)
})

await asyncTest('dates come back as dates and readiness as a number', async () => {
  const data = await roundTrip(buildRows(EVENTS, COMMITTEES))
  const [, golden] = data
  assert.ok(golden[1] instanceof Date, 'start date is not a date')
  assert.equal(golden[1].toISOString().slice(0, 10), '2027-02-28')
  assert.equal(golden[2].toISOString().slice(0, 10), '2027-03-01')
  assert.equal(typeof golden[4], 'number')
  assert.equal(golden[4], 25)
})

await asyncTest('a quote in a venue survives the XML', async () => {
  const data = await roundTrip(buildRows(EVENTS, COMMITTEES))
  assert.equal(data[1][8], 'Community Hall, "A" wing')
})

await asyncTest('an ampersand and an em dash survive too', async () => {
  const data = await roundTrip(
    buildRows(
      [{ ...EVENTS[0], name: 'Vendor & Resource Fair — 2027', venue: '<main> stage' }],
      COMMITTEES
    )
  )
  assert.equal(data[1][0], 'Vendor & Resource Fair — 2027')
  assert.equal(data[1][8], '<main> stage')
})

await asyncTest('an empty calendar is still a readable workbook', async () => {
  const data = await roundTrip([])
  assert.deepEqual(data, [EXPORT_COLUMNS.map((c) => c.label)])
})

await asyncTest('five years of events round-trip without losing a row', async () => {
  const many = Array.from({ length: 80 }, (_, i) => ({
    ...EVENTS[1],
    name: `Event ${i + 1}`,
    date: `202${3 + Math.floor(i / 20)}-0${(i % 9) + 1}-15`,
  }))
  const data = await roundTrip(buildRows(many, COMMITTEES))
  assert.equal(data.length, 81)
  assert.equal(data[80][0], 'Event 80')
})

console.log(`\n${passed} passed\n`)
