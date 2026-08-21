// Seed data for India Cultural Center of Utah — EventOps
// Dates are anchored around today (Aug 21, 2026) so the Summer Night Market
// reads as "Live Today" and drives the Day-Of Command Center demo.

export const events = [
  {
    id: 'night-market',
    name: 'Cedar Hollow Summer Night Market',
    date: '2026-08-21',
    venue: 'Founders Green & Water St. Promenade',
    status: 'Live Today',
    budget: 42000,
    spent: 38650,
    attendanceEst: 6500,
    lead: 'Priya Anand',
    heroNote: 'Annual outdoor market — 40 vendor booths, two music stages, food trucks.',
    categories: ['Venue', 'Stage/AV', 'Catering', 'Marketing', 'Permits'],
    checklist: [
      { id: 1, task: 'File temporary outdoor assembly permit', category: 'Permits', anchor: 'T-90', assignee: 'Priya Anand', due: '2026-05-23', status: 'Done' },
      { id: 2, task: 'Reserve Founders Green + promenade closure', category: 'Venue', anchor: 'T-90', assignee: 'Priya Anand', due: '2026-05-23', status: 'Done' },
      { id: 3, task: 'Sign stage & line-array rental contract', category: 'Stage/AV', anchor: 'T-60', assignee: 'Marcus Webb', due: '2026-06-22', status: 'Done' },
      { id: 4, task: 'Confirm 6 food truck vendors + health permits', category: 'Catering', anchor: 'T-60', assignee: 'Dana Iyer', due: '2026-06-22', status: 'Done' },
      { id: 5, task: 'Launch social + newsletter campaign', category: 'Marketing', anchor: 'T-30', assignee: 'Sam Ruiz', due: '2026-07-22', status: 'Done' },
      { id: 6, task: 'Pay stage & AV deposit balance', category: 'Stage/AV', anchor: 'T-30', assignee: 'Marcus Webb', due: '2026-07-22', status: 'Done' },
      { id: 7, task: 'Confirm 40 vendor booth assignments + map', category: 'Venue', anchor: 'T-7', assignee: 'Priya Anand', due: '2026-08-14', status: 'Done' },
      { id: 8, task: 'Print and laminate vendor load-in passes', category: 'Venue', anchor: 'T-7', assignee: 'Priya Anand', due: '2026-08-14', status: 'Done' },
      { id: 9, task: 'Radio check all coordinator handhelds', category: 'Stage/AV', anchor: 'T-1', assignee: 'Marcus Webb', due: '2026-08-20', status: 'Done' },
      { id: 10, task: 'Confirm final headcount w/ food trucks', category: 'Catering', anchor: 'T-1', assignee: 'Dana Iyer', due: '2026-08-20', status: 'In Progress' },
      { id: 11, task: 'Brief volunteer floor team (18 volunteers)', category: 'Venue', anchor: 'T-1', assignee: 'Priya Anand', due: '2026-08-20', status: 'Blocked' },
      { id: 12, task: 'Deliver press + sponsor day-of signage', category: 'Marketing', anchor: 'T-1', assignee: 'Sam Ruiz', due: '2026-08-20', status: 'Not Started' },
    ],
    runOfShow: [
      { time: '15:00', item: 'Vendor & food truck load-in begins', owner: 'Priya Anand', status: 'Done' },
      { time: '16:00', item: 'Stage & line-array soundcheck', owner: 'Marcus Webb', status: 'Done' },
      { time: '16:30', item: 'Volunteer floor briefing — Gate A', owner: 'Priya Anand', status: 'In Progress' },
      { time: '17:00', item: 'Gates open / market opens to public', owner: 'Floor Team', status: 'Not Started' },
      { time: '17:30', item: 'Opening remarks — Mayor Okafor', owner: 'Priya Anand', status: 'Not Started' },
      { time: '18:00', item: 'Live music — The Hollow Bend (Main Stage)', owner: 'Marcus Webb', status: 'Not Started' },
      { time: '19:30', item: 'Peak food-truck line management window', owner: 'Dana Iyer', status: 'Not Started' },
      { time: '20:15', item: 'Live music — Junction Radio (Main Stage)', owner: 'Marcus Webb', status: 'Not Started' },
      { time: '21:30', item: 'Last call announced / vendor breakdown starts', owner: 'Floor Team', status: 'Not Started' },
      { time: '22:00', item: 'Market closes / promenade load-out', owner: 'Priya Anand', status: 'Not Started' },
    ],
    vendors: [
      { name: 'Big Sky Stage & AV Rentals', role: 'Stage / Sound / Lighting', contact: 'Marcus Webb', phone: '(503) 555-0142', loadIn: '15:00 – 16:00', balance: 0, contractUrl: '#' },
      { name: 'Sunset Grove Catering', role: 'Food truck coordination', contact: 'Dana Iyer', phone: '(503) 555-0118', loadIn: '15:00 – 15:45', balance: 1200, contractUrl: '#' },
      { name: 'Cedar Hollow PD — Traffic Unit', role: 'Street closure & security', contact: 'Sgt. Rene Halvorsen', phone: '(503) 555-0199', loadIn: '14:30', balance: 0, contractUrl: '#' },
      { name: 'Bloom & Bough Event Décor', role: 'Signage, florals, banners', contact: 'Iris Chen', phone: '(503) 555-0176', loadIn: '13:00 – 14:00', balance: 450, contractUrl: '#' },
      { name: 'Riverside Portable Restrooms', role: 'Sanitation units (8)', contact: 'Tom Bergstrom', phone: '(503) 555-0163', loadIn: '12:00', balance: 0, contractUrl: '#' },
    ],
    retro: null,
  },
  {
    id: 'founders-day',
    name: "Founders' Day Parade & Festival",
    date: '2026-09-20',
    venue: 'Main St. corridor & Heritage Park',
    status: '30 Days Out',
    budget: 68000,
    spent: 21400,
    attendanceEst: 12000,
    lead: 'Marcus Webb',
    heroNote: 'City-wide parade + all-day festival — largest annual event on the calendar.',
    categories: ['Venue', 'Stage/AV', 'Catering', 'Marketing', 'Permits'],
    checklist: [
      { id: 1, task: 'File parade route + street closure permit', category: 'Permits', anchor: 'T-90', assignee: 'Marcus Webb', due: '2026-06-22', status: 'Done' },
      { id: 2, task: 'Reserve Heritage Park festival grounds', category: 'Venue', anchor: 'T-90', assignee: 'Marcus Webb', due: '2026-06-22', status: 'Done' },
      { id: 3, task: 'Book main stage + 2 satellite PA systems', category: 'Stage/AV', anchor: 'T-60', assignee: 'Marcus Webb', due: '2026-07-22', status: 'Done' },
      { id: 4, task: 'Confirm 14 food & beverage vendors', category: 'Catering', anchor: 'T-60', assignee: 'Dana Iyer', due: '2026-07-22', status: 'In Progress' },
      { id: 5, task: 'Parade unit registration deadline', category: 'Venue', anchor: 'T-30', assignee: 'Marcus Webb', due: '2026-08-21', status: 'In Progress' },
      { id: 6, task: 'Marketing cutoff — print + broadcast buy', category: 'Marketing', anchor: 'T-30', assignee: 'Sam Ruiz', due: '2026-08-21', status: 'Blocked' },
      { id: 7, task: 'Equipment rental deposit — barricades/tents', category: 'Venue', anchor: 'T-30', assignee: 'Marcus Webb', due: '2026-08-21', status: 'Not Started' },
      { id: 8, task: 'Confirm volunteer marshal roster (32)', category: 'Venue', anchor: 'T-7', assignee: 'Priya Anand', due: '2026-09-13', status: 'Not Started' },
      { id: 9, task: 'Finalize festival vendor booth map', category: 'Venue', anchor: 'T-7', assignee: 'Marcus Webb', due: '2026-09-13', status: 'Not Started' },
      { id: 10, task: 'Radio check all coordinator handhelds', category: 'Stage/AV', anchor: 'T-1', assignee: 'Marcus Webb', due: '2026-09-19', status: 'Not Started' },
    ],
    runOfShow: [
      { time: '08:00', item: 'Parade staging area opens', owner: 'Marcus Webb', status: 'Not Started' },
      { time: '10:00', item: 'Parade steps off — Main St.', owner: 'Marcus Webb', status: 'Not Started' },
      { time: '11:30', item: 'Festival grounds open — Heritage Park', owner: 'Floor Team', status: 'Not Started' },
      { time: '12:00', item: 'Mayor’s welcome + ribbon cutting', owner: 'Priya Anand', status: 'Not Started' },
      { time: '18:00', item: 'Main stage headline set', owner: 'Marcus Webb', status: 'Not Started' },
      { time: '20:30', item: 'Festival closes / vendor load-out', owner: 'Floor Team', status: 'Not Started' },
    ],
    vendors: [
      { name: 'Big Sky Stage & AV Rentals', role: 'Main stage / satellite PA', contact: 'Marcus Webb', phone: '(503) 555-0142', loadIn: '06:00 – 08:00', balance: 4800, contractUrl: '#' },
      { name: 'Cedar Hollow PD — Traffic Unit', role: 'Parade route security', contact: 'Sgt. Rene Halvorsen', phone: '(503) 555-0199', loadIn: '05:30', balance: 0, contractUrl: '#' },
      { name: 'Heritage Tent & Barricade Co.', role: 'Tents, fencing, barricades', contact: 'Wes Okonkwo', phone: '(503) 555-0184', loadIn: '06:00 – 09:00', balance: 3100, contractUrl: '#' },
    ],
    retro: null,
  },
  {
    id: 'tree-lighting',
    name: 'Downtown Holiday Tree Lighting',
    date: '2026-12-05',
    venue: 'Courthouse Square',
    status: 'Planning',
    budget: 18500,
    spent: 2100,
    attendanceEst: 3000,
    lead: 'Sam Ruiz',
    heroNote: 'Evening ceremony, choir performance, and vendor cocoa stands.',
    categories: ['Venue', 'Stage/AV', 'Catering', 'Marketing', 'Permits'],
    checklist: [
      { id: 1, task: 'File public assembly permit', category: 'Permits', anchor: 'T-90', assignee: 'Sam Ruiz', due: '2026-09-06', status: 'Done' },
      { id: 2, task: 'Reserve Courthouse Square + generator pad', category: 'Venue', anchor: 'T-90', assignee: 'Sam Ruiz', due: '2026-09-06', status: 'In Progress' },
      { id: 3, task: 'Book PA system + lighting rig', category: 'Stage/AV', anchor: 'T-60', assignee: 'Marcus Webb', due: '2026-10-06', status: 'Not Started' },
      { id: 4, task: 'Confirm cocoa & cider vendor stands', category: 'Catering', anchor: 'T-60', assignee: 'Dana Iyer', due: '2026-10-06', status: 'Not Started' },
      { id: 5, task: 'Marketing cutoff — holiday guide listing', category: 'Marketing', anchor: 'T-30', assignee: 'Sam Ruiz', due: '2026-11-05', status: 'Not Started' },
    ],
    runOfShow: [
      { time: '16:00', item: 'Vendor stand load-in', owner: 'Sam Ruiz', status: 'Not Started' },
      { time: '17:30', item: 'Choir performance begins', owner: 'Sam Ruiz', status: 'Not Started' },
      { time: '18:00', item: 'Mayor’s remarks + tree lighting', owner: 'Priya Anand', status: 'Not Started' },
      { time: '19:00', item: 'Event closes', owner: 'Floor Team', status: 'Not Started' },
    ],
    vendors: [
      { name: 'Big Sky Stage & AV Rentals', role: 'PA + lighting rig', contact: 'Marcus Webb', phone: '(503) 555-0142', loadIn: '15:00', balance: 0, contractUrl: '#' },
      { name: 'Cedar Hollow Community Choir', role: 'Performance', contact: 'LenaOfori', phone: '(503) 555-0155', loadIn: '17:00', balance: 0, contractUrl: '#' },
    ],
    retro: null,
  },
  {
    id: 'harvest-5k',
    name: 'Harvest 5K & Community Cookout',
    date: '2026-06-13',
    venue: 'Millrace Trail & Founders Green',
    status: 'Completed',
    budget: 15000,
    spent: 14280,
    attendanceEst: 1800,
    lead: 'Dana Iyer',
    heroNote: 'Timed 5K run + post-race cookout — first year testing the new blueprint template.',
    categories: ['Venue', 'Stage/AV', 'Catering', 'Marketing', 'Permits'],
    checklist: [
      { id: 1, task: 'File race route permit', category: 'Permits', anchor: 'T-90', assignee: 'Dana Iyer', due: '2026-03-15', status: 'Done' },
      { id: 2, task: 'Reserve Millrace Trail + Founders Green', category: 'Venue', anchor: 'T-90', assignee: 'Dana Iyer', due: '2026-03-15', status: 'Done' },
      { id: 3, task: 'Book timing chip vendor', category: 'Stage/AV', anchor: 'T-60', assignee: 'Dana Iyer', due: '2026-04-14', status: 'Done' },
      { id: 4, task: 'Confirm cookout catering + grills', category: 'Catering', anchor: 'T-60', assignee: 'Dana Iyer', due: '2026-04-14', status: 'Done' },
      { id: 5, task: 'Registration + marketing cutoff', category: 'Marketing', anchor: 'T-30', assignee: 'Sam Ruiz', due: '2026-05-14', status: 'Done' },
    ],
    runOfShow: [
      { time: '07:00', item: 'Course marshals in place', owner: 'Dana Iyer', status: 'Done' },
      { time: '08:00', item: 'Race start — Founders Green', owner: 'Dana Iyer', status: 'Done' },
      { time: '09:15', item: 'Cookout opens for finishers', owner: 'Floor Team', status: 'Done' },
      { time: '11:00', item: 'Awards + event closes', owner: 'Dana Iyer', status: 'Done' },
    ],
    vendors: [
      { name: 'PaceKeeper Timing Co.', role: 'Race timing & chips', contact: 'Ola Bennett', phone: '(503) 555-0131', loadIn: '06:00', balance: 0, contractUrl: '#' },
      { name: 'Sunset Grove Catering', role: 'Cookout grills & staff', contact: 'Dana Iyer', phone: '(503) 555-0118', loadIn: '08:30', balance: 0, contractUrl: '#' },
    ],
    retro: {
      whatWorked: [
        'Timing chip vendor cut finisher-line congestion in half vs. hand-timing.',
        'Cookout tent placed uphill of the finish — no bottleneck this year.',
      ],
      whatDidnt: [
        'Registration marketing went out only 4 weeks out — cutting it close.',
        'Ran short on grill propane by 40 minutes; add a spare tank to next year\'s checklist.',
      ],
      sponsorAcks: ['Millrace Outfitters', 'Cedar Hollow Credit Union', 'Grove & Vine Market'],
      finalReconciliation: { budget: 15000, spent: 14280, variance: 720 },
    },
  },
  {
    id: 'independence-day',
    name: 'Independence Day Flag Hoisting & Run',
    date: '2026-08-15',
    venue: 'Venue to be confirmed',
    status: 'Completed',
    // Budget, attendance and event lead were never captured for this one.
    // The UI omits each rather than showing "$0" or "undefined".
    budget: null,
    spent: null,
    attendanceEst: null,
    lead: null,
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
    retro: null,
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

export function readiness(event) {
  const total = event.checklist.length
  const done = event.checklist.filter((t) => t.status === 'Done').length
  return total === 0 ? 0 : Math.round((done / total) * 100)
}
