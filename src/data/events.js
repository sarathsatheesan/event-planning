// India Cultural Center of Utah — EventOps
//
// The annual community events calendar. Events whose date has passed roll into
// their next cycle here (2027); events still ahead keep their 2026 dates.
//
// Most entries are intentionally shells: name and date are known, everything
// else is for the event owner to fill in. Do not invent budgets, venues, or
// checklists — null and [] render as clear empty states asking for the real thing.

import { buildTemplateChecklist, TEMPLATE_CATEGORIES } from './template.js'

/**
 * Who runs the event.
 *
 * The ICC and the temple share a committee and a calendar but not a budget, so
 * "whose event is this" is a question every list needs to answer. Deliberately
 * a short closed list rather than free text: two values that can be filtered on
 * beat twenty spellings of the same two.
 */
export const ORGS = ['ICC', 'Temple']
export const DEFAULT_ORG = 'ICC'

/** The not-yet-planned shape shared by every event awaiting its details. */
const shell = {
  // Every event that existed before this field did belongs to the ICC — the
  // temple's events are the new case, so the default is the old world.
  org: DEFAULT_ORG,
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
  // Artist booking is off until someone turns it on: a blood drive and a
  // volunteer picnic have no performers, and an empty candidate grid on every
  // event would be noise on twelve pages to serve three.
  needsArtists: false,
  artists: [],
  // { artistId, rationale, decidedOn, decidedBy } once a group is confirmed.
  artistChoice: null,
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
// ---- India Mela. Always the first Sunday of June, which is why the Friday
  //      and Saturday setup days matter as much as the day itself. Task list
  //      lifted from the 2026 workbook: 'Task List - 2026' for the lead-up
  //      (its own Team column becomes the categories, its "Days Before" column
  //      the T-anchors) and 'Fri_Sat_Sun' for the three-day run. Statuses are
  //      reset — 2026 is done, this is next year's run. ----
  {
    ...shell,
    id: 'india-mela',
    theme: 'mela',
    name: 'India Mela',
    date: '2027-06-06',
    startTime: '10:30',
    venue: 'India Cultural Center campus',
    heroNote:
      'The year\'s largest community event — food stalls, business vendors, cultural programme, rides and games across the whole campus.',
    categories: [
      'Permit',
      'Food Stall',
      'Commercial Stall',
      'Logistics',
      'Finance/Ticketing',
      'Publicity',
      'Cultural Program',
      'External Vendors',
      'Setup',
    ],
    checklist: [
      { id: 1, task: 'Get The Special Application Permit from Candy Ponzurick @ CPonzurick@sjc.utah.gov (with Hari)', category: 'Permit', anchor: 'T-30', assignee: 'Pavithra', due: '2027-05-07', status: 'Not Started' },
      { id: 2, task: 'Get Mass Gathering Permit Required from Salt Lake County Health (contact Hayley Shaffer @ HShaffer@slco.org) (with Pavithra)', category: 'Permit', anchor: 'T-30', assignee: 'Hari', due: '2027-05-07', status: 'Not Started' },
      { id: 3, task: 'Fill up Temporary Food Establishment Application take it to SL county Health dept for approval (with Pavithra)', category: 'Permit', anchor: 'T-21', assignee: 'Hari', due: '2027-05-16', status: 'Not Started' },
      { id: 4, task: 'Call Health Department to meet with food stalls', category: 'Permit', anchor: 'T-21', assignee: 'Sarath', due: '2027-05-16', status: 'Not Started' },
      { id: 5, task: 'Medical Camp Permit for the mass gathering (with Pavithra)', category: 'Permit', anchor: 'T-14', assignee: 'Hari', due: '2027-05-23', status: 'Not Started' },
      { id: 6, task: 'Setup meeting @ the SL county Health Dept with the stall members - Basic discussion on food and its preparations (with Dhana)', category: 'Food Stall', anchor: 'T-21', assignee: 'Shreekanta', due: '2027-05-16', status: 'Not Started' },
      { id: 7, task: 'Get final list of participating booths (with Ravi, Sarath)', category: 'Food Stall', anchor: 'T-30', assignee: 'Shreekanta', due: '2027-05-07', status: 'Not Started' },
      { id: 8, task: 'Meet with groups to discuss menu and explain rules (with Ravi, Sarath)', category: 'Food Stall', anchor: 'T-21', assignee: 'Shreekanta', due: '2027-05-16', status: 'Not Started' },
      { id: 9, task: 'Finalize menu and take to SLC health dept. - Temple Stall', category: 'Food Stall', anchor: 'T-7', assignee: 'Madhavi', due: '2027-05-30', status: 'Not Started' },
      { id: 10, task: 'Finalize prices and menu', category: 'Food Stall', anchor: 'T-7', assignee: 'Madhavi', due: '2027-05-30', status: 'Not Started' },
      { id: 11, task: 'Make sure to have thermometer & test strips', category: 'Food Stall', anchor: 'T-21', assignee: 'Pavithra', due: '2027-05-16', status: 'Not Started' },
      { id: 12, task: 'Make sure to have hand wash station for food stall with soap and handsanitizer and paper towel', category: 'Food Stall', anchor: 'T-3', assignee: 'Pavithra', due: '2027-06-03', status: 'Not Started' },
      { id: 13, task: 'Restrict cooking in the Temple kitchen by food stall members - Suggestion for providing cooking facility for food stalls.', category: 'Food Stall', anchor: 'T-14', assignee: '', due: '2027-05-23', status: 'Not Started' },
      { id: 14, task: 'Stall allocation to be based on lottery pick.', category: 'Food Stall', anchor: 'T-3', assignee: '', due: '2027-06-03', status: 'Not Started' },
      { id: 15, task: 'All food stall representative must get the kit (expense report, food stall form, wrist bands, parking permit and free food tickets) (with Hari)', category: 'Food Stall', anchor: 'T-21', assignee: 'Pavithra', due: '2027-05-16', status: 'Not Started' },
      { id: 16, task: 'Develop a Punchlist from last 2 year\'s violations and present to the foodstalls.', category: 'Food Stall', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 17, task: 'Make sure cleaning solution ( bleach + water ) is available in each stall in spray bottle ?? (with Vijay, Dhana)', category: 'Food Stall', anchor: 'T-30', assignee: 'Raj', due: '2027-05-07', status: 'Not Started' },
      { id: 18, task: 'Make sure to arrange enough tables & covers for temple stall (with Sarath)', category: 'Food Stall', anchor: 'T-30', assignee: 'Sree', due: '2027-05-07', status: 'Not Started' },
      { id: 19, task: 'Order Hair nets, gloves, aprons, for temple stall', category: 'Commercial Stall', anchor: 'T-30', assignee: 'Madhavi', due: '2027-05-07', status: 'Not Started' },
      { id: 20, task: 'Finalize stall rates and put out advertisement', category: 'Commercial Stall', anchor: 'T-3', assignee: '', due: '2027-06-03', status: 'Not Started' },
      { id: 21, task: 'Provide expense report, free wristbands (2), parking permits (with Sarath)', category: 'Commercial Stall', anchor: 'T-7', assignee: 'Ravi', due: '2027-05-30', status: 'Not Started' },
      { id: 22, task: 'Bring No-parking signs to place at 104th South', category: 'Commercial Stall', anchor: 'T-30', assignee: 'Sarath', due: '2027-05-07', status: 'Not Started' },
      { id: 23, task: 'Send out forms to Vendors and give requirements - for Tax - after the Mela (with Sarath)', category: 'Commercial Stall', anchor: 'T-14', assignee: 'Ravi', due: '2027-05-23', status: 'Not Started' },
      { id: 24, task: 'Determine stall pricing and rules', category: 'Logistics', anchor: 'T-14', assignee: '', due: '2027-05-23', status: 'Not Started' },
      { id: 25, task: 'Arrange for police to block entrance - 2 cops', category: 'Logistics', anchor: 'T-21', assignee: 'Pavithra', due: '2027-05-16', status: 'Not Started' },
      { id: 26, task: 'Arrange for 1 30 yards; move the existing dumpster from its current location to south west side', category: 'Logistics', anchor: 'T-30', assignee: 'Pavithra', due: '2027-05-07', status: 'Not Started' },
      { id: 27, task: 'Arrange water stations and sign boards', category: 'Logistics', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 28, task: 'Arrange handwashing\'s stations near portable toilets with signage', category: 'Logistics', anchor: 'T-21', assignee: '', due: '2027-05-16', status: 'Not Started' },
      { id: 29, task: 'Have cleaning crew clean the food stall area; yagnashala; garbage area before tent setup', category: 'Logistics', anchor: 'T-21', assignee: 'Pavithra', due: '2027-05-16', status: 'Not Started' },
      { id: 30, task: 'Arrange cleaning crew on the day of the event from morning till evening', category: 'Logistics', anchor: 'T-7', assignee: 'Pavithra', due: '2027-05-30', status: 'Not Started' },
      { id: 31, task: 'Welcome banner and ticket selling counter tents', category: 'Logistics', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 32, task: 'Food stall tent setup (grey coloured tarp) - Large and small tent (other stalls), generator from Diamond Rental', category: 'Logistics', anchor: 'T-3', assignee: '', due: '2027-06-03', status: 'Not Started' },
      { id: 33, task: 'Call for tent setup 2 days before event', category: 'Logistics', anchor: 'T-7', assignee: '', due: '2027-05-30', status: 'Not Started' },
      { id: 34, task: 'Call for volunteers on the day of event and previous day', category: 'Logistics', anchor: 'T-7', assignee: '', due: '2027-05-30', status: 'Not Started' },
      { id: 35, task: 'Volunteers to help in Temple stall - (5-6volunteers)', category: 'Logistics', anchor: 'T-14', assignee: 'Madhavi', due: '2027-05-23', status: 'Not Started' },
      { id: 36, task: 'Contact ISA for list of volunteers', category: 'Logistics', anchor: 'T-3', assignee: 'Suma', due: '2027-06-03', status: 'Not Started' },
      { id: 37, task: 'Prepare list of volunteer tasks and timings (with Ravi, Ashwin)', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Shreekanta', due: '2027-05-07', status: 'Not Started' },
      { id: 38, task: 'Order different color tickets (online) - Early bird/volunteer/vendor bands (for entry purposes only) and kids activity wristband', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 39, task: 'Hand stamps for entry', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 40, task: 'Generate sign-up lists seeking ISA & Board members/LT\'s help in the ticket counter. List should have phone numbers and emails', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Pavithra', due: '2027-05-07', status: 'Not Started' },
      { id: 41, task: 'Send emails to the names in the list generated by Vidya above to confirm', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Suma', due: '2027-05-07', status: 'Not Started' },
      { id: 42, task: 'Compile the list of volunteers for cash counter and prepare roster with timings. (with Ravi)', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Suma', due: '2027-05-07', status: 'Not Started' },
      { id: 43, task: 'Obtain name of the person that will be handling the cash counter from each of the food stalls', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Shashi', due: '2027-05-07', status: 'Not Started' },
      { id: 44, task: 'Order the paper stock for menu cards', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 45, task: 'Print the food items on the menu cards. (with Bagi, Vijay)', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Shashidhar', due: '2027-05-07', status: 'Not Started' },
      { id: 46, task: 'Prepare SOP on how the new cash counter process will work', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 47, task: 'Buy additional square readers', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Ravi', due: '2027-05-07', status: 'Not Started' },
      { id: 48, task: 'Petty cash for the cash boxes - $100 in change for each box', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 49, task: 'Have additional change packets ready', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 50, task: 'Prepare all tablets with download of square app/mini training on how to use', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Vijay', due: '2027-05-07', status: 'Not Started' },
      { id: 51, task: 'Checck if we can get additional hot spots from our provider', category: 'Finance/Ticketing', anchor: 'T-30', assignee: 'Suma', due: '2027-05-07', status: 'Not Started' },
      { id: 52, task: 'Have log sheet printed for volunteers and tokens to distribute', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 53, task: 'Prepare box for Food Vendors - Items in Box ( Parking Pass, Coupons)', category: 'Finance/Ticketing', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 54, task: 'Have pre-sales frozen on Friday night and print out names', category: 'Publicity', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 55, task: 'Preparation of event poster', category: 'Publicity', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 56, task: 'Printing and distribution to various locations.', category: 'Publicity', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 57, task: 'Send out Mela info and teasers on Social media', category: 'Publicity', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 58, task: 'Fix the banner on the main road -India Mela', category: 'Cultural Program', anchor: 'T-21', assignee: '', due: '2027-05-16', status: 'Not Started' },
      { id: 59, task: 'Contact groups for programs', category: 'Cultural Program', anchor: 'T-7', assignee: '', due: '2027-05-30', status: 'Not Started' },
      { id: 60, task: 'Come up with program list and finalize timing', category: 'Cultural Program', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 61, task: 'Arrange MC and Music Coordinator and audio set up', category: 'Cultural Program', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 62, task: 'On day of event coordinate the various events.', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 63, task: 'Order Tents, generators, tables,stages, chairs and misc items from Diamond Rental', category: 'External Vendors', anchor: 'T-21', assignee: 'Sarath', due: '2027-05-16', status: 'Not Started' },
      { id: 64, task: 'generators', category: 'External Vendors', anchor: 'T-30', assignee: 'Hari', due: '2027-05-07', status: 'Not Started' },
      { id: 65, task: 'Order golf carts', category: 'External Vendors', anchor: 'T-30', assignee: 'Sarath', due: '2027-05-07', status: 'Not Started' },
      { id: 66, task: 'Order Inflatables and train rides', category: 'External Vendors', anchor: 'T-30', assignee: 'Sarath', due: '2027-05-07', status: 'Not Started' },
      { id: 67, task: 'Contact Mango Ice cream vendor', category: 'External Vendors', anchor: 'T-21', assignee: 'Sarath', due: '2027-05-16', status: 'Not Started' },
      { id: 68, task: 'Contact face-painting, children\'s games vendors', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 69, task: 'Order Hand wash stations', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 70, task: 'Email to the adjacent office property management', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 71, task: 'Priest for aarati on day of event', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 72, task: 'Flad Bed Truck rental from U haul', category: 'External Vendors', anchor: 'T-30', assignee: 'Ashwin', due: '2027-05-07', status: 'Not Started' },
      { id: 73, task: 'Wrist Bands', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 74, task: 'Permits - Food permit', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 75, task: 'Ace dumpser - 30 pounds', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 76, task: 'Bouncing bins / Cotton Candy- Sarath', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 77, task: 'Ice Cream', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 78, task: 'Honey Bucket - 2 and Hand wash stations', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 79, task: 'Block ICC from Wednesday till the Mela day', category: 'External Vendors', anchor: 'T-30', assignee: 'Dhana', due: '2027-05-07', status: 'Not Started' },
      { id: 80, task: 'Dirt Parking Lot on the South East corner (with Sree, Ashwin, Hari)', category: 'External Vendors', anchor: 'T-30', assignee: 'Ravi', due: '2027-05-07', status: 'Not Started' },
      { id: 81, task: 'Friday cordan off the parking area, for tent set up on Saturday', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 82, task: 'Instructions for the cleaning crew', category: 'External Vendors', anchor: 'T-30', assignee: '', due: '2027-05-07', status: 'Not Started' },
      { id: 83, task: 'Main Tent Set Up', category: 'Setup', anchor: 'T-2', assignee: 'Sarath', due: '2027-06-04', status: 'Not Started' },
      { id: 84, task: 'Stage and Chairs', category: 'Setup', anchor: 'T-2', assignee: 'Sarath', due: '2027-06-04', status: 'Not Started' },
      { id: 85, task: 'Allocate Concrete blocks and water barrels', category: 'Setup', anchor: 'T-2', assignee: 'Sarath', due: '2027-06-04', status: 'Not Started' },
      { id: 86, task: 'Generator and electric items', category: 'Setup', anchor: 'T-2', assignee: 'Hari', due: '2027-06-04', status: 'Not Started' },
      { id: 87, task: 'WiFi Setup (with Pai, Naren)', category: 'Setup', anchor: 'T-2', assignee: 'Shashi', due: '2027-06-04', status: 'Not Started' },
      { id: 88, task: 'Print & Laminate Permits', category: 'Setup', anchor: 'T-2', assignee: 'Pavithra', due: '2027-06-04', status: 'Not Started' },
      { id: 89, task: 'Print & Laminate Food booth Checklist', category: 'Setup', anchor: 'T-2', assignee: 'Pavithra', due: '2027-06-04', status: 'Not Started' },
      { id: 90, task: 'Set up One Hand wash Station for Commissary ICC Hall', category: 'Setup', anchor: 'T-2', assignee: 'Dhana', due: '2027-06-04', status: 'Not Started' },
      { id: 91, task: 'Identify All Posters', category: 'Setup', anchor: 'T-2', assignee: 'Sarath', due: '2027-06-04', status: 'Not Started' },
      { id: 92, task: 'Identify All SIgn Boards - Water/Restroom/First Aid', category: 'Setup', anchor: 'T-2', assignee: 'Naren', due: '2027-06-04', status: 'Not Started' },
      { id: 93, task: 'Golf Cart delivered', category: 'Setup', anchor: 'T-2', assignee: '', due: '2027-06-04', status: 'Not Started' },
      { id: 94, task: 'Check with Vendor for COnfirmation - Ice Cream - Bounce House - Train + Cotton Candy', category: 'Setup', anchor: 'T-2', assignee: 'Sarath', due: '2027-06-04', status: 'Not Started' },
      { id: 95, task: 'TV for temple stall', category: 'Setup', anchor: 'T-2', assignee: 'Hari', due: '2027-06-04', status: 'Not Started' },
      { id: 96, task: 'Allocate Volunteer Slots (with Suma)', category: 'Setup', anchor: 'T-2', assignee: 'Ravi', due: '2027-06-04', status: 'Not Started' },
      { id: 97, task: 'Identify the Orange sheet for fencing', category: 'Setup', anchor: 'T-2', assignee: '', due: '2027-06-04', status: 'Not Started' },
      { id: 98, task: 'Identify the keys for back entrance', category: 'Setup', anchor: 'T-2', assignee: '', due: '2027-06-04', status: 'Not Started' },
      { id: 99, task: 'Electrical Set up', category: 'Setup', anchor: 'T-1', assignee: 'Alucio', due: '2027-06-05', status: 'Not Started' },
      { id: 100, task: 'Pick up water from Costco (with Sarath)', category: 'Setup', anchor: 'T-1', assignee: 'Chaitu', due: '2027-06-05', status: 'Not Started' },
      { id: 101, task: 'Trash Can/Orange Bucket/Water Can Cleaning (with Oscar)', category: 'Setup', anchor: 'T-1', assignee: 'Dhana', due: '2027-06-05', status: 'Not Started' },
      { id: 102, task: 'Set up Hand wash Stations (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Dhana', due: '2027-06-05', status: 'Not Started' },
      { id: 103, task: 'Set up bleach water (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Dhana', due: '2027-06-05', status: 'Not Started' },
      { id: 104, task: 'Kitchen Cleaning before Food inspection (with Ravi)', category: 'Setup', anchor: 'T-1', assignee: 'Madhavi', due: '2027-06-05', status: 'Not Started' },
      { id: 105, task: 'Volunteer Meet (with Naren)', category: 'Setup', anchor: 'T-1', assignee: 'Manju', due: '2027-06-05', status: 'Not Started' },
      { id: 106, task: 'Arrange Sign boards for Water Stations/Restrooms/FIrst Aid (with Sarath)', category: 'Setup', anchor: 'T-1', assignee: 'Naren', due: '2027-06-05', status: 'Not Started' },
      { id: 107, task: 'Chairs and standing desk (with Sarath)', category: 'Setup', anchor: 'T-1', assignee: 'Raj', due: '2027-06-05', status: 'Not Started' },
      { id: 108, task: 'Yagnasaala Cleanup', category: 'Setup', anchor: 'T-1', assignee: 'Oscar', due: '2027-06-05', status: 'Not Started' },
      { id: 109, task: 'Print Car Pass/Contact Card', category: 'Setup', anchor: 'T-1', assignee: 'Pavithra', due: '2027-06-05', status: 'Not Started' },
      { id: 110, task: 'Arrange all coupons for front desk and temple stall for ice cream/cotton candy and cricket', category: 'Setup', anchor: 'T-1', assignee: 'Pavithra', due: '2027-06-05', status: 'Not Started' },
      { id: 111, task: 'Tockens for Volunteers', category: 'Setup', anchor: 'T-1', assignee: 'Pavithra', due: '2027-06-05', status: 'Not Started' },
      { id: 112, task: 'Volunteer badges', category: 'Setup', anchor: 'T-1', assignee: 'Pavithra', due: '2027-06-05', status: 'Not Started' },
      { id: 113, task: 'Arrange all Stamps and QR Codes (Print QR Codes and keep in Tags)', category: 'Setup', anchor: 'T-1', assignee: 'Pavithra', due: '2027-06-05', status: 'Not Started' },
      { id: 114, task: 'Pick up freezer', category: 'Setup', anchor: 'T-1', assignee: 'Puru', due: '2027-06-05', status: 'Not Started' },
      { id: 115, task: 'Arrange car pass, volunteer band for food stalls, square device connector in a ziplock (with Sree)', category: 'Setup', anchor: 'T-1', assignee: 'Ravi', due: '2027-06-05', status: 'Not Started' },
      { id: 116, task: 'Arrange car pass, volunteer band for vendor stalls in a ziplock (with Karthick)', category: 'Setup', anchor: 'T-1', assignee: 'Ravi', due: '2027-06-05', status: 'Not Started' },
      { id: 117, task: 'Food inspection (with Sree)', category: 'Setup', anchor: 'T-1', assignee: 'Ravi', due: '2027-06-05', status: 'Not Started' },
      { id: 118, task: 'Fire blankets in all tents (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 119, task: 'Place permit in the ICC hall (with Pavithra)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 120, task: 'Place all the permits in Temple stalls (with Pavithra)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 121, task: 'Turn On freezer set on Continous cycle only (with Alucio)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 122, task: 'Pick up U-Haul Truck (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 123, task: 'Stage Set up (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 124, task: 'Front Banner on 12 ft Pole (with Raj)', category: 'Setup', anchor: 'T-1', assignee: 'Sarath', due: '2027-06-05', status: 'Not Started' },
      { id: 125, task: 'Medical Booth Privacy Area STepping Stool and Table (with Vijay)', category: 'Setup', anchor: 'T-1', assignee: 'Shashi', due: '2027-06-05', status: 'Not Started' },
      { id: 126, task: 'Square Set up for temple booths (with Vijay)', category: 'Setup', anchor: 'T-1', assignee: 'Shashi', due: '2027-06-05', status: 'Not Started' },
      { id: 127, task: 'Tent Set up - Separate color for Water Station and Medical Booth (with ALL)', category: 'Setup', anchor: 'T-1', assignee: 'Shashi', due: '2027-06-05', status: 'Not Started' },
      { id: 128, task: 'Photo Booth Set up (with Vidya)', category: 'Setup', anchor: 'T-1', assignee: 'Suma', due: '2027-06-05', status: 'Not Started' },
      { id: 129, task: 'Temple Stall Items Set Up (with Vidya, Dhana)', category: 'Setup', anchor: 'T-1', assignee: 'Suma', due: '2027-06-05', status: 'Not Started' },
      { id: 130, task: 'Vegetables and SPices for Kids Event', category: 'Setup', anchor: 'T-1', assignee: 'Swapna', due: '2027-06-05', status: 'Not Started' },
    ],
    // DRAFT TIMES — the Fri_Sat_Sun sheet lists Sunday activities without
    // times. Order is inferred from the work itself, anchored on the 10:30
    // aarati the sheet names. Correct them to the real schedule.
    runOfShow: [
      { time: '06:30', item: 'Hand wash Station Water in All Stalls (with Sarath)', owner: 'Raj', status: 'Not Started' },
      { time: '06:45', item: 'Bleach Stations in two sides East and West (with Sree)', owner: 'Ravi', status: 'Not Started' },
      { time: '07:00', item: 'Make sure to provide plastic boxes to collect tokens for each food stalls (with G, Sree)', owner: 'Shashi', status: 'Not Started' },
      { time: '07:00', item: 'Provide Stamps/QR Codes/Checklist for voting to all food stalls (with Sree)', owner: 'Ravi', status: 'Not Started' },
      { time: '07:30', item: 'Set up Bounce House/Train', owner: 'Sarath', status: 'Not Started' },
      { time: '08:00', item: 'Cricket Net Set Up (with Pai)', owner: 'Manju', status: 'Not Started' },
      { time: '08:00', item: 'Volunteer Checkin Allotment (with Swapna)', owner: 'Naren', status: 'Not Started' },
      { time: '08:30', item: 'Complete Checklist in all stalls (with Sree)', owner: 'Ravi', status: 'Not Started' },
      { time: '09:00', item: 'Cars out of Campus', owner: '', status: 'Not Started' },
      { time: '09:30', item: 'Audio (with Shreyas)', owner: 'Pai', status: 'Not Started' },
      { time: '10:00', item: 'On day of event coordinate the audio setup to complete by 10:30 am before aarati', owner: '', status: 'Not Started' },
      { time: '10:30', item: 'Aarati (with Satish, Priya)', owner: 'Priest', status: 'Not Started' },
    ],
  },
]

export const statusTone = {
  Planning: 'neutral',
  '30 Days Out': 'warning',
  'Live Today': 'live',
  Completed: 'success',
}

/**
 * The order a task walks through when someone taps its status. One definition,
 * because three surfaces advance it now — the milestone list, the boards, and
 * My Work — and a cycle that differs between them would strand a task in a
 * state the next screen cannot move it out of.
 */
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Done']

export function nextStatus(current) {
  const i = TASK_STATUSES.indexOf(current)
  return TASK_STATUSES[(i + 1) % TASK_STATUSES.length]
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
