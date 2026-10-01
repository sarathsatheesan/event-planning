// What the weekly email says.
//
// Kept free of Firestore and of firebase-functions so it can be run against
// the real calendar in a test without deploying anything — the formatting of
// an email nobody can see until it arrives is exactly the kind of thing that
// rots silently.

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

/**
 * Walks owner groups in order, emitting at most `limit` rows in total and
 * reporting what was left out. Truncating whole owners instead would hide
 * someone's work entirely, which is worse than showing them a short list.
 */
function capped(groups, limit) {
  const shown = []
  let remaining = limit
  let hidden = 0
  for (const [owner, items] of groups) {
    if (remaining <= 0) {
      hidden += items.length
      continue
    }
    shown.push([owner, items.slice(0, remaining), items.length])
    hidden += Math.max(0, items.length - remaining)
    remaining -= Math.min(items.length, remaining)
  }
  return { shown, hidden }
}

function groupByOwner(rows) {
  const byOwner = new Map()
  for (const row of rows) {
    if (!byOwner.has(row.owner)) byOwner.set(row.owner, [])
    byOwner.get(row.owner).push(row)
  }
  // Most owed first; Unassigned last, because it is nobody's inbox problem
  // until somebody claims it.
  return [...byOwner.entries()].sort((a, b) => {
    if (a[0] === 'Unassigned') return 1
    if (b[0] === 'Unassigned') return -1
    return b[1].length - a[1].length || a[0].localeCompare(b[0])
  })
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
}) {
  const stamp = dayStamp(today)
  const live = includeCompleted
    ? (events ?? [])
    : (events ?? []).filter((e) => e.status !== 'Completed')

  const overdue = []
  const soon = []

  for (const event of live) {
    for (const task of event.checklist ?? []) {
      if (task.status === 'Done' || !task.due) continue
      const delta = daysBetween(stamp, task.due)
      const row = {
        owner: ownerOf(task.assignee),
        // Present once the milestone was assigned from the roster rather than
        // typed. Unused by this digest, which goes to the whole committee, but
        // it is what a per-person reminder will be addressed with.
        ownerEmail: task.assigneeEmail ?? null,
        task: task.task || '(untitled)',
        event: event.name,
        due: task.due,
        delta,
      }
      if (delta < 0) overdue.push(row)
      else if (delta <= SOON_DAYS) soon.push(row)
    }
  }

  const upcoming = live
    .map((e) => ({ name: e.name, date: e.date, inDays: daysBetween(stamp, e.date) }))
    .filter((e) => e.inDays >= 0 && e.inDays <= HORIZON_DAYS)
    .sort((a, b) => a.inDays - b.inDays)

  if (overdue.length === 0 && soon.length === 0 && upcoming.length === 0) return null

  const byDue = (a, b) => a.due.localeCompare(b.due)
  overdue.sort(byDue)
  soon.sort(byDue)

  const subject =
    overdue.length > 0
      ? `EventOps: ${overdue.length} overdue, ${soon.length} due this week`
      : soon.length > 0
        ? `EventOps: ${soon.length} due this week`
        : `EventOps: ${upcoming[0].name} is ${upcoming[0].inDays === 0 ? 'today' : `in ${upcoming[0].inDays} days`}`

  // ---- plain text, for clients that prefer it and for the test to read ----
  const lines = []
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
    const { shown, hidden } = capped(groupByOwner(rows), MAX_ROWS_PER_SECTION)
    for (const [owner, items, total] of shown) {
      lines.push(`  ${owner} — ${total}`)
      for (const it of items) {
        lines.push(`    ${longDate(it.due)}  ${it.task}  [${it.event}]`)
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
    const { shown, hidden } = capped(groupByOwner(rows), MAX_ROWS_PER_SECTION)
    const groups = shown
      .map(
        ([owner, items, total]) => `
        <tr><td style="padding:14px 0 4px;font:600 13px system-ui,sans-serif;color:#12151c">
          ${escape(owner)} <span style="color:#6e7684;font-weight:400">· ${total}</span>
        </td></tr>
        ${items
          .map(
            (it) => `
        <tr><td style="padding:3px 0 3px 12px;font:400 13px system-ui,sans-serif;color:#12151c">
          <span style="display:inline-block;min-width:92px;color:#6e7684;font-family:ui-monospace,monospace;font-size:12px">${escape(longDate(it.due))}</span>
          ${escape(it.task)}
          <span style="color:#6e7684">· ${escape(it.event)}</span>
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
      <div style="font:700 20px system-ui,sans-serif;color:#12151c;padding-top:2px">${includeCompleted ? 'Everything in EventOps' : 'This week in EventOps'}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${upcomingHtml}
        ${section('Overdue', overdue, '#d1372f')}
        ${section('Due within 7 days', soon, '#12151c')}
      </table>
      <div style="padding-top:22px">
        <a href="${escape(siteUrl)}" style="display:inline-block;background:#2f5fed;color:#ffffff;font:600 13px system-ui,sans-serif;text-decoration:none;padding:9px 14px;border-radius:6px">Open EventOps</a>
      </div>
      <div style="padding-top:16px;font:400 11px system-ui,sans-serif;color:#6e7684">
        Sent weekly to the ICC events committee. Manage who receives this in the Committee screen.
      </div>
    </td></tr>
  </table>
</body></html>`

  return { subject, text, html, counts: { overdue: overdue.length, soon: soon.length, upcoming: upcoming.length } }
}
