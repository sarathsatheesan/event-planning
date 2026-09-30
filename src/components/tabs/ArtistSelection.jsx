import { useMemo, useState } from 'react'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'
import { uploadArtistPoster, uploadArtistBio, deleteArtistFile } from '../../lib/firebase.js'
import { rosterSummary, bioContentType, formatBytes } from '../../lib/artists.js'
import ArtistDialog from '../ArtistDialog.jsx'
import ConfirmArtistDialog from '../ConfirmArtistDialog.jsx'
import PosterPreview from '../PosterPreview.jsx'

/**
 * Candidate artist groups for one event, and the record of which was chosen.
 *
 * Two views of the same list. The table is for deciding — every group's fee
 * and size on one screen, sortable. The cards are for browsing the artwork.
 * Committee members want both at different moments, so the choice is theirs
 * and it is remembered.
 */

const VIEW_KEY = 'eventops.artistView'

// Stable identity for the empty case. A fresh [] every render would defeat the
// sort memo below, which is the one thing here worth memoising.
const NO_ARTISTS = Object.freeze([])

function readView() {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table'
  } catch {
    return 'table'
  }
}

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

const BTN =
  'focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition'

/** Opens the group's bio in a new tab. Word files download rather than render,
 *  which is the browser's call, not ours. */
function BioLink({ bio, className = '' }) {
  return (
    <a
      href={bio.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`focus-ring inline-flex max-w-full items-center gap-1 text-xs font-medium text-accent hover:underline ${className}`}
    >
      <span aria-hidden="true">📄</span>
      <span className="truncate">{bio.name}</span>
      <span className="shrink-0 text-ink-soft">({formatBytes(bio.size)})</span>
    </a>
  )
}

