// Per-owner edits (currently just event dates) layered on top of the seed data
// in events.js. There is no backend yet, so these live in the browser.
//
// Scope caveat, deliberately: localStorage is per-browser and per-device. An
// edit made here is NOT shared with teammates and does not travel to another
// machine. When a real data layer lands, this module is the seam to replace.

const KEY = 'eventops.overrides.v1'

// Every access is guarded: Safari private mode throws on localStorage, and a
// corrupted value should degrade to "no edits" rather than a blank app.
export function loadOverrides() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveOverrides(overrides) {
  try {
    localStorage.setItem(KEY, JSON.stringify(overrides))
  } catch {
    // Storage unavailable or full — edits still work for this session.
  }
}

/** Seed events with any saved owner edits applied on top. */
export function applyOverrides(events, overrides) {
  return events.map((event) =>
    overrides[event.id] ? { ...event, ...overrides[event.id] } : event
  )
}
