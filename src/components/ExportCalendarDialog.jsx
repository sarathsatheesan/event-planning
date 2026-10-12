import { useEffect, useState } from 'react'
import {
  EXPORT_COLUMNS,
  buildRows,
  toCsv,
  toXlsx,
  describeScope,
  calendarFileName,
} from '../lib/calendarExport.js'
import { exportCalendarPdf } from '../lib/exportPdf.js'
import { activeCount } from '../lib/filters.js'

/**
 * Download the calendar — the list, not one event.
 *
 * There is no year picker in here on purpose. The filters above the calendar
 * already say which years, which org, which committee and which status, and
 * the dialog exports exactly what the list is showing: one set of controls,
 * and what you see is what you get. The counts at the top are what make that
 * trustworthy — they name the scope before anything is downloaded.
 */

const FORMATS = [
  {
    key: 'xlsx',
    label: 'Excel workbook',
    ext: '.xlsx',
    note: 'Dates as real dates, a frozen header row and filters already on.',
  },
  {
    key: 'csv',
    label: 'CSV',
    ext: '.csv',
    note: 'Opens anywhere — Excel, Google Sheets, Numbers.',
  },
  {
    key: 'pdf',
    label: 'PDF',
    ext: '.pdf',
    note: 'A landscape table to print or attach to a meeting agenda.',
  },
]

function download(bytes, filename, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking immediately cancels the download in Safari; one tick is enough.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ExportCalendarDialog({ events, filters, committees = [], onClose }) {
  const [format, setFormat] = useState('xlsx')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const rows = buildRows(events, committees)
  const scope = describeScope(filters, committees)
  const narrowed = activeCount(filters)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleExport() {
    setBusy(true)
    setError(null)
    try {
      if (format === 'csv') {
        download(toCsv(rows), calendarFileName(filters, 'csv', committees), 'text/csv;charset=utf-8')
      } else if (format === 'xlsx') {
        download(
          toXlsx(rows),
          calendarFileName(filters, 'xlsx', committees),
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      } else {
        await exportCalendarPdf(rows, { scope, filters, committees })
      }
      onClose()
    } catch (err) {
      setError(err?.message ?? 'Could not build the file.')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export the event calendar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Export the calendar</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {rows.length === 0 ? (
            'Nothing is showing — clear a filter and try again.'
          ) : (
            <>
              <span className="font-semibold text-ink">
                {rows.length} event{rows.length === 1 ? '' : 's'}
              </span>{' '}
              — {scope}. {narrowed > 0 ? 'Change the filters' : 'Pick a year'} above the calendar to
              export a different span.
            </>
          )}
        </p>

        <ul className="mt-4 flex flex-col gap-1">
          {FORMATS.map((f) => (
            <li key={f.key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-soft px-3 py-2.5 transition hover:border-border">
                <input
                  type="radio"
                  name="calendar-export-format"
                  checked={format === f.key}
                  onChange={() => setFormat(f.key)}
                  className="focus-ring h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {f.label}
                    <span className="ml-1.5 font-mono text-xs font-normal text-ink-soft">
                      {f.ext}
                    </span>
                  </span>
                  <span className="block text-xs text-ink-soft">{f.note}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-3 rounded-lg border border-border-soft bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">Columns:</span>{' '}
          {EXPORT_COLUMNS.map((c) => c.label).join(' · ')}
        </p>

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={busy || rows.length === 0}
            className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Building…' : `Download ${FORMATS.find((f) => f.key === format).ext}`}
          </button>
        </div>
      </div>
    </div>
  )
}
