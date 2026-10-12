// Exporting the calendar itself — the list, not one event.
//
// The per-event PDF (exportPdf.js) answers "what is the plan for India Mela".
// This answers "what is on the calendar next year, and who owns each one" —
// the thing a chair takes into a budget meeting or a board review.
//
// What gets exported is whatever the calendar is filtered to, in the order it
// is shown. That is deliberate: the filters above the list already say year,
// org, committee, status and name, and a second set of controls inside a
// dialog would be one more thing to keep in agreement with them.
//
// Everything here is pure — rows in, bytes out — so the formats can be tested
// in Node without a browser. The one impure part, handing the bytes to the
// browser, lives in the dialog.

import { readiness } from '../data/events.js'
import { ALL } from './filters.js'

/** The columns, in order. `width` is Excel character units; the PDF scales
 *  them to the page, so the two stay in proportion without a second table. */
export const EXPORT_COLUMNS = [
  { key: 'name', label: 'Event', width: 32 },
  // 14, not 12: the PDF spells dates out, and "May 10, 2027" wraps to a
  // second line at 12 — which makes one row taller than the rest and the
  // table look broken.
  { key: 'date', label: 'Date', width: 14, type: 'date' },
  { key: 'endDate', label: 'End date', width: 14, type: 'date' },
  { key: 'status', label: 'Status', width: 13 },
  { key: 'readiness', label: 'Readiness %', width: 12, type: 'number' },
  { key: 'lead', label: 'Lead', width: 20 },
  { key: 'org', label: 'Org', width: 9 },
  { key: 'committee', label: 'Committee', width: 15 },
  { key: 'venue', label: 'Venue', width: 28 },
]

/**
 * One row per event, already in the order the calendar shows them.
 *
 * Blanks stay blank rather than becoming an em dash: this is a spreadsheet,
 * and a column of dashes cannot be counted, sorted or filtered. The PDF puts
 * the dash back, because there it is being read rather than totalled.
 */
export function buildRows(events, committees = []) {
  const committeeName = (id) => committees.find((c) => c.id === id)?.name ?? id ?? ''
  return events.map((event) => ({
    name: event.name ?? '',
    date: event.date ?? '',
    endDate: event.endDate ?? '',
    status: event.status ?? '',
    readiness: readiness(event),
    lead: event.lead ?? '',
    org: event.org ?? '',
    committee: committeeName(event.committee),
    venue: event.venue ?? '',
  }))
}

/** "2027 · Temple · Religious" — what the reader is looking at, for the PDF
 *  heading and the file name. Says "All years" rather than nothing, because a
 *  printout with no scope line invites the question it was meant to answer. */
export function describeScope(filters = {}, committees = []) {
  const committeeName = (id) => committees.find((c) => c.id === id)?.name ?? id
  const parts = [
    filters.year && filters.year !== ALL ? filters.year : 'All years',
    filters.org && filters.org !== ALL ? filters.org : null,
    filters.committee && filters.committee !== ALL ? committeeName(filters.committee) : null,
    filters.status && filters.status !== ALL ? filters.status : null,
    filters.q && filters.q.trim() ? `matching “${filters.q.trim()}”` : null,
  ]
  return parts.filter(Boolean).join(' · ')
}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** event-calendar-2027-cultural.csv — the scope in the name, so three exports
 *  in a downloads folder are told apart without opening them. */
export function calendarFileName(filters, extension, committees = []) {
  const bits = [
    filters?.year && filters.year !== ALL ? filters.year : 'all-years',
    filters?.org && filters.org !== ALL ? filters.org : null,
    filters?.committee && filters.committee !== ALL
      ? (committees.find((c) => c.id === filters.committee)?.name ?? filters.committee)
      : null,
  ]
    .filter(Boolean)
    .map(slug)
  return `event-calendar-${bits.join('-')}.${extension}`
}

// ─────────────────────────────── CSV ────────────────────────────────

/**
 * CSV for Excel, Sheets and Numbers.
 *
 * Two details that are not obvious and both cost a bug report if missed: the
 * byte order mark, without which Excel on Windows reads “Diwali” as mojibake,
 * and CRLF line endings, which is what every spreadsheet writes and some older
 * Excel builds insist on reading.
 */
