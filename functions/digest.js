// What the reminder emails say.
//
// Kept free of Firestore and of firebase-functions so it can be run against
// the real calendar in a test without deploying anything — the formatting of
// an email nobody can see until it arrives is exactly the kind of thing that
// rots silently.
//
// One builder produces both shapes of email:
//
//   buildDigest({ events, today })                  the committee overview,
//                                                   grouped by who owes what
//   buildDigest({ events, today, forPerson })       one person's own list,
//                                                   grouped by event
//
// Deliberately not two functions. The committee overview and the personal
// reminder have to agree about what "overdue" means, where the week ends and
// how a date reads, and the only way to guarantee that is to compute it once.

const SOON_DAYS = 7
const HORIZON_DAYS = 14
// A section listing thirty-one items is a wall, and a wall gets archived. Show
// enough to act on and point at the app for the rest.
const MAX_ROWS_PER_SECTION = 12

/** Local date parts, not toISOString — an evening in Utah is not tomorrow. */
export function dayStamp(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysBetween(fromStamp, toStamp) {
  return Math.round(
    (new Date(toStamp + 'T00:00:00') - new Date(fromStamp + 'T00:00:00')) / 86400000
  )
}

function longDate(stamp) {
  return new Date(stamp + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Some rows carry the literal string "Unassigned" rather than being blank. */
function ownerOf(assignee) {
  const trimmed = (assignee ?? '').trim()
  return !trimmed || trimmed.toLowerCase() === 'unassigned' ? 'Unassigned' : trimmed
}

function escape(text) {
  return String(text ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

function firstName(person) {
  const name = (person?.name ?? '').trim()
  return name ? name.split(/\s+/)[0] : ''
}

/**
 * Is this milestone this person's?
 *
 * An address when the milestone was assigned from the roster. Milestones
 * assigned before the picker existed carry a typed name and no address at all,
 * and those are exactly the stale ones most worth chasing — so an exact,
 * case-insensitive name match counts too. Exact and nothing looser: "Hari" must
 * not pull in "Hari Prasad", because a reminder sent to the wrong person is
 * worse than one not sent.
 *
 * This mirrors how PersonField resolves a typed name back to a member when it
 * displays one. The two have to agree: a name the app shows as Pavithra's is a
 * name Pavithra should be reminded about.
 */
function ownsRow(row, person) {
  const email = (person?.email ?? '').trim().toLowerCase()
  if (row.ownerEmail) return !!email && String(row.ownerEmail).toLowerCase() === email
  const name = (person?.name ?? '').trim().toLowerCase()
  return !!name && row.owner.toLowerCase() === name
}

/**
 * Trims a section to `limit` rows and reports what was left out.
 *
 * Greedy by default, which is right for the committee overview: the person who
 * owes the most is read first and is the one worth seeing in full.
 *
 * A personal list is read the other way round. Greedy filling there spent all
 * twelve rows on one event and hid nineteen items belonging to three others, so
 * the reader learned about one deadline and had no idea the rest existed.
 * `minPerGroup` reserves a slice for every group first, so every event the
 * person owes anything on at least shows up with its count.
 */
function capped(groups, limit, { minPerGroup = 0 } = {}) {
  const takes = groups.map(() => 0)
  let remaining = limit
  for (let i = 0; minPerGroup > 0 && i < groups.length && remaining > 0; i++) {
    takes[i] = Math.min(minPerGroup, groups[i][1].length, remaining)
    remaining -= takes[i]
  }
  for (let i = 0; i < groups.length && remaining > 0; i++) {
    const extra = Math.min(groups[i][1].length - takes[i], remaining)
    takes[i] += extra
    remaining -= extra
  }
  const shown = []
  let hidden = 0
  groups.forEach(([key, items], i) => {
    if (takes[i] > 0) shown.push([key, items.slice(0, takes[i]), items.length])
    hidden += items.length - takes[i]
  })
  return { shown, hidden }
}

function group(rows, keyOf) {
  const map = new Map()
  for (const row of rows) {
    const key = keyOf(row)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return map
}

function groupByOwner(rows) {
  // Most owed first; Unassigned last, because it is nobody's inbox problem
  // until somebody claims it.
  return [...group(rows, (r) => r.owner).entries()].sort((a, b) => {
    if (a[0] === 'Unassigned') return 1
    if (b[0] === 'Unassigned') return -1
    return b[1].length - a[1].length || a[0].localeCompare(b[0])
  })
}

/**
 * For one person, "who owns this" is not the question — they all do. Group by
 * event instead, nearest deadline first, so the list reads as an order of work
 * rather than a pile.
 */
function groupByEvent(rows) {
  return [...group(rows, (r) => r.event).entries()].sort(
    (a, b) => a[1][0].due.localeCompare(b[1][0].due) || a[0].localeCompare(b[0])
  )
}

function liveEvents(events, includeCompleted) {
  return includeCompleted
    ? (events ?? [])
    : (events ?? []).filter((e) => e.status !== 'Completed')
}

/**
 * Every milestone still owed, split into overdue and due-this-week.
 *
 * Shared by the emails and by the preview, so a dry run cannot disagree with
 * what the Monday send would actually do — which would make it worse than no
 * dry run at all.
 */
function collectRows(live, stamp, keep = () => true, withFollowUps = []) {
  const overdue = []
  const soon = []
  const push = (row) => {
    if (!keep(row)) return
    if (row.delta < 0) overdue.push(row)
    else if (row.delta <= SOON_DAYS) soon.push(row)
  }

  // Wrap-up follow-ups come from every event, including the completed ones. A
  // follow-up outlives its event by definition — it is agreed in the debrief,
  // after the event is over — so chasing it only while the event is still
  // upcoming would mean never chasing it at all.
  for (const event of withFollowUps) {
    for (const action of event.retro?.actions ?? []) {
      if (action.status === 'Done' || !action.due) continue
      push({
        owner: ownerOf(action.assignee),
        ownerEmail: action.assigneeEmail ?? null,
        task: action.action || '(untitled follow-up)',
        event: event.name,
        due: action.due,
        delta: daysBetween(stamp, action.due),
        kind: 'follow-up',
      })
    }
  }

  for (const event of live) {
    for (const task of event.checklist ?? []) {
      if (task.status === 'Done' || !task.due) continue
      const delta = daysBetween(stamp, task.due)
      const row = {
        owner: ownerOf(task.assignee),
        // Present once the milestone was assigned from the roster rather than
        // typed. This is what a personal reminder is addressed with.
        ownerEmail: task.assigneeEmail ?? null,
        task: task.task || '(untitled)',
        event: event.name,
        due: task.due,
        delta,
        kind: 'milestone',
      }
      push(row)
    }
  }
  return { overdue, soon }
}

function upcomingEvents(live, stamp) {
  return live
    .map((e) => ({ name: e.name, date: e.date, inDays: daysBetween(stamp, e.date) }))
    .filter((e) => e.inDays >= 0 && e.inDays <= HORIZON_DAYS)
    .sort((a, b) => a.inDays - b.inDays)
}

/**
 * Builds the digest, or returns null when there is nothing worth sending.
 *
 * A weekly email that arrives saying "nothing to report" teaches people to
 * ignore it, and the one week it matters they will.
 */
export function buildDigest({
  events,
  today,
  siteUrl = 'https://icceventops.web.app',
  // The weekly send chases work that is still winnable. An ad-hoc send can ask
  // for everything, including events already behind us, which is useful when
  // someone wants the full picture rather than this week's.
  includeCompleted = false,
  // { email, name } to build one person's own list instead of the committee
  // overview. Omit for the overview.
  forPerson = null,
}) {
  const stamp = dayStamp(today)
  const live = liveEvents(events, includeCompleted)
  const keep = forPerson ? (row) => ownsRow(row, forPerson) : () => true
  const { overdue, soon } = collectRows(live, stamp, keep, events ?? [])
  const upcoming = upcomingEvents(live, stamp)

  if (forPerson) {
    // A personal reminder with no work in it is noise, however busy the
    // calendar is. The committee overview is the place for "the Mela is in nine
    // days and nobody owns anything"; an individual's inbox is not.
    if (overdue.length === 0 && soon.length === 0) return null
  } else if (overdue.length === 0 && soon.length === 0 && upcoming.length === 0) {
    return null
  }

  const byDue = (a, b) => a.due.localeCompare(b.due)
  overdue.sort(byDue)
  soon.sort(byDue)

  const counted = [
    overdue.length > 0 ? `${overdue.length} overdue` : null,
    soon.length > 0 ? `${soon.length} due this week` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const subject = forPerson
    ? `EventOps: your ${counted}`
    : overdue.length > 0 || soon.length > 0
      ? `EventOps: ${counted}`
      : `EventOps: ${upcoming[0].name} is ${upcoming[0].inDays === 0 ? 'today' : `in ${upcoming[0].inDays} days`}`

  // In the committee overview a row has to say whose it is and which event; in
  // a personal one the group heading is already the event and the owner is the
  // reader, so repeating either just makes the line harder to scan.
  const grouped = forPerson ? groupByEvent : groupByOwner
  const capping = { minPerGroup: forPerson ? 2 : 0 }
  const trailing = forPerson ? () => '' : (row) => row.event

  // ---- plain text, for clients that prefer it and for the test to read ----
  const lines = []
  if (forPerson) {
    const hi = firstName(forPerson)
    lines.push(hi ? `${hi} — here is your list.` : 'Here is your list.', '')
  }
  if (upcoming.length) {
    lines.push('COMING UP')
    for (const e of upcoming) {
      lines.push(`  ${longDate(e.date)} — ${e.name} (${e.inDays === 0 ? 'today' : `${e.inDays} days`})`)
    }
    lines.push('')
  }
  for (const [label, rows] of [
    ['OVERDUE', overdue],
    ['DUE WITHIN 7 DAYS', soon],
  ]) {
    if (!rows.length) continue
    lines.push(`${label} (${rows.length})`)
    const { shown, hidden } = capped(grouped(rows), MAX_ROWS_PER_SECTION, capping)
    for (const [key, items, total] of shown) {
      lines.push(`  ${key} — ${total}`)
      for (const it of items) {
        const tail = trailing(it)
        lines.push(`    ${longDate(it.due)}  ${it.task}${tail ? `  [${tail}]` : ''}`)
      }
    }
    if (hidden > 0) lines.push(`  …and ${hidden} more — open EventOps to see them all`)
    lines.push('')
  }
  lines.push(siteUrl)
  const text = lines.join('\n')

  // ---- html ----
  const section = (title, rows, colour) => {
    if (!rows.length) return ''
    const { shown, hidden } = capped(grouped(rows), MAX_ROWS_PER_SECTION, capping)
    const groups = shown
      .map(
        ([key, items, total]) => `
        <tr><td style="padding:14px 0 4px;font:600 13px system-ui,sans-serif;color:#12151c">
          ${escape(key)} <span style="color:#6e7684;font-weight:400">· ${total}</span>
        </td></tr>
        ${items
          .map(
            (it) => `
        <tr><td style="padding:3px 0 3px 12px;font:400 13px system-ui,sans-serif;color:#12151c">
          <span style="display:inline-block;min-width:92px;color:#6e7684;font-family:ui-monospace,monospace;font-size:12px">${escape(longDate(it.due))}</span>
          ${escape(it.task)}
          ${trailing(it) ? `<span style="color:#6e7684">· ${escape(trailing(it))}</span>` : ''}
        </td></tr>`
          )
          .join('')}`
      )
      .join('')
    const more = hidden
      ? `<tr><td style="padding:8px 0 0 12px;font:400 12px system-ui,sans-serif;color:#6e7684">…and ${hidden} more</td></tr>`
      : ''
    return `
      <tr><td style="padding:18px 0 0">
        <div style="font:700 15px system-ui,sans-serif;color:${colour}">${escape(title)} <span style="font-weight:400;color:#6e7684">(${rows.length})</span></div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${groups}${more}</table>
      </td></tr>`
  }

  const upcomingHtml = upcoming.length
    ? `<tr><td style="padding:4px 0 0">
         <div style="font:700 15px system-ui,sans-serif;color:#12151c">Coming up</div>
         ${upcoming
           .map(
             (e) => `<div style="padding:4px 0;font:400 13px system-ui,sans-serif;color:#12151c">
             <span style="display:inline-block;min-width:92px;color:#6e7684;font-family:ui-monospace,monospace;font-size:12px">${escape(longDate(e.date))}</span>
             ${escape(e.name)} <span style="color:#6e7684">· ${e.inDays === 0 ? 'today' : `${e.inDays} days`}</span></div>`
           )
           .join('')}
       </td></tr>`
    : ''

  const heading = forPerson
    ? 'Your week in EventOps'
    : includeCompleted
      ? 'Everything in EventOps'
      : 'This week in EventOps'

  const greeting =
    forPerson && firstName(forPerson)
      ? `<div style="font:400 13px system-ui,sans-serif;color:#6e7684;padding-top:4px">Hi ${escape(firstName(forPerson))} — ${escape(counted)}, grouped by event.</div>`
      : ''

  const footer = forPerson
    ? 'You are getting this because these milestones are assigned to you. Reassign one in EventOps and it moves to their list instead.'
    : "The committee's shared list: everyone's milestones, including the ones nobody owns yet. Manage who is on the committee in EventOps."

  const html = `<!doctype html>
<html>
<head>
<!-- Without this the middots and ellipsis arrive as "Ã‚Â·" and "Ã¢â‚¬Â¦": mail
     clients that get no charset fall back to Latin-1 and mangle every
     non-ASCII character in the message. -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#f3f4f7;padding:24px 12px">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dde0e7;border-radius:12px">
    <tr><td style="padding:20px 22px">
      <div style="font:700 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#2f5fed">India Cultural Center of Utah</div>
      <div style="font:700 20px system-ui,sans-serif;color:#12151c;padding-top:2px">${heading}</div>
      ${greeting}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${upcomingHtml}
        ${section('Overdue', overdue, '#d1372f')}
        ${section('Due within 7 days', soon, '#12151c')}
      </table>
      <div style="padding-top:22px">
        <a href="${escape(siteUrl)}" style="display:inline-block;background:#2f5fed;color:#ffffff;font:600 13px system-ui,sans-serif;text-decoration:none;padding:9px 14px;border-radius:6px">Open EventOps</a>
      </div>
      <div style="padding-top:16px;font:400 11px system-ui,sans-serif;color:#6e7684">
        ${footer}
      </div>
    </td></tr>
  </table>
</body></html>`

  return {
    subject,
    text,
    html,
    counts: { overdue: overdue.length, soon: soon.length, upcoming: upcoming.length },
  }
}

/**
 * What the Monday run would do, without doing it.
 *
 * Built from the same \`collectRows\` and the same \`ownsRow\` as the send itself,
 * so this cannot flatter the real behaviour. A dry run that disagrees with the
 * thing it is previewing is worse than no dry run, because it is believed.
 *
 * Three questions it has to answer, in order of how often they bite:
 *   1. Who gets an email, and what does the subject line say?
 *   2. Who gets silence, and is that because they are genuinely clear?
 *   3. Which work would reach nobody at all — unowned, or typed as a name that
 *      matches no one on the roster? That second case is invisible in the app:
 *      the milestone looks assigned.
 */
export function previewReminders({ events, today, members = [], admins = [], siteUrl }) {
  const stamp = dayStamp(today)
  const live = liveEvents(events, false)
  const { overdue, soon } = collectRows(live, stamp, () => true, events ?? [])
  const open = [...overdue, ...soon]

  const roster = members
    .filter((m) => m?.email)
    .map((m) => ({ email: String(m.email).trim().toLowerCase(), name: (m.name ?? '').trim() }))

  const adminSet = new Set(admins.map((e) => String(e).trim().toLowerCase()))

  const people = roster.map((member) => {
    const mine = open.filter((row) => ownsRow(row, member))
    const digest = mine.length > 0 ? buildDigest({ events, today, forPerson: member, siteUrl }) : null
    return {
      email: member.email,
      name: member.name,
      isAdmin: adminSet.has(member.email),
      overdue: mine.filter((r) => r.delta < 0).length,
      soon: mine.filter((r) => r.delta >= 0).length,
      events: [...new Set(mine.map((r) => r.event))].length,
      subject: digest?.subject ?? null,
      willSend: digest !== null,
    }
  })

  // Open work carrying no due date at all. The reminder is built entirely from
  // dates, so these are chased by nobody and look identical in the app to work
  // that is properly scheduled — the quietest of the three failures here.
  const undated = []
  for (const event of live) {
    for (const task of event.checklist ?? []) {
      if (task.status !== 'Done' && !task.due) {
        undated.push({ what: task.task || '(untitled)', event: event.name, kind: 'milestone' })
      }
    }
  }
  for (const event of events ?? []) {
    for (const action of event.retro?.actions ?? []) {
      if (action.status !== 'Done' && !action.due) {
        undated.push({ what: action.action || '(untitled)', event: event.name, kind: 'follow-up' })
      }
    }
  }

  // Work that reaches no inbox. Split, because the two have different fixes:
  // "Unassigned" needs somebody chosen, while a name matching nobody needs
  // either the person added to the roster or the name corrected.
  const unowned = open.filter((row) => row.owner === 'Unassigned')
  const orphaned = new Map()
  for (const row of open) {
    if (row.owner === 'Unassigned') continue
    if (roster.some((member) => ownsRow(row, member))) continue
    const current = orphaned.get(row.owner) ?? { name: row.owner, count: 0, events: new Set() }
    current.count++
    current.events.add(row.event)
    orphaned.set(row.owner, current)
  }

  const overview = buildDigest({ events, today, siteUrl })

  return {
    today: stamp,
    totals: {
      open: open.length,
      overdue: overdue.length,
      soon: soon.length,
      unowned: unowned.length,
      undated: undated.slice(0, 20),
    orphaned: [...orphaned.values()].reduce((n, o) => n + o.count, 0),
      undated: undated.length,
    },
    people: people.sort(
      (a, b) =>
        b.overdue + b.soon - (a.overdue + a.soon) || (a.name || a.email).localeCompare(b.name || b.email)
    ),
    undated: undated.slice(0, 20),
    orphaned: [...orphaned.values()]
      .map((o) => ({ name: o.name, count: o.count, events: [...o.events] }))
      .sort((a, b) => b.count - a.count),
    overview: overview
      ? { subject: overview.subject, recipients: [...adminSet].sort(), ...overview.counts }
      : null,
  }
}
