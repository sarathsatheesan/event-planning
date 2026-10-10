// Narrowing the calendar.
//
// Pure and separate from the controls that drive it: what "matches" means is
// the part that has to be right, and it is the part worth testing without a
// browser. The controls are just four inputs over this.

export const ALL = 'all'

export const EMPTY_FILTERS = { q: '', year: ALL, org: ALL, committee: ALL, status: ALL }

/** Both ends, because a New Year's event can start in one year and end in the next. */
function yearsOf(event) {
  const years = new Set()
  if (event.date) years.add(event.date.slice(0, 4))
  if (event.endDate) years.add(event.endDate.slice(0, 4))
  return years
}

/** Every year the calendar touches, newest first — most work is on what is next. */
export function yearsIn(events) {
  const years = new Set()
  for (const event of events) for (const y of yearsOf(event)) years.add(y)
  return [...years].sort((a, b) => b.localeCompare(a))
}

export function orgsIn(events, known = []) {
  const found = new Set(known)
  for (const event of events) if (event.org) found.add(event.org)
  return [...found].sort()
}

/**
 * Committee answers who runs the event; org answers whose event it is. They do
 * not line up — the kitchen cooks at both ICC and temple events — so this is a
 * second axis beside the org filter, never a third org. Built from the data
 * plus the known list, exactly like orgsIn, so a committee nobody runs yet is
 * never offered.
 */
export function committeesIn(events, known = []) {
  const found = new Set()
  for (const event of events) if (event.committee) found.add(event.committee)
  const order = known.length ? known : [...found]
  return order.filter((id) => found.has(id))
}

export function statusesIn(events) {
  // Fixed order, not alphabetical: this is the life of an event, and a list
  // reading Completed → Live Today → Planning would make nobody faster.
  const order = ['Live Today', '30 Days Out', 'Planning', 'Completed']
  const present = new Set(events.map((e) => e.status))
  return order.filter((s) => present.has(s))
}

export function matches(event, filters) {
  const { q, year, org, committee, status } = { ...EMPTY_FILTERS, ...filters }
  const needle = q.trim().toLowerCase()
  if (needle && !(event.name ?? '').toLowerCase().includes(needle)) return false
  if (year !== ALL && !yearsOf(event).has(year)) return false
  if (org !== ALL && (event.org ?? '') !== org) return false
  if (committee !== ALL && (event.committee ?? '') !== committee) return false
  if (status !== ALL && event.status !== status) return false
  return true
}

export function filterEvents(events, filters) {
  return events.filter((event) => matches(event, filters))
}

/** How many filters are narrowing the list — drives the badge on mobile. */
export function activeCount(filters) {
  const f = { ...EMPTY_FILTERS, ...filters }
  return [f.q.trim() !== '', f.year !== ALL, f.org !== ALL, f.committee !== ALL, f.status !== ALL].filter(
    Boolean
  ).length
}
