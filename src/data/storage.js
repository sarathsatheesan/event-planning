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

/**
 * Seed events with saved edits applied on top, plus any events the committee
 * created themselves.
 *
 * A created event is stored in the same place as an edit — an entry whose id
 * is not in the seed list, holding a whole event rather than a patch. That
 * keeps one collection, one sync path and one set of security rules instead of
 * a parallel world for user-made events.
 *
 * The name-and-date test matters: a half-written entry, or a leftover for a
 * seed event that no longer exists, must not materialise as a ghost event on
 * the calendar.
 */
export function applyOverrides(events, overrides) {
  const edited = events.map((event) =>
    overrides[event.id] ? { ...event, ...overrides[event.id] } : event
  )

  const seedIds = new Set(events.map((e) => e.id))
  const created = Object.entries(overrides)
    .filter(([id, value]) => !seedIds.has(id) && value?.name && value?.date)
    .map(([id, value]) => ({ ...value, id, isCustom: true }))

  return [...edited, ...created]
}
