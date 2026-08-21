// The reusable cultural-event blueprint.
//
// Nearly every ICC event runs the same shape: book a venue, secure artists,
// arrange production, publicise it, feed people, and run it with volunteers.
// This is that shape as a checklist, applied to each event with due dates
// computed backwards from that event's own date.
//
// It is a starting point, not a rule. Every line is editable in the app, and
// events with genuinely different needs (a tournament, a general body meeting)
// are expected to prune it.

export const TEMPLATE_CATEGORIES = [
  'Venue',
  'Artists',
  'Production',
  'Marketing',
  'Registration',
  'Hospitality',
  'Volunteers',
  'Finance',
]

// [anchor, days before the event, task, category]
const TEMPLATE = [
  ['T-90', 90, 'Confirm the event date and reserve the venue', 'Venue'],
  ['T-90', 90, 'Agree the budget and get committee approval', 'Finance'],
  ['T-90', 90, 'Shortlist and approach lead artists or performers', 'Artists'],
  ['T-90', 90, 'Check what permits, licences or insurance the venue requires', 'Venue'],

  ['T-60', 60, 'Sign artist agreements and confirm fees', 'Artists'],
  ['T-60', 60, 'Book travel and accommodation for out-of-town artists', 'Artists'],
  ['T-60', 60, 'Book sound, lighting and stage production', 'Production'],
  ['T-60', 60, 'Open registration or ticketing and set pricing', 'Registration'],
  ['T-60', 60, 'Confirm sponsors and collect logos for signage', 'Finance'],

  ['T-30', 30, 'Launch publicity — WhatsApp, email, social and community flyers', 'Marketing'],
  ['T-30', 30, 'Draft the programme order and MC script', 'Production'],
  ['T-30', 30, 'Confirm catering and refreshment headcount', 'Hospitality'],
  ['T-30', 30, 'Recruit volunteers and assign roles', 'Volunteers'],
  ['T-30', 30, 'Order trophies, certificates or mementos', 'Registration'],

  ['T-7', 7, 'Share the final run of show with artists and volunteers', 'Production'],
  ['T-7', 7, 'Confirm stage layout, seating plan and green room', 'Venue'],
  ['T-7', 7, 'Print badges, signage and registration lists', 'Registration'],
  ['T-7', 7, 'Book the sound check and rehearsal slot', 'Production'],
  ['T-7', 7, 'Brief volunteers on roles and arrival times', 'Volunteers'],

  ['T-1', 1, 'Full technical rehearsal and sound check', 'Production'],
  ['T-1', 1, 'Set up registration desk, signage and decorations', 'Venue'],
  ['T-1', 1, 'Confirm artist arrival times and airport or hotel pickups', 'Artists'],
  ['T-1', 1, 'Charge and test mics, cameras and recording equipment', 'Production'],
]

const pad = (n) => String(n).padStart(2, '0')

/** eventDate minus `days`, as YYYY-MM-DD. Built from local date parts rather
 *  than toISOString(), which would shift the day for anyone west of UTC. */
export function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The blueprint as a fresh checklist for one event, dated off that event. */
export function buildTemplateChecklist(eventDate) {
  return TEMPLATE.map(([anchor, days, task, category], i) => ({
    id: i + 1,
    task,
    category,
    anchor,
    assignee: '',
    due: shiftDate(eventDate, days),
    status: 'Not Started',
  }))
}

/** Re-space existing tasks against a (possibly new) event date, keeping every
 *  edit the owner has made. Used when an event moves. */
export function realignDueDates(checklist, eventDate) {
  const daysFor = Object.fromEntries(TEMPLATE.map(([anchor, days]) => [anchor, days]))
  return checklist.map((t) =>
    daysFor[t.anchor] == null ? t : { ...t, due: shiftDate(eventDate, daysFor[t.anchor]) }
  )
}
