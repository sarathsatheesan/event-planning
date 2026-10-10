/**
 * When a multi-day event moves.
 *
 * An event that runs Saturday to Sunday has two dates, and for a long time
 * only the first could be edited. Moving the start left the end where it was —
 * so a tournament pushed a month out still claimed to finish on the original
 * Sunday, which is both wrong on the card and wrong in `deriveStatus`, where
 * the finish line is `endDate ?? date`: an event starting next month and
 * ending last month reads as Completed.
 *
 * The rule here is that moving the start moves the whole booking. A venue
 * rescheduling a two-day tournament gives you a different weekend, not a
 * thirty-day tournament. Changing the length is a separate act — edit the end.
 */

const DAY = 86400000
const pad = (n) => String(n).padStart(2, '0')

/** Local date parts, not toISOString — an evening in Utah is not tomorrow. */
function stamp(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return stamp(d)
}

export function daysBetween(fromStr, toStr) {
  return Math.round((new Date(toStr + 'T00:00:00') - new Date(fromStr + 'T00:00:00')) / DAY)
}

/**
 * Move the start, carrying the end with it.
 *
 * Returns a patch, never the whole event: `saveOverride` replaces the document
 * and the caller merges, so the smaller the patch the fewer the ways to lose a
 * field. An event with no end date gets a patch with no end date in it.
 */
export function moveStart(event, nextDate) {
  if (!nextDate) return null
  const from = event?.date
  if (!from || nextDate === from) return null
  const end = event?.endDate
  if (!end) return { date: nextDate }
  // A span that was already backwards is not worth preserving.
  const span = Math.max(0, daysBetween(from, end))
  return { date: nextDate, endDate: span > 0 ? addDays(nextDate, span) : null }
}

/**
 * Set or clear the end date.
 *
 * An end on or before the start is not a shorter event, it is a single-day
 * one, so it clears the field rather than storing a backwards range. That also
 * gives a way to undo a multi-day event without a separate remove control:
 * pull the end back to the start day and the chip offers to add one again.
 */
export function moveEnd(event, nextEnd) {
  const from = event?.date
  if (!from) return null
  if (!nextEnd) return { endDate: null }
  if (daysBetween(from, nextEnd) <= 0) return { endDate: null }
  if (nextEnd === event?.endDate) return null
  return { endDate: nextEnd }
}

/** What an "add an end date" control should offer: the day after the start. */
export function suggestedEnd(event) {
  return event?.date ? addDays(event.date, 1) : null
}
