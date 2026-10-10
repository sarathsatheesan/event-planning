import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { events as seedEvents, deriveStatus, DEFAULT_COMMITTEE } from './data/events.js'
import { participantsOf } from './data/assignees.js'
import { scopeFor, visibleEvents, EVERYTHING } from './lib/access.js'
import { loadOverrides, saveOverrides, applyOverrides } from './data/storage.js'
import { isFirebaseConfigured } from './lib/firebaseConfig.js'
import {
  watchAuth,
  watchOverrides,
  saveOverride,
  deleteOverride,
  canEdit,
  canManageCommittee,
  watchCommittee,
  saveCommittee,
  requestDigestNow,
  signIn,
  signOutUser,
  isEmailLink,
  sendEmailLink,
  completeEmailLink,
  rememberedEmail,
} from './lib/firebase.js'
import Dashboard from './components/Dashboard.jsx'
import EventDetail from './components/EventDetail.jsx'
import AuthBar from './components/AuthBar.jsx'
import MyWork from './components/MyWork.jsx'
import { statusPatch, ownersPatch } from './lib/work.js'
import NewEventDialog from './components/NewEventDialog.jsx'
import CommitteeDialog from './components/CommitteeDialog.jsx'
import SendDigestDialog from './components/SendDigestDialog.jsx'
import ReminderPreviewDialog from './components/ReminderPreviewDialog.jsx'
import { EMPTY_FILTERS } from './lib/filters.js'
import { buildEvent, newEventId } from './data/blueprint.js'
import { EditableProvider } from './lib/editing.js'
import { CommitteeProvider, toMembers } from './lib/committee.js'

// Inline fields fire on every keystroke. Writing each one straight to Firestore
// would be both slow and expensive, so writes are coalesced per event.
const WRITE_DEBOUNCE_MS = 800

// Stable identity, so swapping to it does not look like a change every render.
const NO_OVERRIDES = Object.freeze({})

