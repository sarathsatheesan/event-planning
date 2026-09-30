import { useEffect, useRef, useState } from 'react'
import { downscaleImage } from '../lib/images.js'

/**
 * Add or edit one candidate artist group.
 *
 * The poster is shrunk the moment it is chosen rather than at save time, so
 * the preview shows exactly what will be stored — nobody discovers after the
 * fact that their 12MP poster became a soft 1400px JPEG.
 */

const FIELD =
  'focus-ring w-full rounded-md border border-border bg-paper px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-soft/60'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-ink-soft'

export default function ArtistDialog({ artist, eventName, busy, onSave, onClose }) {
  const [name, setName] = useState(artist?.name ?? '')
  const [headcount, setHeadcount] = useState(artist?.headcount ?? '')
  const [honorarium, setHonorarium] = useState(artist?.honorarium ?? '')
  const [requests, setRequests] = useState(artist?.requests ?? '')
  // Stored as an array, edited as text. One per line reads best, but people
  // paste comma-separated lists out of email, so accept both.
  const [roster, setRoster] = useState((artist?.roster ?? []).join('\n'))
  // null means "poster unchanged"; a Blob means "replace it with this".
  const [posterBlob, setPosterBlob] = useState(null)
  const [preview, setPreview] = useState(artist?.posterUrl ?? null)
  const [error, setError] = useState(null)
  const objectUrl = useRef(null)
  const fileInput = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  // A blob URL that outlives its dialog is a leak the browser cannot collect.
  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    }
  }, [])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const blob = await downscaleImage(file)
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = URL.createObjectURL(blob)
      setPosterBlob(blob)
      setPreview(objectUrl.current)
    } catch (err) {
      setError(err?.message ?? 'That image could not be used.')
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the group a name.')
      return
    }
    onSave(
      {
        name: trimmed,
        roster: roster
          .split(/[\n,]/)
          .map((n) => n.trim())
          .filter(Boolean),
        headcount: headcount === '' ? null : Number(headcount),
        honorarium: honorarium === '' ? null : Number(honorarium),
        requests: requests.trim(),
      },
      posterBlob
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-8"
      onClick={() => !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={artist ? 'Edit artist group' : 'Add artist group'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">
          {artist ? 'Edit artist group' : 'Add an artist group'}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          A candidate for {eventName}. Nothing is confirmed until someone selects it.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className={LABEL}>Group name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nrityanjali Dance Academy"
              className={FIELD}
              autoFocus
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className={LABEL}>Poster</span>
            <div className="flex items-start gap-3">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-paper">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="px-2 text-center text-[10px] text-ink-soft">No poster yet</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="focus-ring w-full text-xs text-ink-soft file:mr-2 file:rounded-md file:border file:border-border file:bg-surface file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink-soft"
                />
                <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">
                  Large images are shrunk to 1400px before upload, so the grid stays quick on a
                  phone. The preview shows what gets stored.
                </p>
              </div>
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className={LABEL}>Artist roster</span>
            <textarea
              rows={3}
              value={roster}
              onChange={(e) => setRoster(e.target.value)}
              placeholder={'Meera Krishnan\nArjun Rao\nDivya Menon'}
              className={`${FIELD} resize-y`}
            />
            <span className="text-[11px] text-ink-soft">
              One name per line, or comma separated. Name whoever you know — the member count
              below can be higher.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-32 flex-1 flex-col gap-1">
              <span className={LABEL}>Members</span>
              <input
                type="number"
                min="0"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                placeholder="12"
                className={`${FIELD} tabular`}
              />
            </label>
            <label className="flex min-w-32 flex-1 flex-col gap-1">
              <span className={LABEL}>Honorarium ($)</span>
              <input
                type="number"
                min="0"
                value={honorarium}
                onChange={(e) => setHonorarium(e.target.value)}
                placeholder="2500"
                className={`${FIELD} tabular`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className={LABEL}>Special requests</span>
            <textarea
              rows={3}
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="Green room, two handheld mics, vegetarian meals for 12, load-in by 4pm"
              className={`${FIELD} resize-y`}
            />
          </label>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : artist ? 'Save changes' : 'Add group'}
          </button>
        </div>
      </form>
    </div>
  )
}