export function toCsv(rows, columns = EXPORT_COLUMNS) {
  const cell = (value) => {
    const text = value == null ? '' : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map((c) => cell(c.label)).join(',')]
  for (const row of rows) lines.push(columns.map((c) => cell(row[c.key])).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

// ─────────────────────────────── XLSX ───────────────────────────────
//
// A real workbook, written by hand. The alternative was a dependency: SheetJS
// is no longer published to npm at a version that is maintained, and ExcelJS
// is roughly a megabyte to turn fifteen rows into a table. The minimum
// spreadsheet a file needs to open in Excel, Numbers and Sheets is five small
// XML parts in a zip, and that is what this is — about 120 lines, no network,
// nothing to keep patched. `calendarExport.test.mjs` reads the result back
// with read-excel-file, which the app already depends on for menu imports, so
// the file is proven to parse rather than assumed to.

const encoder = new TextEncoder()

function xml(text) {
  return (
    String(text)
      // XML 1.0 has no way to carry a control character, and Excel refuses a
      // workbook containing one outright rather than skipping the cell. A
      // pasted venue name is the likely source, so drop them on the way in.
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  )
}

/** A1, B1 … Z1, AA1 — more than 26 columns is not in sight, but a loop is
 *  shorter than the comment explaining why it would break. */
function colRef(index) {
  let n = index + 1
  let ref = ''
  while (n > 0) {
    const r = (n - 1) % 26
    ref = String.fromCharCode(65 + r) + ref
    n = Math.floor((n - r) / 26)
  }
  return ref
}

/** Days since 1899-12-30, which is what Excel means by a date. Built from the
 *  date parts rather than a local Date, so an evening in Utah is not stored as
 *  the next morning. */
function excelSerial(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** A zip with every entry stored uncompressed. Five XML parts totalling a few
 *  kilobytes do not need deflating, and not deflating means not shipping a
 *  compression library to do it. */
function zip(files) {
  const now = new Date()
  const time =
    ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xffff
  const date =
    (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff

  const out = []
  const push16 = (v) => out.push(v & 0xff, (v >>> 8) & 0xff)
  const push32 = (v) => out.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff)
  const pushBytes = (b) => {
    for (let i = 0; i < b.length; i++) out.push(b[i])
  }

  const central = []
  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const crc = crc32(file.data)
    const offset = out.length

    push32(0x04034b50)
    push16(20)
    push16(0)
    push16(0)
    push16(time)
    push16(date)
    push32(crc)
    push32(file.data.length)
    push32(file.data.length)
    push16(nameBytes.length)
    push16(0)
    pushBytes(nameBytes)
    pushBytes(file.data)

    central.push({ nameBytes, crc, size: file.data.length, offset })
  }

  const cdStart = out.length
  for (const entry of central) {
    push32(0x02014b50)
    push16(20)
    push16(20)
    push16(0)
    push16(0)
    push16(time)
    push16(date)
    push32(entry.crc)
    push32(entry.size)
    push32(entry.size)
    push16(entry.nameBytes.length)
    push16(0)
    push16(0)
    push16(0)
    push16(0)
    push32(0)
    push32(entry.offset)
    pushBytes(entry.nameBytes)
  }
  const cdSize = out.length - cdStart

  push32(0x06054b50)
  push16(0)
  push16(0)
  push16(central.length)
  push16(central.length)
  push32(cdSize)
  push32(cdStart)
  push16(0)

  return new Uint8Array(out)
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Events" sheetId="1" r:id="rId1"/></sheets></workbook>`

// Style 1 is the bold header, style 2 is a date. numFmt 164 is spelled out
// rather than using Excel's built-in 14, which is mm-dd-yy and would show a
// US date to a committee that writes them the other way round.
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

function sheetXml(rows, columns) {
  const lastCol = colRef(columns.length - 1)
  const lastRow = rows.length + 1
  const cols = columns
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`)
    .join('')

  const header = columns
    .map((c, i) => `<c r="${colRef(i)}1" s="1" t="inlineStr"><is><t>${xml(c.label)}</t></is></c>`)
    .join('')

  const body = rows
    .map((row, r) => {
      const n = r + 2
      const cells = columns
        .map((c, i) => {
          const value = row[c.key]
          const ref = `${colRef(i)}${n}`
          if (value === '' || value == null) return ''
          if (c.type === 'date') return `<c r="${ref}" s="2"><v>${excelSerial(value)}</v></c>`
          if (c.type === 'number') return `<c r="${ref}"><v>${Number(value)}</v></c>`
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`
        })
        .join('')
      return `<row r="${n}">${cells}</row>`
    })
    .join('')

  // The header row is frozen and filterable: fifteen events fit on a screen,
  // five years of them do not.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCol}${lastRow}"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData><row r="1">${header}</row>${body}</sheetData><autoFilter ref="A1:${lastCol}${lastRow}"/></worksheet>`
}

/** The workbook, as bytes ready to hand to a download. */
export function toXlsx(rows, columns = EXPORT_COLUMNS) {
  const part = (name, text) => ({ name, data: encoder.encode(text) })
  return zip([
    part('[Content_Types].xml', CONTENT_TYPES),
    part('_rels/.rels', ROOT_RELS),
    part('xl/workbook.xml', WORKBOOK),
    part('xl/_rels/workbook.xml.rels', WORKBOOK_RELS),
    part('xl/styles.xml', STYLES),
    part('xl/worksheets/sheet1.xml', sheetXml(rows, columns)),
  ])
}
