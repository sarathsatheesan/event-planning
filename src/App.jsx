import { useEffect, useState } from 'react'
import { events as seedEvents } from './data/events.js'
import { loadOverrides, saveOverrides, applyOverrides } from './data/storage.js'
import Dashboard from './components/Dashboard.jsx'
import EventDetail from './components/EventDetail.jsx'

// Fixed "now" anchors the demo to the Summer Night Market's live window
// (Aug 21, 2026, evening) so the Day-Of Command Center has something live to show.
const DEMO_NOW = new Date('2026-08-21T17:45:00')

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState(null)
  const [overrides, setOverrides] = useState(loadOverrides)

  useEffect(() => {
    saveOverrides(overrides)
  }, [overrides])

  // Seed data stays immutable; owner edits are layered on top so "reset"
  // always has an original to fall back to.
  const events = applyOverrides(seedEvents, overrides)
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

  function handleEventReset(id) {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
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
          today={DEMO_NOW}
          onBack={() => setSelectedId(null)}
          onChange={(patch) => handleEventChange(selectedEvent.id, patch)}
          onReset={() => handleEventReset(selectedEvent.id)}
        />
      ) : (
        <Dashboard
          events={events}
          today={DEMO_NOW}
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