export default function App() {
  // Real wall-clock time: with a real calendar loaded, a frozen "today" would
  // mislabel every event's status and countdown.
  const now = new Date()

  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('calendar')
  // { message, undo } — undo is a function when the action can be taken back.
  const [toast, setToast] = useState(null)
  // With Firebase configured, Firestore is the only source of shared truth.
  // Seeding from localStorage would show a signed-out visitor stale edits from
  // whoever last used this browser, dressed up as the current plan.
  const [overrides, setOverrides] = useState(() => (isFirebaseConfigured ? {} : loadOverrides()))
  const [user, setUser] = useState(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [linkSentTo, setLinkSentTo] = useState(null)
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)
  // null = no roster document yet, so the source fallback applies.
  const [roster, setRoster] = useState(null)
  const [managing, setManaging] = useState(false)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  // Held above Dashboard, which unmounts whenever an event is opened. Filters
  // that reset every time you come back from an event are filters nobody uses.
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  // List or board, per tab, held here for the same reason the filters are:
  // EventDetail unmounts every time you go back to the calendar, and a view
  // preference that resets on every event is one nobody sets twice.
  const [tabViews, setTabViews] = useState({
    checklist: 'list',
    runOfShow: 'timeline',
    actions: 'list',
    foodMenu: 'list',
  })
  const [digestBusy, setDigestBusy] = useState(false)

  const toastTimer = useRef(null)
  // An undoable toast lingers: three and a half seconds is not long enough to
  // notice a mistake, read the message and decide to take it back.
  const showToast = useCallback((message, undo = null) => {
    setToast({ message, undo })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 9000 : 3600)
  }, [])

  // A roster fetched for a previous sign-in must not outlive it. Derived
  // rather than cleared in an effect, so there is no frame where the old one
  // still counts.
  const activeRoster = user ? roster : null
  const members = useMemo(() => toMembers(activeRoster), [activeRoster])
  const allowed = canEdit(user, activeRoster)
  const isAdmin = canManageCommittee(user, activeRoster)
  // Cloud mode means edits are shared and Firestore is authoritative.
  const cloud = isFirebaseConfigured && allowed

  /**
   * What this person may see.
   *
   * EVERYTHING outside cloud mode on purpose, and it is not a hole: the local
   * checkout has no Firestore to scope, and a signed-out visitor is already
   * served NO_OVERRIDES below, so all either of them can reach is the seed
   * calendar that ships in the bundle anyway.
   *
   * The raw roster entry, not the trimmed one from toMembers — that one drops
   * the role and the committee map, which is all this needs.
   */
  const myMember = useMemo(() => {
    const mine = String(user?.email ?? '').trim().toLowerCase()
    if (!mine) return null
    return (activeRoster?.members ?? []).find((m) => String(m.email ?? '').toLowerCase() === mine) ?? null
  }, [activeRoster, user])
  const scope = useMemo(
    () => (cloud ? scopeFor({ email: user?.email, member: myMember, isAdmin }) : EVERYTHING),
    [cloud, user, myMember, isAdmin]
  )
  // Objects are new every render, so the subscription keys off the value.
  const scopeKey = JSON.stringify(scope)
  // Editing requires being on the committee list. The one exception is a local
  // checkout with no Firebase config, where there is no sign-in to gate on.
  const editable = !isFirebaseConfigured || allowed
  const pendingWrites = useRef(new Map())

  useEffect(() => {
    if (!isFirebaseConfigured) return
    let unsub = () => {}
    watchAuth(setUser).then((fn) => {
      unsub = fn
    })
    return () => unsub()
  }, [])

  // A sign-in link lands here as an ordinary page load carrying a one-time
  // code. Finish it before the person wonders why nothing happened.
  useEffect(() => {
    if (!isFirebaseConfigured) return
    let cancelled = false
    ;(async () => {
      try {
        if (!(await isEmailLink())) return
        const saved = rememberedEmail()
        if (!saved) {
          // Link opened in a browser that never made the request. Firebase
          // wants the address back before it will honour the code.
          if (!cancelled) setNeedsEmailConfirm(true)
          return
        }
        await completeEmailLink(saved)
      } catch (err) {
        if (cancelled) return
        showToast(err?.message ?? 'That sign-in link did not work.')
        setNeedsEmailConfirm(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showToast])

  // Attempted for anyone signed in, not only people we already think are
  // members: someone just added to the roster could otherwise never find out,
  // because reading the roster requires being on it.
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return
    let unsub = () => {}
    watchCommittee(setRoster).then((fn) => {
      unsub = fn
    })
    return () => unsub()
  }, [user])

  // Live subscription, so two committee members editing at once see each other.
  useEffect(() => {
    if (!cloud) return
    let unsub = () => {}
    watchOverrides(
      setOverrides,
      (err) => showToast(`Could not reach the database: ${err.message}`),
      JSON.parse(scopeKey),
    ).then((fn) => {
      unsub = fn
    })
    return () => unsub()
  }, [cloud, showToast, scopeKey])

  // Only the unconfigured local checkout persists to this browser. A deployed
  // build never does — see the note on the overrides state above.
  useEffect(() => {
    if (!isFirebaseConfigured) saveOverrides(overrides)
  }, [overrides])

  useEffect(() => {
    const timers = pendingWrites.current
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      window.clearTimeout(toastTimer.current)
    }
  }, [])

  function queueWrite(id, data) {
    const timers = pendingWrites.current
    window.clearTimeout(timers.get(id))
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id)
        const write = data === null ? deleteOverride(id) : saveOverride(id, data)
        write.catch((err) => showToast(`Save failed: ${err.message}`))
      }, WRITE_DEBOUNCE_MS),
    )
  }

  // Switching between the calendar and an event swaps the whole page under a
  // scroll position the browser has no reason to change. Open an event from
  // halfway down the calendar and you land halfway down the checklist, which
  // reads as the page jumping to a random milestone.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedId])

  // Seed data stays immutable; owner edits are layered on top so "reset"
  // always has an original to fall back to. Status is computed last, from
  // whatever date is in effect after those edits.
  // Signing out drops the committee's data with it, so the next person at this
  // screen cannot read a plan they are no longer entitled to see. Derived
  // rather than cleared in an effect, so there is no frame where it is visible.
  const visibleOverrides = isFirebaseConfigured && !cloud ? NO_OVERRIDES : overrides

  // Narrowed twice, deliberately. The query above decides which saved records
  // arrive; this decides which events are shown, because the fifteen seeded
  // ones ship in the bundle and would otherwise appear stripped of the edits
  // their record carries — which reads as data loss rather than as access.
  const events = visibleEvents(
    applyOverrides(seedEvents, visibleOverrides).map((e) => ({
      ...e,
      status: deriveStatus(e.date, e.endDate, now),
    })),
    scope
  )
  /**
   * Saved records with no committee written on them.
   *
   * Nothing looks wrong today: applyOverrides fills the field in as it reads,
   * so these events show as Cultural like any other. The gap only bites when
   * something asks the database for "my committees' events" instead of asking
   * for all of them and sorting it out here — a query matches what is stored,
   * and an absent field matches nothing, so these would quietly not come back.
   *
   * Only records that already exist are counted. An event with no saved edits
   * has nothing to lose from such a query, so creating a document for it
   * purely to hold a committee would be inventing work and inventing rows.
   */
  const untaggedIds = useMemo(
    () =>
      Object.keys(visibleOverrides).filter((id) => {
        const rec = visibleOverrides[id]
        return rec && (!rec.committee || !Array.isArray(rec.participants))
      }),
    [visibleOverrides]
  )

  /**
   * Writes the committee each event is already displayed as.
   *
   * Goes through handleEventChange like every other edit rather than touching
   * Firestore directly: saveOverride replaces the whole document, so the only
   * safe way to add one field is to send back the record it was merged into.
   * Nothing visible changes — the point is to make the stored data say what
   * the screen has been saying all along.
   */
  function handleTagUntagged() {
    const ids = untaggedIds
    if (!ids.length) return
    for (const id of ids) {
      const shown = events.find((e) => e.id === id)
      // handleEventChange recomputes participants itself, so passing the
      // committee is enough to bring both fields up to date.
      handleEventChange(id, { committee: shown?.committee ?? DEFAULT_COMMITTEE })
    }
    showToast(`Updated ${ids.length} event record${ids.length === 1 ? '' : 's'}.`)
  }

  const selectedEvent = events.find((e) => e.id === selectedId) ?? null
  const selectedSeed = seedEvents.find((e) => e.id === selectedId) ?? null

  /**
   * A created event is stored exactly like an edit, under an id that is not in
   * the seed list. See applyOverrides for why that is one mechanism and not two.
   */
  function handleCreateEvent({ name, date, sourceId, org, committee }) {
    const source = sourceId ? events.find((e) => e.id === sourceId) : null
    const id = newEventId()
    const built = buildEvent({ name, date, source, org, committee })
    const record = { ...built, participants: participantsOf(built) }
    setOverrides((prev) => {
      if (cloud) queueWrite(id, record)
      return { ...prev, [id]: record }
    })
    setCreating(false)
    setSelectedId(id)
    showToast(source ? `"${record.name}" created from ${source.name}.` : `"${record.name}" created.`)
  }

  /** Only events the committee made can be deleted; seed events would return. */
  function handleDeleteEvent(id) {
    const removed = overrides[id]
    if (!removed) return
    setSelectedId(null)
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      if (cloud) queueWrite(id, null)
      return next
    })
    showToast(`"${removed.name}" deleted.`, () => {
      setOverrides((prev) => {
        if (cloud) queueWrite(id, removed)
        return { ...prev, [id]: removed }
      })
      setSelectedId(id)
    })
  }

  /**
   * Applies a patch to one event. Pass `undoLabel` for anything destructive:
   * the prior value of every field being changed is captured first, and the
   * toast offers to put it back. Firestore has no recycle bin, so this is the
   * only thing standing between a mis-click and losing real work.
   */
  function handleEventChange(id, patch, undoLabel) {
    if (undoLabel) {
      const current = events.find((e) => e.id === id)
      if (current) {
        const before = Object.fromEntries(Object.keys(patch).map((k) => [k, current[k]]))
        showToast(undoLabel, () => handleEventChange(id, before))
      }
    }
    setOverrides((prev) => {
      const merged = { ...(prev[id] ?? {}), ...patch }
      // Recomputed from the event as it will read, not from the patch: most
      // overrides are partial, so the checklist deciding who is on this event
      // usually lives in the seed rather than in the record being written.
      const shown = events.find((e) => e.id === id)
      const record = { ...merged, participants: participantsOf({ ...shown, ...merged }) }
      const next = { ...prev, [id]: record }
      if (cloud) queueWrite(id, record)
      return next
    })
  }

  // Resets the date only. Checklist edits are real work and must survive it.
  function handleEventReset(id) {
    setOverrides((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      const { date: _date, ...rest } = next[id]
      if (Object.keys(rest).length === 0) delete next[id]
      else next[id] = rest
      if (cloud) queueWrite(id, next[id] ?? null)
      return next
    })
    showToast('Reverted to the original date.')
  }

  async function handleAuth(action) {
    setAuthBusy(true)
    try {
      await action()
    } catch (err) {
      showToast(err?.message ?? 'Sign-in failed.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSaveCommittee(next) {
    setAuthBusy(true)
    try {
      await saveCommittee(next)
      setManaging(false)
      showToast('Committee updated.')
    } catch (err) {
      showToast(err?.message ?? 'Could not save the committee.')
    } finally {
      setAuthBusy(false)
    }
  }

  /**
   * Advance a status from My Work, writing back to whichever record the row
   * came from. Same cycle and same save path as tapping it inside the event —
   * this view is where somebody filtered to their own name works through their
   * list, and sending them into each event to tick one thing off was the
   * wrong shape for it.
   */
  function handleWorkStatusChange(row) {
    const event = events.find((e) => e.id === row.eventId)
    const patch = statusPatch(event, row)
    if (patch) handleEventChange(event.id, patch)
  }

  /**
   * Owners set from My work rather than from inside the event.
   *
   * The same edit from a different door, and the reason the door exists:
   * assigning somebody is what puts them on the Monday email and — through
   * the participants recomputed on every save — what lets them open the event
   * they have just been given work on. Doing that fifteen events at a time was
   * the slow part.
   */
  function handleWorkOwnersChange(row, people) {
    const event = events.find((e) => e.id === row.eventId)
    const patch = ownersPatch(event, row, people)
    if (patch) handleEventChange(event.id, patch)
  }

  async function handleSendDigest(scope, to) {
    setDigestBusy(true)
    try {
      const result = await requestDigestNow(scope, to)
      setSendingDigest(false)
      if (result?.sent) {
        showToast(`Sent to ${result.recipients} committee members — "${result.subject}"`)
      } else if (result?.reason === 'nothing-to-report') {
        showToast('Nothing overdue, due soon or coming up. No email sent.')
      } else if (result?.reason === 'no-roster') {
        showToast('No committee roster saved yet, so there was nobody to email.')
      }
    } catch (err) {
      showToast(err?.message ?? 'Could not send the digest.')
    } finally {
      setDigestBusy(false)
    }
  }

  async function handleSendLink(email) {
    setAuthBusy(true)
    try {
      await sendEmailLink(email)
      setLinkSentTo(email)
      showToast(`Sign-in link sent to ${email}.`)
    } catch (err) {
      showToast(err?.message ?? 'Could not send that sign-in link.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleConfirmEmail(email) {
    setAuthBusy(true)
    try {
      await completeEmailLink(email)
      setNeedsEmailConfirm(false)
    } catch (err) {
      showToast(err?.message ?? 'That address did not match the link.')
    } finally {
      setAuthBusy(false)
    }
  }

  return (
    <EditableProvider value={editable}>
      <CommitteeProvider value={members}>
      <div className="min-h-screen bg-paper">
        <AuthBar
          user={user}
          allowed={allowed}
          busy={authBusy}
          onSignIn={() => handleAuth(signIn)}
          onSignOut={() => handleAuth(signOutUser)}
          onSendLink={handleSendLink}
          onConfirmEmail={handleConfirmEmail}
          linkSentTo={linkSentTo}
          needsEmailConfirm={needsEmailConfirm}
          onManageCommittee={isAdmin ? () => setManaging(true) : null}
        />

        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            originalDate={selectedSeed?.date ?? selectedEvent.date}
            today={now}
            onBack={() => setSelectedId(null)}
            onChange={(patch, undoLabel) =>
              handleEventChange(selectedEvent.id, patch, undoLabel)
            }
            onReset={() => handleEventReset(selectedEvent.id)}
            onDelete={selectedEvent.isCustom ? () => handleDeleteEvent(selectedEvent.id) : null}
            currentUserEmail={user?.email ?? null}
            tabViews={tabViews}
            onTabViewChange={(key, view) => setTabViews((prev) => ({ ...prev, [key]: view }))}
          />
        ) : view === 'work' ? (
          <MyWork
            events={events}
            today={now}
            onOpenEvent={setSelectedId}
            view={view}
            onViewChange={setView}
            onEmailCommittee={isAdmin ? () => setSendingDigest(true) : null}
            onPreviewReminders={isAdmin ? () => setPreviewing(true) : null}
            onTagUntagged={isAdmin && untaggedIds.length ? handleTagUntagged : null}
            untaggedCount={untaggedIds.length}
            onStatusChange={handleWorkStatusChange}
            onOwnersChange={handleWorkOwnersChange}
          />
        ) : (
          <Dashboard
            events={events}
            today={now}
            onSelectEvent={setSelectedId}
            view={view}
            onViewChange={setView}
            onNewEvent={() => setCreating(true)}
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {previewing && <ReminderPreviewDialog onClose={() => setPreviewing(false)} />}

        {sendingDigest && (
          <SendDigestDialog
            members={members}
            busy={digestBusy}
            onSend={handleSendDigest}
            onClose={() => setSendingDigest(false)}
          />
        )}

        {managing && (
          <CommitteeDialog
            roster={activeRoster}
            currentEmail={user?.email ?? null}
            busy={authBusy}
            onSave={handleSaveCommittee}
            onClose={() => setManaging(false)}
          />
        )}

        {creating && (
          <NewEventDialog
            events={events}
            onCreate={handleCreateEvent}
            onClose={() => setCreating(false)}
          />
        )}

        {toast && (
          <div className="fixed inset-x-0 bottom-5 flex justify-center px-4">
            <div className="flex items-center gap-3 rounded-full border border-border bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg">
              <span>{toast.message}</span>
              {toast.undo && (
                <button
                  type="button"
                  onClick={() => {
                    const undo = toast.undo
                    setToast(null)
                    undo()
                  }}
                  className="focus-ring -mr-1 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-paper/90 underline underline-offset-2 transition hover:text-paper"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </CommitteeProvider>
    </EditableProvider>
  )
}
