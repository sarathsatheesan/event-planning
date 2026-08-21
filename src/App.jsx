import { useState } from 'react'
import { events } from './data/events.js'
import Dashboard from './components/Dashboard.jsx'
import EventDetail from './components/EventDetail.jsx'

// Fixed "now" anchors the demo to the Summer Night Market's live window
// (Aug 21, 2026, evening) so the Day-Of Command Center has something live to show.
const DEMO_NOW = new Date('2026-08-21T17:45:00')

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState(null)

  const selectedEvent = events.find((e) => e.id === selectedId) ?? null

  function handleClone(id) {
    const src = events.find((e) => e.id === id)
    setToast(`"${src.name}" cloned into a new draft for next year's cycle.`)
    window.clearTimeout(handleClone._t)
    handleClone._t = window.setTimeout(() => setToast(null), 3200)
  }

  return (
    <div className="min-h-screen bg-paper">
      {selectedEvent ? (
        <EventDetail event={selectedEvent} today={DEMO_NOW} onBack={() => setSelectedId(null)} />
      ) : (
        <Dashboard today={DEMO_NOW} onSelectEvent={setSelectedId} onCloneEvent={handleClone} />
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
