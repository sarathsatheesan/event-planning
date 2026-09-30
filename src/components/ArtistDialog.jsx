import { useEffect, useMemo, useRef, useState } from 'react'
import { downscaleImage } from '../lib/images.js'
import {
  MAX_ARTISTS,
  INSTRUMENT_GROUPS,
  normaliseRoster,
  checkBioFile,
  formatBytes,
  BIO_ACCEPT,
} from '../lib/artists.js'

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
const MINI =
  'focus-ring rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink-soft transition disabled:cursor-not-allowed disabled:opacity-40'

export default function ArtistDialog({ artist, eventName, busy, onSave, onClose }) {
  const [name, setName] = useState(artist?.name ?? '')
  const [headcount, setHeadcount] = useState(artist?.headcount ?? '')
  const [honorarium, setHonorarium] = useState(artist?.honorarium ?? '')
  const [requests, setRequests] = useState(artist?.requests ?? '')
  const [roster, setRoster] = useState(() => normaliseRoster(artist?.roster))
  const [posterBlob, setPosterBlob] = useState(null)
  const [preview, setPreview] = useState(artist?.posterUrl ?? null)
  // undefined = leave the saved bio alone. null = remove it. File = replace it.
  const [bioChange, setBioChange] = useState(undefined)
  const [error, setError] = useState(null)
  const objectUrl = useRef(null)
  const fileInput = useRef(null)
  const bioInput = useRef(null)

  const named = useMemo(() => roster.filter((r) => r.name.trim()), [roster])
  const bio = bioChange === undefined ? (artist?.bio ?? null) : bioChange
  const atLimit = roster.length >= MAX_ARTISTS
  // Not an error: a troupe can field twenty dancers and only name its leads.
  // Only the other direction is a contradiction worth pointing out.
  const countMismatch =
    headcount !== '' && Number(headcount) > 0 && named.length > Number(headcount)

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

  function setRow(i, patch) {
    setRoster((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

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

  function handleBio(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const problem = checkBioFile(file)
    if (problem) {
      setError(problem)
      if (bioInput.current) bioInput.current.value = ''
      return
    }
    setError(null)
    setBioChange(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the group a name.')
      return
    }
    // An instrument with nobody attached to it is a half-filled row, not data.
    if (roster.some((r) => !r.name.trim() && r.instruments.length > 0)) {
      setError('Every artist row needs a name, or remove the row.')
      return
    }
    onSave(
      {
        name: trimmed,
        roster: named.map((r) => ({ name: r.name.trim(), instruments: r.instruments })),
        headcount: headcount === '' ? null : Number(headcount),
        honorarium: honorarium === '' ? null : Number(honorarium),
        requests: requests.trim(),
      },
      posterBlob,
      bioChange
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8"
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
                  aria-label="Poster image"
                  className="focus-ring w-full text-xs text-ink-soft file:mr-2 file:rounded-md file:border file:border-border file:bg-surface file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink-soft"
                />
                <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">
                  Large images are shrunk to 1400px before upload, so the grid stays quick on a
                  phone. The preview shows what gets stored.
                </p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- bio document */}
          <div className="flex flex-col gap-1">
            <span className={LABEL}>Bio document</span>
            {bio ? (
              <div className="flex items-center gap-2 rounded-lg border border-border-soft bg-paper px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate text-xs text-ink">
                  {bio.name}
                  <span className="text-ink-soft"> · {formatBytes(bio.size)}</span>
                  {bio instanceof File && <span className="text-accent"> · not uploaded yet</span>}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBioChange(null)
                    if (bioInput.current) bioInput.current.value = ''
                  }}
                  className={MINI}
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                ref={bioInput}
                type="file"
                accept={BIO_ACCEPT}
                onChange={handleBio}
                aria-label="Bio document"
                className="focus-ring w-full text-xs text-ink-soft file:mr-2 file:rounded-md file:border file:border-border file:bg-surface file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-ink-soft"
              />
            )}
            <span className="text-[11px] text-ink-soft">PDF, DOC or DOCX, up to 10 MB.</span>
          </div>

          {/* --------------------------------------------------- artist roster */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className={LABEL}>Artist roster</span>
              <span className="text-[11px] text-ink-soft">
                {roster.length} of {MAX_ARTISTS}
              </span>
            </div>

            {roster.length === 0 && (
              <p className="text-[11px] text-ink-soft">
                Optional. Name whoever you know — the member count below can be higher.
              </p>
            )}

            <ul className="flex flex-col gap-1.5">
              {roster.map((row, i) => (
                <li key={i} className="rounded-lg border border-border-soft bg-paper p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.name}
                      onChange={(e) => setRow(i, { name: e.target.value })}
                      placeholder={`Artist ${i + 1} name`}
                      aria-label={`Artist ${i + 1} name`}
                      className={`${FIELD} bg-surface`}
                    />
                    <button
                      type="button"
                      onClick={() => setRoster((r) => r.filter((_, j) => j !== i))}
                      title="Remove this artist"
                      className="focus-ring shrink-0 rounded-md px-1.5 py-0.5 text-sm text-ink-soft transition hover:bg-critical-soft hover:text-critical"
                    >
                      <span aria-hidden="true">×</span>
                      <span className="sr-only">Remove artist {i + 1}</span>
                    </button>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {row.instruments.map((ins) => (
                      <span
                        key={ins}
                        className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
                      >
                        {ins}
                        <button
                          type="button"
                          onClick={() =>
                            setRow(i, { instruments: row.instruments.filter((x) => x !== ins) })
                          }
                          className="focus-ring rounded-full leading-none"
                        >
                          <span aria-hidden="true">×</span>
                          <span className="sr-only">Remove {ins}</span>
                        </button>
                      </span>
                    ))}
                    <select
                      value=""
                      aria-label={`Add an instrument for artist ${i + 1}`}
                      onChange={(e) => {
                        const value = e.target.value
                        if (!value) return
                        setRow(i, { instruments: [...new Set([...row.instruments, value])] })
                        e.target.value = ''
                      }}
                      className="focus-ring rounded-md border border-border-soft bg-surface px-1.5 py-0.5 text-[11px] text-ink-soft"
                    >
                      <option value="">+ instrument</option>
                      {INSTRUMENT_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.options.map((o) => (
                            <option key={o} value={o} disabled={row.instruments.includes(o)}>
                              {o}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={atLimit}
                onClick={() => setRoster((r) => [...r, { name: '', instruments: [] }])}
                className={MINI}
              >
                + Add artist
              </button>
              {atLimit && (
                <span className="text-[11px] font-medium text-warning">
                  Maximum of {MAX_ARTISTS} artists per group.
                </span>
              )}
            </div>
          </div>

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

          {countMismatch && (
            <p className="text-[11px] font-medium text-warning">
              You have named {named.length} artists but the member count says {headcount}.
            </p>
          )}

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
