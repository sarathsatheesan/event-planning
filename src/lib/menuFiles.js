// Reading a menu out of whatever file the vendor sent.
//
// Three shells around the pure parser in menuImport.js. Each one's only job is
// to get cells or text out of a file; what counts as a dish is decided in one
// place, not three.
//
// The two heavy libraries are imported dynamically, when somebody actually
// picks a file of that kind. Loading a PDF engine on the chance that one of
// fifteen events might one day import a menu would put it in front of every
// visitor opening the calendar on a phone.

import { parseMenuText, toMenuItems, pdfLinesToRows } from './menuImport.js'

export const ACCEPT = '.csv,.tsv,.txt,.xlsx,.xls,.pdf'

/** Dispatch on the extension; the browser's MIME types are not dependable. */
export async function readMenuFile(file) {
  const name = (file?.name ?? '').toLowerCase()
  if (name.endsWith('.pdf')) return readPdf(file)
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return readExcel(file)
  return readText(file)
}

async function readText(file) {
  const text = await file.text()
  const parsed = parseMenuText(text)
  return { ...parsed, source: 'text' }
}

async function readExcel(file) {
  // `readSheet`, not the default export: since read-excel-file v9 the default
  // returns every sheet in the workbook, and a vendor's menu is on the first
  // one. Worth knowing when this dependency is next upgraded — the v8 call
  // returned rows directly and fails here with "e.map is not a function".
  const { readSheet } = await import('read-excel-file/browser')
  let rows
  try {
    rows = await readSheet(file)
  } catch {
    // .xls (the old binary format) is not the same thing as .xlsx and this
    // reader cannot open it. Say which, rather than "could not read file".
    return {
      items: [],
      skipped: [],
      source: 'excel',
      error:
        'That workbook could not be opened. If it is an older .xls file, open it and ' +
        'save as .xlsx or CSV first.',
    }
  }
  const cells = rows.map((r) => r.map((c) => (c === null || c === undefined ? '' : String(c))))
  return { ...toMenuItems(cells), source: 'excel' }
}

async function readPdf(file) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  // Keep the loading task: `destroy` lives on it, not on the document proxy,
  // and calling it on the document throws after the pages have been read -
  // which loses a menu that was parsed perfectly well. Hence the finally.
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const rows = []
  try {
    const doc = await task.promise
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const fragments = content.items
        .filter((i) => typeof i.str === 'string')
        .map((i) => ({ text: i.str, x: i.transform[4], y: i.transform[5] }))
      rows.push(...pdfLinesToRows(fragments))
    }
  } finally {
    await task.destroy().catch(() => {})
  }

  // A scanned or photographed menu is a picture of text. Nothing is wrong with
  // the file and nothing can be read out of it, so say that plainly instead of
  // reporting an empty menu.
  if (rows.length === 0) {
    return {
      items: [],
      skipped: [],
      source: 'pdf',
      error:
        'This PDF has no text in it — it looks like a scan or a photo. Ask the vendor for ' +
        'the menu as a spreadsheet or CSV, or type the dishes in.',
    }
  }
  return { ...toMenuItems(rows), source: 'pdf' }
}
