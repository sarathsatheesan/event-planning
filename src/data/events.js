// India Cultural Center of Utah — EventOps
//
// The annual community events calendar. Events whose date has passed roll into
// their next cycle here (2027); events still ahead keep their 2026 dates.
//
// Most entries are intentionally shells: name and date are known, everything
// else is for the event owner to fill in. Do not invent budgets, venues, or
// checklists — null and [] render as clear empty states asking for the real thing.

import { buildTemplateChecklist, TEMPLATE_CATEGORIES } from './template.js'

/** The not-yet-planned shape shared by every event awaiting its details. */
const shell = {
  endDate: null,
  // Drives the banner artwork — see EventArt.jsx for the palette and motif
  // behind each key.
  theme: 'default',
  // When the event actually begins. Null until someone sets it — the Day-Of
  // timeline uses it to show what is prep and what is showtime.
  startTime: null,
  venue: null,
  lead: null,
  budget: null,
  spent: null,
  attendanceEst: null,
  heroNote: null,
  categories: TEMPLATE_CATEGORIES,
  runOfShow: [],
  vendors: [],
  retro: null,
}

export const events = [
  // ---- Rolled to the 2027 cycle (these dates have passed in 2026) ----
  { ...shell, id: 'republic-day', theme: 'tricolour', name: 'Republic Day', date: '2027-01-31',
    checklist: buildTemplateChecklist('2027-01-31') },
  { ...shell, id: 'magic-show', theme: 'magic', name: 'Magic Show', date: '2027-02-07',
    checklist: buildTemplateChecklist('2027-02-07') },
  {
    ...shell,
    id: 'golden-era-bollywood', theme: 'cinema',
    name: 'Golden Era of Bollywood',
    date: '2027-02-28',
    endDate: '2027-03-01',
    checklist: buildTemplateChecklist('2027-02-28'),
  },
  {
    ...shell,
    id: 'table-tennis', theme: 'sport',
    name: 'Table Tennis Tournament',
    date: '2027-03-06',
    endDate: '2027-03-07',
    checklist: buildTemplateChecklist('2027-03-06'),
  },
  { ...shell, id: 'vaadya-vaadan', theme: 'raga', name: 'Vaadya Vaadan', date: '2027-03-21',
    checklist: buildTemplateChecklist('2027-03-21') },
  { ...shell, id: 'chaitra-utsav', theme: 'spring', name: 'Chaitra Utsav', date: '2027-04-11',
    checklist: buildTemplateChecklist('2027-04-11') },
  {
    ...shell,
    id: 'tyagaraja-aradhana', theme: 'classical',
    name: 'Tyagaraja Aradhana',
    date: '2027-05-08',
    endDate: '2027-05-10',
    checklist: buildTemplateChecklist('2027-05-08'),
  },
  { ...shell, id: 'yoga-day', theme: 'sunrise', name: 'International Yoga Day', date: '2027-06-21',
    checklist: buildTemplateChecklist('2027-06-21') },

  // ---- Still ahead in the 2026 cycle ----
  { ...shell, id: 'nrityanjali', theme: 'dance', name: 'Nrityanjali', date: '2026-09-27',
    checklist: buildTemplateChecklist('2026-09-27') },
  { ...shell, id: 'navratri-concert', theme: 'navratri', name: 'Navratri Concert', date: '2026-10-24',
    checklist: buildTemplateChecklist('2026-10-24') },
  {
    ...shell,
    id: 'general-body-meeting', theme: 'formal',
    name: 'SGHTU & ICC General Body Meeting',
    date: '2026-11-15',
    checklist: buildTemplateChecklist('2026-11-15'),
  },
  { ...shell, id: 'volunteer-appreciation', theme: 'gratitude', name: 'Volunteer Appreciation Day', date: '2026-12-06',
    checklist: buildTemplateChecklist('2026-12-06') },
  { ...shell, id: 'chess-tournament', theme: 'chess', name: 'Chess Tournament', date: '2026-12-12',
    checklist: buildTemplateChecklist('2026-12-12') },

  // ---- Held Aug 15, 2026. Kept as-is: the one event with real planning data,
  //      and the blueprint for next year's run. ----
  {
    ...shell,
    id: 'independence-day', theme: 'tricolour',
    name: 'Independence Day Celebrations',
    date: '2026-08-15',
    venue: 'Venue to be confirmed',
    heroNote:
      'Morning flag hoisting, national anthem, and a timed community run with medals and prize distribution.',
    categories: ['Registration', 'Awards', 'Ceremony', 'Logistics'],
    // DRAFT ANCHORS — the source list had no lead times, so each T-anchor is
    // inferred from the nature of the task. Adjust to match how early you work.
    checklist: [
      { id: 1, task: 'Get the list of participants from Doug (midday)', category: 'Registration', anchor: 'T-1', assignee: 'Unassigned', due: '2026-08-14', status: 'Not Started' },
      { id: 2, task: 'Check whether we have sticker sheets for printing QR codes', category: 'Registration', anchor: 'T-7', assignee: 'Pavithra', due: '2026-08-08', status: 'Not Started' },
      { id: 3, task: 'Print QR codes on sticker sheets from the office printer', category: 'Registration', anchor: 'T-1', assignee: 'Unassigned', due: '2026-08-14', status: 'Not Started' },
      { id: 4, task: 'Collect trophies from Crown Trophy', category: 'Awards', anchor: 'T-7', assignee: 'Hari', due: '2026-08-08', status: 'Not Started' },
      { id: 5, task: 'Arrange medals and trophies at the venue', category: 'Awards', anchor: 'T-1', assignee: 'Unassigned', due: '2026-08-14', status: 'Not Started' },
      { id: 6, task: 'Arrange T-shirts and bibs for participants, attaching stickers', category: 'Registration', anchor: 'T-1', assignee: 'Unassigned', due: '2026-08-14', status: 'Not Started' },
      { id: 7, task: 'Place two flag poles and run a trial hoisting (Ramiah or Pai can help)', category: 'Ceremony', anchor: 'T-7', assignee: 'Unassigned', due: '2026-08-08', status: 'Not Started' },
      { id: 8, task: 'Arrange flowers for the flag for Saturday morning', category: 'Ceremony', anchor: 'T-1', assignee: 'Unassigned', due: '2026-08-14', status: 'Not Started' },
      { id: 9, task: 'Confirm the timing of the American flag hoisting', category: 'Ceremony', anchor: 'T-7', assignee: 'Unassigned', due: '2026-08-08', status: 'Not Started' },
      { id: 10, task: 'Arrange singers for the national anthem', category: 'Ceremony', anchor: 'T-30', assignee: 'Chinmy', due: '2026-07-16', status: 'Not Started' },
      { id: 11, task: 'Arrange two tents — volunteer booth (coffee/snacks) and front desk', category: 'Logistics', anchor: 'T-7', assignee: 'Unassigned', due: '2026-08-08', status: 'Not Started' },
    ],
    // DRAFT TIMES — the source list was untimed. The order is inferred from the
    // tasks themselves (coffee by 07:00, hoisting, run, then medals and prizes).
    // Three of these are purchases that probably belong in pre-event prep.
    runOfShow: [
      { time: '06:30', item: 'Stage water bottles at the venue', owner: 'Unassigned', status: 'Not Started' },
      { time: '06:30', item: 'Stage snack bars and bananas for post-run distribution', owner: 'Unassigned', status: 'Not Started' },
      { time: '07:00', item: 'Coffee ready for volunteers', owner: 'Madhavi', status: 'Done' },
      { time: '07:00', item: 'Hand out volunteer breakfast coupons — confirm kitchen is aware', owner: 'Madhavi', status: 'Not Started' },
      { time: '07:15', item: 'Put out bagels for volunteers', owner: 'Unassigned', status: 'Not Started' },
      { time: '08:00', item: 'Flag hoisting (exact time to be confirmed)', owner: 'Unassigned', status: 'Not Started' },
      { time: '09:30', item: 'Distribute snacks to runners after the run', owner: 'Unassigned', status: 'Not Started' },
      { time: '09:45', item: 'Distribute medals to finishers', owner: 'Unassigned', status: 'Not Started' },
      { time: '10:15', item: 'Prize distribution — gift cards and trophies', owner: 'Unassigned', status: 'Not Started' },
    ],
    vendors: [
      { name: 'Crown Trophy', role: 'Trophies and medals', contact: 'Hari', phone: '—', loadIn: 'Collect before event day', balance: 0, contractUrl: '#' },
    ],
  },
]