/** A column header that sorts. Arrow shows direction only when it is active. */
function SortHeader({ label, column, sort, onSort, className = '' }) {
  const active = sort.key === column
  return (
    <th scope="col" className={`px-3 py-2 text-left font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`focus-ring inline-flex items-center gap-1 rounded transition hover:text-accent ${
          active ? 'text-accent' : ''
        }`}
      >
        {label}
        <span aria-hidden="true" className={active ? '' : 'opacity-25'}>
          {active && sort.dir === 'desc' ? '▼' : '▲'}
        </span>
      </button>
    </th>
  )
}

export default function ArtistSelection({ event, onChange, currentUserEmail }) {
  const editable = useEditable()
  const artists = event.artists ?? NO_ARTISTS
  const choice = event.artistChoice ?? null
  const selected = choice ? artists.find((a) => a.id === choice.artistId) : null

  const [view, setView] = useState(readView)
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [dialog, setDialog] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [poster, setPoster] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function chooseView(next) {
    setView(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Private browsing. The preference just will not persist.
    }
  }

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const ordered = useMemo(() => {
    if (!sort.key) return artists
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...artists].sort((a, b) => {
      if (sort.key === 'name') return dir * (a.name ?? '').localeCompare(b.name ?? '')
      const av = a[sort.key]
      const bv = b[sort.key]
      // Blanks sort last whichever way the column is pointing. A group whose
      // fee nobody has asked for yet is not the cheapest option.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return dir * (av - bv)
    })
  }, [artists, sort])

  async function handleSave(fields, posterBlob, bioChange) {
    setBusy(true)
    setError(null)
    try {
      const existing = dialog?.artist ?? null
      let art = { posterPath: existing?.posterPath ?? null, posterUrl: existing?.posterUrl ?? null }
      if (posterBlob) {
        const uploaded = await uploadArtistPoster(event.id, posterBlob)
        art = { posterPath: uploaded.path, posterUrl: uploaded.url }
        // Replacing a poster: drop the old file rather than leave it paid for.
        if (existing?.posterPath) deleteArtistFile(existing.posterPath)
      }
      // undefined means the dialog never touched the bio.
      let bioPatch = {}
      if (bioChange !== undefined) {
        // Upload first: a failure here must not leave the record pointing at a
        // file that has already been deleted.
        const uploaded = bioChange
          ? await uploadArtistBio(event.id, bioChange, bioContentType(bioChange))
          : null
        if (existing?.bio?.path) deleteArtistFile(existing.bio.path)
        bioPatch = { bio: uploaded }
      }
      const record = { ...(existing ?? {}), ...fields, ...art, ...bioPatch }
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
    if (artist.posterPath) deleteArtistFile(artist.posterPath)
    if (artist.bio?.path) deleteArtistFile(artist.bio.path)
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

  const actions = (a, isChosen) =>
    editable && (
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {!isChosen && (
          <button
            type="button"
            onClick={() => setConfirming(a)}
            className={`${BTN} hover:border-success hover:text-success`}
          >
            Select
          </button>
        )}
        <button
          type="button"
          onClick={() => setDialog({ artist: a })}
          className={`${BTN} hover:border-accent hover:text-accent`}
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
    )

  const thumb = (a, size) =>
    a.posterUrl ? (
      <button
        type="button"
        onClick={() => setPoster(a)}
        title="View the poster"
        className={`focus-ring block overflow-hidden rounded ${size}`}
      >
        <img src={a.posterUrl} alt={`${a.name} poster`} loading="lazy" className="h-full w-full object-cover" />
      </button>
    ) : (
      <div className={`flex items-center justify-center rounded bg-paper text-[10px] text-ink-soft ${size}`}>
        None
      </div>
    )

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
        <div className="flex flex-wrap items-center gap-2">
          {artists.length > 0 && (
            <div className="flex overflow-hidden rounded-md border border-border">
              {['table', 'cards'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => chooseView(v)}
                  className={`focus-ring px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    view === v ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
          {editable && (
            <>
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
                  className={`${BTN} hover:border-accent hover:text-accent`}
                >
                  This event has no artists
                </button>
              )}
            </>
          )}
        </div>
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
              className={`${BTN} mt-2 hover:border-critical hover:text-critical`}
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
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[54rem] border-collapse text-sm">
            <thead className="bg-surface-raised text-xs text-ink-soft">
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Poster
                </th>
                <SortHeader label="Group name" column="name" sort={sort} onSort={toggleSort} />
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Artist roster
                </th>
                <SortHeader
                  label="Members"
                  column="headcount"
                  sort={sort}
                  onSort={toggleSort}
                  className="whitespace-nowrap"
                />
                <SortHeader
                  label="Honorarium"
                  column="honorarium"
                  sort={sort}
                  onSort={toggleSort}
                  className="whitespace-nowrap"
                />
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Special requests
                </th>
                {editable && <th scope="col" className="w-px px-3 py-2 text-left font-semibold" />}
              </tr>
            </thead>
            <tbody>
              {ordered.map((a) => {
                const isChosen = choice?.artistId === a.id
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-border-soft align-top last:border-b-0 ${
                      isChosen ? 'bg-success-soft' : 'bg-surface'
                    }`}
                  >
                    <td className="px-3 py-2">{thumb(a, 'h-12 w-10')}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-ink">{a.name}</span>
                      {isChosen && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-paper">
                          Selected
                        </span>
                      )}
                      {isChosen && choice.rationale && (
                        <span className="mt-1 block text-xs leading-snug text-ink-soft">
                          {choice.rationale}
                        </span>
                      )}
                      {a.bio?.url && <BioLink bio={a.bio} className="mt-1" />}
                    </td>
                    <td className="px-3 py-2 text-xs leading-snug text-ink-soft">
                      {rosterSummary(a.roster) || '—'}
                    </td>
                    <td className="tabular px-3 py-2 text-ink">{a.headcount ?? '—'}</td>
                    <td className="tabular px-3 py-2 text-ink">{money(a.honorarium)}</td>
                    <td className="max-w-xs px-3 py-2 text-xs leading-snug text-ink-soft">
                      {a.requests || '—'}
                    </td>
                    {editable && <td className="w-px px-3 py-2">{actions(a, isChosen)}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((a) => {
            const isChosen = choice?.artistId === a.id
            return (
              <li
                key={a.id}
                className={`flex flex-col overflow-hidden rounded-xl border bg-surface transition ${
                  isChosen ? 'border-success shadow-sm' : 'border-border'
                }`}
              >
                <div className="relative h-36 w-full bg-paper">
                  {thumb(a, 'h-full w-full')}
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
                      <dt className="text-ink-soft">Members</dt>
                      <dd className="tabular font-semibold text-ink">{a.headcount ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Honorarium</dt>
                      <dd className="tabular font-semibold text-ink">{money(a.honorarium)}</dd>
                    </div>
                  </dl>

                  {rosterSummary(a.roster) && (
                    <p className="text-xs leading-snug text-ink-soft">
                      <span className="font-semibold text-ink">Roster: </span>
                      {rosterSummary(a.roster)}
                    </p>
                  )}

                  {a.bio?.url && <BioLink bio={a.bio} />}

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

                  <div className="mt-auto pt-1">{actions(a, isChosen)}</div>
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

      {poster && <PosterPreview artist={poster} onClose={() => setPoster(null)} />}
    </div>
  )
}
