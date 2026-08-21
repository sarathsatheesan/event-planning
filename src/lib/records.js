/** Next free integer id for a list of records. Kept out of the component file
 *  so React Fast Refresh keeps working there. */
export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1
}

/** "18:30" -> "6:30 PM". Returns null for an unset time. */
export function formatTime(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Minutes since midnight, for comparing schedule times. */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** "-30m", "+2h 15m", or "start" — a schedule item relative to the event start. */
export function offsetFromStart(itemTime, startTime) {
  if (!startTime) return null
  const delta = toMinutes(itemTime) - toMinutes(startTime)
  if (delta === 0) return 'start'
  const abs = Math.abs(delta)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const parts = [h ? `${h}h` : null, m ? `${m}m` : null].filter(Boolean).join(' ')
  return `${delta < 0 ? '\u2212' : '+'}${parts}`
}
