import { useEffect, useState } from 'react'
import { events as seedEvents, deriveStatus } from './data/events.js'
import { loadOverrides, saveOverrides, applyOverrides } from './data/storage.js'
import Dashboard from './components/Dashboard.jsx'
import EventDetail from './components/EventDetail.jsx'

export default function App() {
  // Real wall-clock time: with a real calendar loaded, a frozen "today" would
  // mislabel every event's status and countdown.
  const now = new Date()

  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState(null)
  const [overrides, setOverrides] = useState(loadOverrides)

  useEffect(() => {
    saveOverrides(overrides)
  }, [overrides])

  // Seed data stays immutable; owner edits are layered on top so "reset"
  // always has an original to fall back to. Status is computed last, from
  // whatever date is in effect after those edits.
  const events = applyOverrides(seedEvents, overrides).map((e) => ({
    ...e,
    status: deriveStatus(e.date, e.endDate, now),
  }))
  const selectedEvent = events.find((e) => e.id === selectedId) ?? null
  const selectedSeed = seedEvents.find((e) => e.id === selectedId) ?? null

  function showToast(message) {
    setToast(message)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3200)
  }

  function handleClone(id) {
    const src = events.find((e) => e.id === id)
    showToast(`"${src.name}" cloned into a new draft for next year's cycle.`)
  }

  function handleEventChange(id, patch) {
    setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }))
  }

  // Resets the date only. Checklist edits are real work and must survive it.
  function handleEventReset(id) {
    setOverrides((prev) => {
      const next = { ...prev }
      if (!next[id]) return prev
      const { date: _date, ...rest } = next[id]
      if (Object.keys(rest).length === 0) delete next[id]
      else next[id] = rest
      return next
    })
    showToast('Reverted to the original date.')
  }

  return (
    <div className="min-h-screen bg-paper">
      {selectedEvent ? (
        <EventDetail
          event={selectedEvent}
          originalDate={selectedSeed?.date ?? selectedEvent.date}
          today={now}
          onBack={() => setSelectedId(null)}
          onChange={(patch) => handleEventChange(selectedEvent.id, patch)}
          onReset={() => handleEventReset(selectedEvent.id)}
        />
      ) : (
        <Dashboard
          events={events}
          today={now}
          onSelectEvent={setSelectedId}
          onCloneEvent={handleClone}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-5 flex justify-center px-4">
          <div className="rounded-full border border-border bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
