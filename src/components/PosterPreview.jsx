import { useEffect } from 'react'

/**
 * Full-size poster, opened from a thumbnail. Committee members are judging
 * artwork they will print and post around the venue, and a 40px cell in a
 * comparison table is not enough to judge anything by.
 */
export default function PosterPreview({ artist, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${artist.name} poster`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-2.5">
          <p className="truncate font-display text-base font-bold text-ink">{artist.name}</p>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-paper p-3">
          <img
            src={artist.posterUrl}
            alt={`${artist.name} poster`}
            className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  )
}
