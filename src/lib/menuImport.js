// Turning somebody else's menu into rows we can add.
//
// A stall's menu arrives as whatever the vendor had: a spreadsheet column
// pasted into an email, a CSV exported from Google Sheets, a workbook, a PDF
// made in Word. Typing eighty dishes by hand is the reason the Food Menu tab
// of the workbook took a season to fill, so the import has to be forgiving.
//
// Everything here is pure: text or a grid of cells in, candidate items out.
// The file-reading shells live in menuFiles.js, and nothing is ever written to
// a stall from here — the screen shows what was found and a person says yes.

/** A price written any of the ways a committee writes one. */
export function parsePrice(raw) {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? round2(raw) : null
  let text = String(raw).trim()
  if (!text) return null
  // "$5", "5 USD", "Rs. 120", "5/-", "£4.50"
  text = text.replace(/[$£€₹]|usd|inr|rs\.?|\/-/gi, ' ').trim()
  // "5.00 each", "7 (per plate)"
  const m = text.match(/-?\d+(?:[.,]\d+)?/)
  if (!m) return null
  const n = Number(m[0].replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return null
  return round2(n)
}

const round2 = (n) => Math.round(n * 100) / 100

/**
 * Split a block of text into rows of cells.
 *
 * Tabs first: that is what a spreadsheet puts on the clipboard, and it is the
 * only separator that never appears inside a dish name. Commas are tried only
 * when there are no tabs, and quoted fields are honoured because "Combo 1
 * (rice, kurma)" is one cell, not two.
 */
export function splitRows(text) {
  const lines = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  const tabbed = lines.some((l) => l.includes('\t'))
  return lines.map((line) => (tabbed ? line.split('\t') : splitCsvLine(line)).map((c) => c.trim()))
}

function splitCsvLine(line) {
  const out = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cell)
      cell = ''
    } else cell += ch
  }
  out.push(cell)
  return out
}

const HEADER_WORDS = /^(item|items|dish|dishes|menu|name|product|food|description|price|cost|rate|amount|\$|usd|qty|quantity|s\.?\s*no\.?|sl\.?\s*no\.?|#)$/i

/** Does this row look like column headings rather than a dish? */
export function looksLikeHeader(cells) {
  const filled = cells.filter((c) => c !== '')
  if (filled.length === 0) return false
  // A heading row has no prices in it and its words are heading words.
  if (filled.some((c) => parsePrice(c) !== null && /^\s*[$£€₹]?\s*\d/.test(c))) return false
  return filled.every((c) => HEADER_WORDS.test(c))
}

/**
 * Pick the dish and the price out of a row.
 *
 * The dish is the longest cell that is not a price and not a bare number — a
 * serial number column is extremely common and must not become a dish called
 * "7". The price is the last cell that reads as money; last, because
 * "Combo 2 - 3 items" has a number early and the price at the end.
 */
export function rowToItem(cells) {
  const trimmed = (cells ?? []).map((c) => String(c ?? '').trim())
  const price = lastPrice(trimmed)
  const name = trimmed
    .filter((c) => c !== '' && !isBareNumber(c))
    .sort((a, b) => b.length - a.length)[0]
  if (!name) return null
  const item = collapse(name)
  return item ? { item, price } : null
}

function isBareNumber(cell) {
  return /^\s*[$£€₹]?\s*-?\d+(?:[.,]\d+)?\s*(?:usd|inr|rs\.?|\/-)?\s*$/i.test(cell)
}

function lastPrice(cells) {
  // From the right, because a price column sits after the dish. Stopping at
  // the first text cell is what keeps a serial-number column out of the price:
  // "3 | Masala Cut Mirchi | " has a number in it, but not after the name.
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i] === '') continue
    if (isBareNumber(cells[i])) return parsePrice(cells[i])
    break
  }
  // Nothing in a column of its own, so try a price written into the name:
  // "Pani Puri - $5.99" or "Masala Dosa 6.99".
  const joined = cells.filter(Boolean).join(' ')
  const trailing = joined.match(/[$£€₹]\s*\d+(?:[.,]\d{1,2})?\s*$|[-–—]\s*\d+(?:[.,]\d{1,2})?\s*$/)
  return trailing ? parsePrice(trailing[0]) : null
}

/** Strip the price off the end of a name that carried it inline. */
function collapse(name) {
  return name
    .replace(/\s*[-–—:]?\s*[$£€₹]\s*\d+(?:[.,]\d{1,2})?\s*$/, '')
    .replace(/\s*[-–—]\s*\d+(?:[.,]\d{1,2})\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The whole job: a grid of cells to candidate menu items.
 *
 * Returns what it found and what it threw away, because an import that
 * silently drops four of twenty rows is worse than one that imports nothing.
 */
export function toMenuItems(rows) {
  const items = []
  const skipped = []
  let headerDropped = false

  rows.forEach((cells, i) => {
    const filled = cells.filter((c) => c !== '')
    if (filled.length === 0) return
    if (i < 3 && !headerDropped && looksLikeHeader(cells)) {
      headerDropped = true
      return
    }
    const item = rowToItem(cells)
    if (!item || !item.item) {
      skipped.push({ line: i + 1, text: filled.join(' | '), why: 'no dish name in it' })
      return
    }
    items.push(item)
  })

  return { items, skipped, headerDropped }
}

/** Text (pasted, CSV, or pulled out of a PDF) straight to candidate items. */
export function parseMenuText(text) {
  return toMenuItems(splitRows(text))
}

/**
 * A PDF's text comes back as a stream of fragments with positions. Dishes and
 * prices sit on the same visual line but arrive as separate fragments, so they
 * are regrouped by vertical position before being parsed as rows.
 */
export function pdfLinesToRows(fragments, tolerance = 3) {
  const lines = []
  for (const f of fragments) {
    if (!f.text?.trim()) continue
    const line = lines.find((l) => Math.abs(l.y - f.y) <= tolerance)
    if (line) line.parts.push(f)
    else lines.push({ y: f.y, parts: [f] })
  }
  lines.sort((a, b) => b.y - a.y)
  return lines.map((l) =>
    l.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.text.trim())
      .filter(Boolean)
  )
}
