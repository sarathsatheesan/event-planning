import { useEffect, useState } from 'react'
import { EXPORT_SECTIONS, exportEventPdf } from '../lib/exportPdf.js'

/** How much content each phase actually holds, so the picker can say so. */
function summarise(event, key) {
  if (key === 'artists') {
    const n = (event.artists ?? []).length
    if (n === 0) return 'empty'
    return `${n} candidate${n === 1 ? '' : 's'}${event.artistChoice ? ', one selected' : ''}`
  }
  if (key === 'preevent') {
    const n = event.checklist.length
    return n ? `${n} milestone${n === 1 ? '' : 's'}` : 'empty'
  }
  if (key === 'dayof') {
    const n = event.runOfShow.length
    return n ? `${n} scheduled item${n === 1 ? '' : 's'}` : 'empty'
  }
  if (key === 'vendors') {
    const n = (event.vendors ?? []).length
    return n ? `${n} vendor${n === 1 ? '' : 's'}` : 'empty'
  }
  return event.retro ? 'reconciliation & notes' : 'not filled in'
}

export default function ExportDialog({ event, onClose }) {
  // An event with no artist booking should not be offered an artist page.
  const sections = EXPORT_SECTIONS.filter((s) => s.key !== 'artists' || event.needsArtists)

  // Default to the phases that have something in them — exporting three blank
  // pages is nobody's intent.
  const [selected, setSelected] = useState(() =>
    sections
      .filter(
        (s) => summarise(event, s.key) !== 'empty' && summarise(event, s.key) !== 'not filled in'
      )
      .map((s) => s.key)
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle(key) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function handleExport() {
    setBusy(true)
    setError(null)
    try {
      // Keep the app's section order regardless of the order boxes were ticked.
      const ordered = sections.filter((s) => selected.includes(s.key)).map((s) => s.key)
      await exportEventPdf(event, ordered)
      onClose()
    } catch (err) {
      setError(err?.message ?? 'Could not build the PDF.')
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
        aria-label="Export event as PDF"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Export {event.name}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Choose what to include. Each section starts on its own page.
        </p>

        <ul className="mt-4 flex flex-col gap-1">
          {sections.map((s) => {
            const detail = summarise(event, s.key)
            return (
              <li key={s.key}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-soft px-3 py-2.5 transition hover:border-border">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.key)}
                    onChange={() => toggle(s.key)}
                    className="focus-ring h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{s.label}</span>
                    <span className="block text-xs text-ink-soft">{detail}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            {selected.length} of {sections.length} selected
          </p>
          <div className="flex gap-2">
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
              disabled={selected.length === 0 || busy}
              className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Building…' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
