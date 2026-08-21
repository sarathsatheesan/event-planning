import { formatTime, offsetFromStart } from './records.js'
import { formatDateRange } from '../data/events.js'

// The four phases, in the order they appear in the app. `key` matches the
// checkbox ids in the export dialog.
export const EXPORT_SECTIONS = [
  { key: 'preevent', label: 'Pre-Event Planning', phase: 'Phase 1' },
  { key: 'dayof', label: 'Day-Of Command Center', phase: 'Phase 2' },
  { key: 'vendors', label: 'Vendor & Resource Directory', phase: 'Phase 3' },
  { key: 'wrapup', label: 'Post-Event Wrap-Up', phase: 'Phase 4' },
]

const INK = [18, 21, 28]
const SOFT = [110, 118, 132]
const ACCENT = [47, 95, 237]
const RULE = [221, 224, 231]

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * jsPDF's built-in Helvetica is WinAnsi-encoded, which has no U+2212 minus —
 * it renders as a stray quote mark. Swap it for an ASCII hyphen on the way in.
 */
function safe(value) {
  return typeof value === 'string' ? value.replace(/\u2212/g, '-') : value
}

function money(n) {
  return n == null ? '—' : `$${Number(n).toLocaleString()}`
}

/** Section banner. Every section starts on its own page. */
function sectionHeading(doc, phase, label, y) {
  doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(...SOFT)
  doc.text(phase.toUpperCase(), 40, y)
  doc.setFont('helvetica', 'bold').setFontSize(15).setTextColor(...INK)
  doc.text(label, 40, y + 16)
  doc.setDrawColor(...RULE).setLineWidth(0.75)
  doc.line(40, y + 24, doc.internal.pageSize.getWidth() - 40, y + 24)
  return y + 42
}

function table(doc, autoTable, head, body, startY, columnStyles) {
  autoTable(doc, {
    head: [head.map(safe)],
    body: body.map((row) => row.map(safe)),
    startY,
    margin: { left: 40, right: 40 },
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: INK, lineColor: RULE, lineWidth: 0.5 },
    headStyles: { fillColor: [243, 244, 247], textColor: INK, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles,
  })
  return doc.lastAutoTable.finalY
}

/** Free-text list rendered as bullets — used by the wrap-up notes. */
function bulletList(doc, title, items, y, color = INK) {
  const width = doc.internal.pageSize.getWidth() - 80
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...color)
  doc.text(title, 40, y)
  y += 14
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...INK)
  if (items.length === 0) {
    doc.setTextColor(...SOFT).text('— none recorded —', 46, y)
    return y + 18
  }
  for (const item of items) {
    const lines = doc.splitTextToSize(safe(item) || '(blank)', width - 12)
    doc.text('•', 46, y)
    doc.text(lines, 56, y)
    y += lines.length * 11 + 4
  }
  return y + 8
}

/**
 * Build and download a PDF for one event.
 *
 * jsPDF is ~400KB, so it is imported on demand rather than shipped in the main
 * bundle — most visits never export anything.
 */
