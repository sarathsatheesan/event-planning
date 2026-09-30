import { useState } from 'react'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'
import { uploadArtistPoster, deleteArtistPoster } from '../../lib/firebase.js'
import ArtistDialog from '../ArtistDialog.jsx'
import ConfirmArtistDialog from '../ConfirmArtistDialog.jsx'

/**
 * Candidate artist groups for one event, and the record of which was chosen.
 *
 * Most of the ICC calendar needs performers; a blood drive does not. The
 * whole tab is behind a per-event switch so the pages that do not need it
 * never carry it.
 */

function money(n) {
  return n == null ? '—' : `$${n.toLocaleString('en-US')}`
}

function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  // Local parts, not toISOString: a decision made at 6pm Mountain must not
  // record as the following day.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function longDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ArtistSelection({ event, onChange, currentUserEmail }) {
  const editable = useEditable()
  const artists = event.artists ?? []
  const choice = event.artistChoice ?? null
  const selected = choice ? artists.find((a) => a.id === choice.artistId) : null

  const [dialog, setDialog] = useState(null) // { artist } | { artist: null }
  const [confirming, setConfirming] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave(fields, posterBlob) {
    setBusy(true)
    setError(null)
    try {
      const existing = dialog?.artist ?? null
      let poster = { posterPath: existing?.posterPath ?? null, posterUrl: existing?.posterUrl ?? null }
      if (posterBlob) {
        const uploaded = await uploadArtistPoster(event.id, posterBlob)
        poster = { posterPath: uploaded.path, posterUrl: uploaded.url }
        // Replacing a poster: drop the old file rather than leave it paid for.
        if (existing?.posterPath) deleteArtistPoster(existing.posterPath)
      }
      const record = { ...(existing ?? {}), ...fields, ...poster }
      const next = existing
        ? artists.map((a) => (a.id === existing.id ? record : a))
        : [...artists, { ...record, id: nextId(artists) }]
      onChange({ artists: next })
      setDialog(null)
    } catch (err) {
      setError(err?.message ?? 'Could not save that group.')
    } finally {
      setBusy(false)
    }
  }

  function handleRemove(artist) {
    if (artist.posterPath) deleteArtistPoster(artist.posterPath)
    const patch = { artists: artists.filter((a) => a.id !== artist.id) }
    // Removing the chosen group must not leave a selection pointing at nothing.
    if (choice?.artistId === artist.id) patch.artistChoice = null
    onChange(patch)
  }

  function handleConfirm(rationale) {
    onChange({
      artistChoice: {
        artistId: confirming.id,
        rationale,
        decidedOn: today(),
        decidedBy: currentUserEmail ?? null,
      },
    })
    setConfirming(null)
  }

  if (!event.needsArtists) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-semibold text-ink">No artist booking for this event</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
          Turn this on for events with performers, and you get a place to collect candidate groups,
          their fees and their requirements before anyone commits.
        </p>
        {editable && (
          <button
            type="button"
            onClick={() => onChange({ needsArtists: true })}
            className="focus-ring mt-4 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition"
          >
            Plan artists for this event
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          {artists.length === 0
            ? 'No candidate groups yet.'
            : `${artists.length} candidate group${artists.length === 1 ? '' : 's'}${
                selected ? ' · one selected' : ' · none selected yet'
              }`}
        </p>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDialog({ artist: null })}
              className="focus-ring rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink transition"
            >
              Add artist group
            </button>
            {artists.length === 0 && (
              <button
                type="button"
                onClick={() => onChange({ needsArtists: false })}
                className="focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
              >
                This event has no artists
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="mb-3 text-xs font-medium text-critical">{error}</p>}

      {selected && (
        <div className="mb-5 rounded-xl border border-success/40 bg-success-soft px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-success">
            Selected artist
          </p>
          <p className="mt-0.5 font-display text-lg font-bold text-ink">{selected.name}</p>
          <p className="mt-1 text-sm text-ink">{choice.rationale}</p>
          <p className="mt-1.5 text-[11px] text-ink-soft">
            Decided {longDate(choice.decidedOn) ?? 'earlier'}
            {choice.decidedBy ? ` by ${choice.decidedBy}` : ''}
          </p>
          {editable && (
            <button
              type="button"
              onClick={() => onChange({ artistChoice: null })}
              className="focus-ring mt-2 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-critical hover:text-critical"
            >
              Undo selection
            </button>
          )}
        </div>
      )}

      {artists.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
          Add the groups you are considering. Compare them side by side, then confirm one.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a) => {
            const isChosen = choice?.artistId === a.id
            return (
              <li
                key={a.id}
                className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition ${
                  isChosen ? 'border-success shadow-sm' : 'border-border'
                }`}
              >
                <div className="relative h-36 w-full bg-paper">
                  {a.posterUrl ? (
                    <img
                      src={a.posterUrl}
                      alt={`${a.name} poster`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink-soft">
                      No poster
                    </div>
                  )}
                  {isChosen && (
                    <span className="absolute left-2 top-2 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper shadow">
                      Selected
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="font-display text-base font-bold leading-snug text-ink">{a.name}</h3>

                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <div>
                      <dt className="text-ink-soft">Performers</dt>
                      <dd className="tabular font-semibold text-ink">{a.headcount ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Honorarium</dt>
                      <dd className="tabular font-semibold text-ink">{money(a.honorarium)}</dd>
                    </div>
                  </dl>

                  {a.requests && (
                    <p className="text-xs leading-snug text-ink-soft">
                      <span className="font-semibold text-ink">Requests: </span>
                      {a.requests}
                    </p>
                  )}

                  {isChosen && choice.rationale && (
                    <p className="rounded-md bg-success-soft px-2 py-1.5 text-xs leading-snug text-ink">
                      <span className="font-semibold">Why: </span>
                      {choice.rationale}
                    </p>
                  )}

                  {editable && (
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                      {!isChosen && (
                        <button
                          type="button"
                          onClick={() => setConfirming(a)}
                          className="focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-success hover:text-success"
                        >
                          Select
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDialog({ artist: a })}
                        className="focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(a)}
                        className="focus-ring rounded-md px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-critical-soft hover:text-critical"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {dialog && (
        <ArtistDialog
          artist={dialog.artist}
          eventName={event.name}
          busy={busy}
          onSave={handleSave}
          onClose={() => setDialog(null)}
        />
      )}

      {confirming && (
        <ConfirmArtistDialog
          artist={confirming}
          replacing={selected && selected.id !== confirming.id ? selected : null}
          onConfirm={handleConfirm}
          onClose={() => setConfirming(null)}
        />
      )}
    </div>
  )
}
