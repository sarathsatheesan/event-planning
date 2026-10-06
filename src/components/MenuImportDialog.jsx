import { useEffect, useMemo, useState } from 'react'
import { ACCEPT, readMenuFile } from '../lib/menuFiles.js'
import { parseMenuText, parsePrice } from '../lib/menuImport.js'
import { findClashes } from '../lib/menu.js'
import { CLASH_TONE } from '../lib/clashTone.js'

/**
 * Bring a stall's menu in from a file, instead of typing eighty dishes.
 *
 * The rule the whole screen is built around: nothing is ever added without
 * somebody looking at it first. A parser reading somebody else's spreadsheet
 * will get rows wrong — a serial number read as a price, a footer read as a
 * dish — and the cost of a silent bad import is a menu nobody trusts. So every
 * row lands here, editable, with a tick beside it, and the clash check runs
 * against the other stalls before anything is committed.
 */
export default function MenuImportDialog({ vendor, vendors, onAdd, onClose }) {
  const [rows, setRows] = useState([])
  const [paste, setPaste] = useState('')
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Clashes are checked against the menu this import would produce, so a dish
  // already sold at another stall is flagged before it is added rather than
  // after. Rows that are ticked off do not count.
  const clashes = useMemo(() => {
    const taken = rows.filter((r) => r.keep && r.item.trim())
    const draft = vendors.map((v) =>
      v.id === vendor.id
        ? { ...v, menu: [...(v.menu ?? []), ...taken.map((r, i) => ({ id: `new-${i}`, item: r.item }))] }
        : v
    )
    return findClashes(draft)
  }, [rows, vendors, vendor.id])

  function accept(result, label) {
    if (result.error) {
      setError(result.error)
      setRows([])
      setNotice(null)
      return
    }
    setError(null)
    setRows(result.items.map((i) => ({ ...i, keep: true })))
    const bits = [`${result.items.length} dish${result.items.length === 1 ? '' : 'es'} found in ${label}`]
    if (result.headerDropped) bits.push('a heading row was ignored')
    if (result.skipped.length) {
      bits.push(
        `${result.skipped.length} line${result.skipped.length === 1 ? '' : 's'} had no dish name: ` +
          result.skipped.map((s) => `“${s.text}”`).slice(0, 3).join(', ')
      )
    }
    setNotice(bits.join(' · '))
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      accept(await readMenuFile(file), file.name)
    } catch (err) {
      setError(err?.message ?? 'That file could not be read.')
      setRows([])
    }
    setBusy(false)
  }

  function onParsePaste() {
    if (!paste.trim()) return
    accept(parseMenuText(paste), 'what you pasted')
  }

  const keeping = rows.filter((r) => r.keep && r.item.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Import a menu for ${vendor.stall || 'this stall'}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">
          Import a menu{vendor.stall ? ` for ${vendor.stall}` : ''}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Paste the dishes from a spreadsheet or email, or open the file the vendor sent. Nothing is
          added until you have looked at it.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Paste
            </label>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={4}
              placeholder={'Pani Puri\t5.99\nDabeli\t5.99'}
              className="focus-ring mt-1 w-full rounded-md border border-border-soft bg-transparent px-2 py-1.5 font-mono text-xs text-ink transition focus:border-accent focus:bg-surface"
            />
            <button
              type="button"
              onClick={onParsePaste}
              disabled={!paste.trim()}
              className="focus-ring mt-1 rounded-md border border-border px-3 py-1 text-xs font-semibold text-ink-soft transition hover:text-ink disabled:opacity-40"
            >
              Read what I pasted
            </button>
          </div>

          <div className="sm:w-56">
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Or a file
            </label>
            <input
              type="file"
              accept={ACCEPT}
              onChange={onFile}
              aria-label="Menu file"
              className="focus-ring mt-1 w-full rounded-md border border-border-soft px-2 py-1.5 text-xs text-ink-soft file:mr-2 file:rounded file:border-0 file:bg-accent-soft file:px-2 file:py-1 file:text-xs file:font-semibold file:text-accent"
            />
            <p className="mt-1 text-[11px] leading-snug text-ink-soft">
              CSV, Excel or PDF. A scanned or photographed menu is a picture — nothing can be read
              out of it.
            </p>
          </div>
        </div>

        {busy && <p className="mt-3 text-xs text-ink-soft">Reading the file…</p>}
        {error && (
          <p className="mt-3 rounded-lg border border-critical/40 bg-critical-soft/40 px-3 py-2 text-xs font-medium text-critical">
            {error}
          </p>
        )}
        {notice && !error && <p className="mt-3 text-xs text-ink-soft">{notice}</p>}

        {rows.length > 0 && (
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border-soft">
            <ul className="flex flex-col divide-y divide-border-soft">
              {rows.map((row, i) => {
                const clash = clashes.get(`new-${keeping.indexOf(row)}`)
                const tone = clash ? CLASH_TONE[clash.level] : null
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 ${tone ? tone.row : ''} ${
                      row.keep ? '' : 'opacity-45'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={row.keep}
                      aria-label={`Include ${row.item || 'this row'}`}
                      onChange={() =>
                        setRows((prev) =>
                          prev.map((r, n) => (n === i ? { ...r, keep: !r.keep } : r))
                        )
                      }
                      className="focus-ring h-4 w-4 shrink-0 accent-[var(--accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        value={row.item}
                        aria-label="Dish"
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r, n) => (n === i ? { ...r, item: e.target.value } : r))
                          )
                        }
                        className="focus-ring w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink transition hover:border-border-soft focus:border-accent"
                      />
                      {clash && (
                        <p className={`px-1 text-[11px] font-medium ${tone.text}`}>
                          {clash.level === 'duplicate' ? 'Also at ' : 'Similar to '}
                          {clash.with.map((w) => `${w.stall} — ${w.item}`).join('; ')}
                        </p>
                      )}
                    </div>
                    <input
                      value={row.price ?? ''}
                      inputMode="decimal"
                      aria-label="Price"
                      placeholder="—"
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, n) =>
                            n === i
                              ? { ...r, price: e.target.value === '' ? null : e.target.value }
                              : r
                          )
                        )
                      }
                      className="focus-ring tabular w-20 shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-sm font-semibold text-ink transition hover:border-border-soft focus:border-accent"
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            {rows.length === 0
              ? 'Nothing read yet.'
              : `${keeping.length} of ${rows.length} will be added.`}
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
              disabled={keeping.length === 0}
              onClick={() => {
                onAdd(
                  keeping.map((r) => ({
                    item: r.item.trim(),
                    // Through the same reader as the file, so a price typed
                    // here as "5,99" or "$6" lands the same way one read out
                    // of a spreadsheet does.
                    price: parsePrice(r.price),
                  }))
                )
                onClose()
              }}
              className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:opacity-40"
            >
              Add {keeping.length || ''} item{keeping.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