export async function exportEventPdf(event, selectedKeys) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let first = true

  // ---- Cover block on the first page ----
  doc.setFont('helvetica', 'bold').setFontSize(8).setTextColor(...ACCENT)
  doc.text('INDIA CULTURAL CENTER OF UTAH', 40, 50)
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...INK)
  doc.text(doc.splitTextToSize(event.name, pageWidth - 80), 40, 74)

  const when = [
    formatDateRange(event.date, event.endDate),
    event.startTime ? `starts ${formatTime(event.startTime)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const who = [
    event.venue || 'Venue to be confirmed',
    `Lead: ${event.lead || 'Unassigned'}`,
    event.attendanceEst ? `Est. attendance ${event.attendanceEst.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...SOFT)
  doc.text(when, 40, 100)
  doc.text(doc.splitTextToSize(who, pageWidth - 80), 40, 114)

  const done = event.checklist.filter((t) => t.status === 'Done').length
  doc.text(
    `${done} of ${event.checklist.length} milestones complete · Budget ${money(event.spent)} of ${money(event.budget)}`,
    40,
    132
  )

  let y = 158

  const startSection = (phase, label) => {
    if (!first) {
      doc.addPage()
      y = 56
    }
    first = false
    y = sectionHeading(doc, phase, label, y)
  }

  // ---- Phase 1 ----
  if (selectedKeys.includes('preevent')) {
    startSection('Phase 1', 'Pre-Event Planning')
    const rows = event.checklist.map((t) => [
      t.anchor,
      t.task || '(untitled)',
      t.category,
      t.assignee?.trim() || 'Unassigned',
      t.due,
      t.status,
    ])
    if (rows.length === 0) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...SOFT)
      doc.text('No milestones recorded.', 40, y)
    } else {
      table(
        doc,
        autoTable,
        ['Phase', 'Milestone', 'Category', 'Owner', 'Due', 'Status'],
        rows,
        y,
        { 0: { cellWidth: 42 }, 1: { cellWidth: 190 }, 4: { cellWidth: 58 }, 5: { cellWidth: 58 } }
      )
    }
  }

  // ---- Phase 2 ----
  if (selectedKeys.includes('dayof')) {
    startSection('Phase 2', 'Day-Of Command Center')
    const rows = event.runOfShow.map((it) => [
      it.time,
      offsetFromStart(it.time, event.startTime) ?? '—',
      it.item || '(untitled)',
      it.owner?.trim() || 'Unassigned',
      it.status,
    ])
    if (rows.length === 0) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...SOFT)
      doc.text('No run of show recorded.', 40, y)
    } else {
      table(
        doc,
        autoTable,
        ['Time', 'vs. start', 'Activity', 'Owner', 'Status'],
        rows,
        y,
        { 0: { cellWidth: 46 }, 1: { cellWidth: 52 }, 3: { cellWidth: 90 }, 4: { cellWidth: 62 } }
      )
    }
  }

  // ---- Phase 3 ----
  if (selectedKeys.includes('vendors')) {
    startSection('Phase 3', 'Vendor & Resource Directory')
    const vendors = event.vendors ?? []
    const rows = vendors.map((v) => [
      v.name || '(unnamed)',
      v.role || '—',
      v.contact || '—',
      v.phone || '—',
      v.loadIn || '—',
      money(v.balance),
    ])
    if (rows.length === 0) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...SOFT)
      doc.text('No vendors recorded.', 40, y)
    } else {
      const finalY = table(
        doc,
        autoTable,
        ['Vendor', 'Provides', 'Contact', 'Phone', 'Load-in', 'Balance'],
        rows,
        y,
        { 5: { halign: 'right', cellWidth: 60 } }
      )
      const outstanding = vendors.reduce((sum, v) => sum + (v.balance ?? 0), 0)
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
      doc.text(`Outstanding balances: ${money(outstanding)}`, pageWidth - 40, finalY + 18, {
        align: 'right',
      })
    }
  }

  // ---- Phase 4 ----
  if (selectedKeys.includes('wrapup')) {
    startSection('Phase 4', 'Post-Event Wrap-Up')
    const retro = event.retro
    if (!retro) {
      doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...SOFT)
      doc.text('Wrap-up not filled in yet.', 40, y)
    } else {
      const budget = retro.finalReconciliation?.budget ?? null
      const spent = retro.finalReconciliation?.spent ?? null
      const variance = budget != null && spent != null ? budget - spent : null
      y = table(
        doc,
        autoTable,
        ['Budgeted', 'Spent', 'Variance'],
        [
          [
            money(budget),
            money(spent),
            variance == null
              ? '—'
              : `${variance >= 0 ? '+' : '-'}$${Math.abs(variance).toLocaleString()}`,
          ],
        ],
        y
      )
      y += 26
      y = bulletList(doc, 'Sponsor acknowledgments', retro.sponsorAcks ?? [], y)
      y = bulletList(doc, 'What worked', retro.whatWorked ?? [], y, [30, 142, 90])
      bulletList(doc, "What didn't — for next year's blueprint", retro.whatDidnt ?? [], y, [183, 121, 31])
    }
  }

  // ---- Footer on every page ----
  const generated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...SOFT)
    doc.text(`${event.name} — generated ${generated}`, 40, doc.internal.pageSize.getHeight() - 24)
    doc.text(`Page ${i} of ${total}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 24, {
      align: 'right',
    })
  }

  doc.save(`${slug(event.name)}-${event.date}.pdf`)
}
