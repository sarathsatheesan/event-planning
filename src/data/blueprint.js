import { buildTemplateChecklist, realignDueDates, shiftDate, TEMPLATE_CATEGORIES } from './template.js'
import { DEFAULT_ORG } from './events.js'

// Creating next year's event from last year's is the whole point of keeping a
// calendar of recurring events. What carries over is everything that describes
// *how* the event runs; what resets is everything that describes how this
// particular cycle went.

export function newEventId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function dayDelta(fromStamp, toStamp) {
  return Math.round(
    (new Date(toStamp + 'T00:00:00') - new Date(fromStamp + 'T00:00:00')) / 86400000
  )
}

/** What a copy would bring across, for the dialog to say so before you commit. */
export function describeSource(source) {
  if (!source) return null
  const counts = [
    [(source.checklist ?? []).length, 'milestone'],
    [(source.runOfShow ?? []).length, 'run-of-show item'],
    [(source.vendors ?? []).length, 'vendor'],
  ]
    .filter(([n]) => n > 0)
    .map(([n, word]) => `${n} ${word}${n === 1 ? '' : 's'}`)
  return counts.length ? counts.join(', ') : 'no milestones yet'
}

/**
 * A new event — either the standard 23-step blueprint, or a copy of a previous
 * event re-spaced around the new date.
 */
export function buildEvent({ name, date, source, org }) {
  // Copying last year's temple event should not quietly produce an ICC one.
  const runBy = org ?? source?.org ?? DEFAULT_ORG
  const base = {
    name: name.trim(),
    date,
    org: runBy,
    endDate: null,
    theme: 'default',
    startTime: null,
    venue: null,
    lead: null,
    budget: null,
    spent: null,
    attendanceEst: null,
    heroNote: null,
    categories: TEMPLATE_CATEGORIES,
    checklist: buildTemplateChecklist(date),
    runOfShow: [],
    vendors: [],
    retro: null,
    needsArtists: false,
    artists: [],
    artistChoice: null,
    needsFoodStalls: false,
    foodVendors: [],
  }

  if (!source) return base

  return {
    ...base,
    // A multi-day run keeps its length, not its old dates.
    endDate: source.endDate ? shiftDate(date, dayDelta(source.date, source.endDate)) : null,
    theme: source.theme ?? base.theme,
    startTime: source.startTime ?? null,
    venue: source.venue ?? null,
    // Owners carry across — the same people usually do the same jobs, and
    // clearing a name is quicker than retyping twenty of them.
    lead: source.lead ?? null,
    leadEmail: source.leadEmail ?? null,
    budget: source.budget ?? null,
    attendanceEst: source.attendanceEst ?? null,
    heroNote: source.heroNote ?? null,
    categories: source.categories ?? base.categories,
    checklist: realignDueDates(
      (source.checklist ?? []).map((task) => ({ ...task, status: 'Not Started' })),
      date
    ),
    runOfShow: (source.runOfShow ?? []).map((item) => ({ ...item, status: 'Not Started' })),
    // Vendors are worth keeping — same caterer, same sound company. Last
    // year's outstanding balance is not this year's problem.
    vendors: (source.vendors ?? []).map((vendor) => ({ ...vendor, balance: 0 })),
    needsArtists: source.needsArtists ?? false,
    // Same stalls, same menus — that is the point of copying last year. The
    // paperwork trail resets, because none of it has happened yet this year.
    needsFoodStalls: source.needsFoodStalls ?? false,
    foodVendors: (source.foodVendors ?? []).map((vendor) => ({
      ...vendor,
      confirmed: '',
      attendedMeeting1: false,
      attendedCityMeeting: false,
      posMeeting: false,
      menuProvided: false,
      poster: false,
      depositPaid: false,
      stallPayment: false,
      finalSettlement: false,
    })),
    // Deliberately not copied: spent, retro, artists and the artist choice.
    // A new cycle means new quotes, new candidates and an unwritten wrap-up.
  }
}
