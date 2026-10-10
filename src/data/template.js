// The reusable event blueprints.
//
// Two shapes, because the temple runs two kinds of event and they have almost
// nothing in common beyond having a date.
//
// The cultural shape (`icc`): book a venue, secure artists, arrange
// production, publicise it, feed people, and run it with volunteers.
//
// The religious shape (`temple`): fix the muhurtham, book the priests, decide
// the ritual order, buy the samagri, cook the prasadam, and run the darshan
// queue. No artists, no ticketing, a shorter runway — a puja is planned in
// two months, not three.
//
// Both are starting points, not rules. Every line is editable in the app, and
// events with genuinely different needs (a tournament, a general body meeting)
// are expected to prune them.

/**
 * Lead-time phases. T-21/T-14/T-3/T-2 were added when the India Mela sheet
 * arrived with real lead times that the coarse T-90/60/30/7/1 set could not
 * hold without rounding a three-week task into a one-month slot.
 */
export const ANCHOR_ORDER = ['T-90', 'T-60', 'T-30', 'T-21', 'T-14', 'T-7', 'T-3', 'T-2', 'T-1']

export const ANCHOR_DAYS = {
  'T-90': 90, 'T-60': 60, 'T-30': 30, 'T-21': 21, 'T-14': 14,
  'T-7': 7, 'T-3': 3, 'T-2': 2, 'T-1': 1,
}

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

export const TEMPLE_CATEGORIES = [
  'Rituals',
  'Priests',
  'Puja Items',
  'Prasadam',
  'Venue & Setup',
  'Volunteers',
  'Finance',
  'Communication',
]

// [anchor, days before the event, task, category]
const ICC_TEMPLATE = [
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

// The religious shape. Shorter runway than the cultural one, and the heavy
// week is the last one: samagri is perishable and the sanctum is decorated the
// night before, not a month out.
const TEMPLE_TEMPLATE = [
  ['T-60', 60, 'Confirm the date and muhurtham with the priests', 'Rituals'],
  ['T-60', 60, 'Agree the budget and get committee approval', 'Finance'],
  ['T-60', 60, 'Confirm the lead priest and any visiting priests', 'Priests'],
  ['T-60', 60, 'Reserve the hall and the sanctum time slots', 'Venue & Setup'],

  ['T-30', 30, 'Finalise the ritual order — sankalpam, homa, abhishekam, archana, aarti', 'Rituals'],
  ['T-30', 30, 'Open sponsorship tiers and the archana sign-up', 'Finance'],
  ['T-30', 30, 'Order puja samagri — ghee, camphor, kumkum, coconuts, fruit', 'Puja Items'],
  ['T-30', 30, 'Confirm flowers, garlands and tulsi with the supplier', 'Puja Items'],
  ['T-30', 30, 'Estimate the annadanam headcount and confirm the cooks', 'Prasadam'],
  ['T-30', 30, 'Announce the event — WhatsApp, email, notice board and website', 'Communication'],

  ['T-14', 14, 'Collect sponsor names, gothrams and nakshatras for the sankalpam', 'Rituals'],
  ['T-14', 14, 'Confirm the homa kundam, firewood and ghee quantities', 'Puja Items'],
  ['T-14', 14, 'Plan the prasadam menu and the serving schedule', 'Prasadam'],
  ['T-14', 14, 'Recruit volunteers — archana counter, shoe stand, serving, clean-up', 'Volunteers'],
  ['T-14', 14, 'Send the invitation and the programme timings to the community', 'Communication'],

  ['T-7', 7, 'Share the final ritual timings with the priests', 'Priests'],
  ['T-7', 7, 'Confirm the sanctum, mandapam and entrance decoration plan', 'Venue & Setup'],
  ['T-7', 7, 'Print the archana slips, sponsor list and donation receipts', 'Finance'],
  ['T-7', 7, 'Lay out seating, mats and the darshan queue route', 'Venue & Setup'],
  ['T-7', 7, 'Brief volunteers on roles and arrival times', 'Volunteers'],

  ['T-3', 3, 'Buy perishables — flowers, fruit, milk, curd and vegetables', 'Puja Items'],
  ['T-3', 3, 'Test the mics, speakers and the live stream', 'Venue & Setup'],

  ['T-1', 1, 'Set out the puja vessels, samagri and the homa kundam', 'Puja Items'],
  ['T-1', 1, 'Decorate the sanctum, mandapam and entrance', 'Venue & Setup'],
  ['T-1', 1, 'Cook and store whatever prasadam can be made ahead', 'Prasadam'],
  ['T-1', 1, 'Confirm priest arrival times and prepare the dakshina envelopes', 'Priests'],
]

/**
 * The blueprints on offer, in the order the New event dialog lists them.
 * `id` is what gets stored against a created event; the names are what the
 * committee sees in the dropdown.
 */
export const TEMPLATES = [
  {
    id: 'icc',
    name: 'Standard ICC Template',
    blurb: 'cultural events — venue, artists, production, publicity',
    categories: TEMPLATE_CATEGORIES,
    rows: ICC_TEMPLATE,
  },
  {
    id: 'temple',
    name: 'Standard Temple Template',
    blurb: 'religious events — muhurtham, priests, samagri, prasadam',
    categories: TEMPLE_CATEGORIES,
    rows: TEMPLE_TEMPLATE,
  },
]

export const DEFAULT_TEMPLATE_ID = 'icc'

/** The named blueprint, falling back to the cultural one for an unknown id so
 *  a stale stored value can never produce an event with no checklist. */
export function templateById(id) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

const pad = (n) => String(n).padStart(2, '0')

/** eventDate minus `days`, as YYYY-MM-DD. Built from local date parts rather
 *  than toISOString(), which would shift the day for anyone west of UTC. */
export function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** A blueprint as a fresh checklist for one event, dated off that event.
 *  The default is the cultural blueprint: the 15 seed events call this with
 *  one argument and must keep the checklist they have always had. */
export function buildTemplateChecklist(eventDate, templateId = DEFAULT_TEMPLATE_ID) {
  return templateById(templateId).rows.map(([anchor, days, task, category], i) => ({
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
  return checklist.map((t) =>
    ANCHOR_DAYS[t.anchor] == null ? t : { ...t, due: shiftDate(eventDate, ANCHOR_DAYS[t.anchor]) }
  )
}
