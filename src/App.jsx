import { useCallback, useEffect, useRef, useState } from 'react'
import { events as seedEvents, deriveStatus } from './data/events.js'
import { loadOverrides, saveOverrides, applyOverrides } from './data/storage.js'
import { isFirebaseConfigured } from './lib/firebaseConfig.js'
import {
  watchAuth,
  watchOverrides,
  saveOverride,
  deleteOverride,
  canEdit,
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
import { EditableProvider } from './lib/editing.js'

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

  const toastTimer = useRef(null)
  // An undoable toast lingers: three and a half seconds is not long enough to
  // notice a mistake, read the message and decide to take it back.
  const showToast = useCallback((message, undo = null) => {
    setToast({ message, undo })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 9000 : 3600)
  }, [])

  const allowed = canEdit(user)
  // Cloud mode means edits are shared and Firestore is authoritative.
  const cloud = isFirebaseConfigured && allowed
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

  // Live subscription, so two committee members editing at once see each other.
  useEffect(() => {
    if (!cloud) return
    let unsub = () => {}
    watchOverrides(setOverrides, (err) =>
      showToast(`Could not reach the database: ${err.message}`),
    ).then((fn) => {
      unsub = fn
    })
    return () => unsub()
  }, [cloud, showToast])

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

  const events = applyOverrides(seedEvents, visibleOverrides).map((e) => ({
    ...e,
    status: deriveStatus(e.date, e.endDate, now),
  }))
  const selectedEvent = events.find((e) => e.id === selectedId) ?? null
  const selectedSeed = seedEvents.find((e) => e.id === selectedId) ?? null

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
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }
      if (cloud) queueWrite(id, next[id])
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
            currentUserEmail={user?.email ?? null}
          />
        ) : view === 'work' ? (
          <MyWork
            events={events}
            today={now}
            onOpenEvent={setSelectedId}
            view={view}
            onViewChange={setView}
          />
        ) : (
          <Dashboard
            events={events}
            today={now}
            onSelectEvent={setSelectedId}
            view={view}
            onViewChange={setView}
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
    </EditableProvider>
  )
}