export const statusTone = {
  Planning: 'neutral',
  '30 Days Out': 'warning',
  'Live Today': 'live',
  Completed: 'success',
}

export const taskStatusTone = {
  'Not Started': 'neutral',
  'In Progress': 'warning',
  Blocked: 'critical',
  Done: 'success',
}

/**
 * Status is derived from the date rather than stored. A stored status goes
 * stale the moment time passes or an owner edits a date — and dates are
 * editable now, so deriving is the only way it stays honest.
 */
export function deriveStatus(dateStr, endDate, today = new Date()) {
  const start = new Date(dateStr + 'T00:00:00')
  const finish = new Date((endDate ?? dateStr) + 'T00:00:00')
  const t = new Date(today.toDateString())
  if (finish < t) return 'Completed'
  if (start <= t && t <= finish) return 'Live Today'
  const days = Math.round((start - t) / 86400000)
  return days <= 30 ? '30 Days Out' : 'Planning'
}

/** "Feb 28 – Mar 1, 2027" for multi-day events, a single date otherwise. */
export function formatDateRange(dateStr, endDate) {
  const start = new Date(dateStr + 'T00:00:00')
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  if (!endDate) return start.toLocaleDateString('en-US', opts)
  const end = new Date(endDate + 'T00:00:00')
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', opts)}`
}

export function readiness(event) {
  const total = event.checklist.length
  const done = event.checklist.filter((t) => t.status === 'Done').length
  return total === 0 ? 0 : Math.round((done / total) * 100)
}
