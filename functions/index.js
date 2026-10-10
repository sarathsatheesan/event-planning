import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import { events as seedEvents, deriveStatus } from './seed/events.js'
import { applyOverrides } from './seed/storage.js'
import { buildDigest, previewReminders } from './digest.js'
import { makeTransport, buildMessage, buildPersonalMessage } from './mailer.js'

initializeApp()
const db = getFirestore()

// Set once with: firebase functions:secrets:set SMTP_PASSWORD
// It is a Gmail app password, not the account password, and it lives in
// Secret Manager — nobody has to paste it into a config file or a chat.
const SMTP_PASSWORD = defineSecret('SMTP_PASSWORD')
const SMTP_USER = defineString('SMTP_USER', { default: 'utahindiacc@gmail.com' })
const MAIL_FROM = defineString('MAIL_FROM', {
  default: 'ICC EventOps <utahindiacc@gmail.com>',
})

const REGION = 'us-central1'
// Mirrors bootstrapAdmins() in firestore.rules.
const BOOTSTRAP_ADMINS = ['utahindiacc@gmail.com']
// A stuck finger should not email the committee four times.
const ADHOC_COOLDOWN_MS = 2 * 60 * 1000

async function readRoster() {
  const snap = await db.doc('config/committee').get()
  return snap.exists ? snap.data() : null
}

/** Every event the app would show, with status derived the same way. */
async function readEvents() {
  const snap = await db.collection('eventOverrides').get()
  const overrides = {}
  snap.forEach((doc) => {
    overrides[doc.id] = doc.data()
  })
  const now = new Date()
  return applyOverrides(seedEvents, overrides).map((event) => ({
    ...event,
    status: deriveStatus(event.date, event.endDate, now),
  }))
}

/**
 * [{ email, name }] — the same shape, and the same fallback, as toMembers() in
 * the app. A roster written before names were collected has `emails` only, and
 * those members still need reminding; they just get no first name on it.
 */
function rosterMembers(roster) {
  const rows = roster?.members?.length
    ? roster.members
    : (roster?.emails ?? []).map((email) => ({ email, name: '' }))
  return rows
    .filter((m) => m?.email)
    .map((m) => ({
      email: String(m.email).trim().toLowerCase(),
      name: (m.name ?? '').trim(),
    }))
    .filter((m) => m.email)
}

function adminsOf(roster) {
  const listed = (roster?.admins ?? []).map((e) => String(e).trim().toLowerCase())
  const known = new Set(rosterMembers(roster).map((m) => m.email))
  // A bootstrap admin who is not on the roster still gets the overview — that
  // address is how the committee list gets repaired when it is wrong.
  return [...new Set([...listed, ...BOOTSTRAP_ADMINS])].filter(
    (e) => e && (known.has(e) || BOOTSTRAP_ADMINS.includes(e))
  )
}

/**
 * The caller must be a verified, signed-in committee admin. Returns the roster
 * it had to read anyway, so the caller does not read it twice.
 */
async function requireAdmin(request, action) {
  const email = request.auth?.token?.email?.toLowerCase()
  const verified = request.auth?.token?.email_verified === true
  if (!email || !verified) {
    throw new HttpsError('unauthenticated', 'Sign in first.')
  }
  const roster = await readRoster()
  const admins = (roster?.admins ?? []).map((e) => String(e).toLowerCase())
  if (!BOOTSTRAP_ADMINS.includes(email) && !admins.includes(email)) {
    throw new HttpsError('permission-denied', `Only committee admins can ${action}.`)
  }
  return roster
}

/**
 * Builds and sends the committee-wide overview. Shared by the manual send and
 * by the Monday run's admin copy, so the email somebody pushes out by hand is
 * byte-for-byte the one they would have received anyway — no second code path
 * to drift.
 */
async function deliverDigest({ includeCompleted = false, trigger, only = null }) {
  const roster = await readRoster()
  const onRoster = (roster?.emails ?? [])
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean)

  if (onRoster.length === 0) {
    // Guessing a recipient list from source would mean emailing people the
    // committee may already have removed.
    logger.warn('No committee roster — nothing sent.', { trigger })
    return { sent: false, reason: 'no-roster', recipients: 0 }
  }

  // The caller may ask for a subset, never for an address that is not on the
  // roster. This is an admin-only button, but it is an admin-only button on a
  // public endpoint: taking the browser's list at face value would turn it
  // into a way to send mail from the committee's address to anybody at all.
  // So the roster is the source and the request is only a filter over it.
  const asked = Array.isArray(only)
    ? [...new Set(only.map((e) => String(e ?? '').trim().toLowerCase()).filter(Boolean))]
    : null
  const recipients = asked ? onRoster.filter((e) => asked.includes(e)) : onRoster
  if (recipients.length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'Choose at least one committee member to send this to.'
    )
  }

  const digest = buildDigest({ events: await readEvents(), today: new Date(), includeCompleted })
  if (!digest) {
    // A weekly email that says "nothing to report" teaches people to ignore
    // it, and the one week it matters they will.
    logger.info('Nothing to report — not sending.', { trigger })
    return { sent: false, reason: 'nothing-to-report', recipients: recipients.length }
  }

  const transport = makeTransport({ user: SMTP_USER.value(), pass: SMTP_PASSWORD.value() })
  try {
    await transport.sendMail(
      buildMessage({
        from: MAIL_FROM.value(),
        inbox: SMTP_USER.value(),
        recipients,
        digest,
      })
    )
  } catch (err) {
    // Deliberately logging only the reason, never the message or transport:
    // either would put the password into Cloud Logging.
    logger.error('Digest send failed', { trigger, reason: err?.message ?? 'unknown' })
    throw err
  } finally {
    transport.close()
  }

  logger.info('Digest sent', { trigger, recipients: recipients.length, ...digest.counts })
  return { sent: true, recipients: recipients.length, subject: digest.subject, ...digest.counts }
}

/**
 * The Monday run: everybody gets their own list, admins also get the whole
 * picture.
 *
 * The old behaviour mailed the identical committee-wide list to all thirteen
 * people, which made every reminder somebody else's problem — thirty-one
 * overdue milestones read as organisational background noise rather than as
 * four things you personally owe. A list addressed to one person is a list that
 * person can finish. Admins still need the overview, because spotting what
 * nobody owns is their job and it appears on no individual's list.
 *
 * Members with nothing due get no email at all. That is the point: silence has
 * to mean something, or the reminder that matters gets filed with the rest.
 */
async function deliverPersonalDigests({ trigger }) {
  const roster = await readRoster()
  const members = rosterMembers(roster)
  if (members.length === 0) {
    logger.warn('No committee roster — nothing sent.', { trigger })
    return { sent: 0, failed: 0, reason: 'no-roster' }
  }

  const events = await readEvents()
  const today = new Date()

  const personal = members
    .map((member) => ({ member, digest: buildDigest({ events, today, forPerson: member }) }))
    .filter((row) => row.digest)

  const admins = adminsOf(roster)
  const overview = admins.length > 0 ? buildDigest({ events, today }) : null

  if (personal.length === 0 && !overview) {
    logger.info('Nothing to report — not sending.', { trigger, members: members.length })
    return { sent: 0, failed: 0, reason: 'nothing-to-report' }
  }

  const from = MAIL_FROM.value()
  const inbox = SMTP_USER.value()
  const transport = makeTransport({ user: inbox, pass: SMTP_PASSWORD.value() })

  let sent = 0
  let failed = 0
  // Only the reason, never the message or the transport: either would put the
  // password into Cloud Logging.
  const attempt = async (message, who) => {
    try {
      await transport.sendMail(message)
      sent++
    } catch (err) {
      failed++
      logger.error('Reminder send failed', { trigger, to: who, reason: err?.message ?? 'unknown' })
    }
  }

  try {
    // Sequential, on one connection. Thirteen messages is nothing to Gmail, and
    // a burst of parallel authentications is what gets a sender throttled.
    for (const { member, digest } of personal) {
      await attempt(buildPersonalMessage({ from, inbox, to: member.email, digest }), member.email)
    }
    if (overview) {
      await attempt(
        buildMessage({ from, inbox, recipients: admins, digest: overview }),
        `admins(${admins.length})`
      )
    }
  } finally {
    transport.close()
  }

  // Throw only when nothing at all got out — that is an auth or network fault
  // worth retrying. Retrying a partial run would re-send to everyone who
  // already received theirs, and a duplicate reminder costs more trust than a
  // missed one.
  if (sent === 0 && failed > 0) {
    throw new Error(`All ${failed} reminder sends failed`)
  }

  logger.info('Reminders sent', {
    trigger,
    personal: personal.length,
    overviewTo: overview ? admins.length : 0,
    sent,
    failed,
    silent: members.length - personal.length,
  })
  return { sent, failed, personal: personal.length, admins: overview ? admins.length : 0 }
}

/**
 * Monday morning rather than Friday: the week's work is still ahead of the
 * people reading it. Mountain time, because that is where the committee is —
 * a UTC schedule would land on Sunday evening for half the year.
 */
export const weeklyDigest = onSchedule(
  {
    schedule: '0 8 * * 1',
    timeZone: 'America/Denver',
    region: REGION,
    retryCount: 2,
    secrets: [SMTP_PASSWORD],
  },
  async () => {
    await deliverPersonalDigests({ trigger: 'schedule' })
  }
)

/**
 * Send one now. Admins only — the roster decides, exactly as the security
 * rules do, because this spends the committee's attention and the ICC's
 * sending reputation.
 *
 * Still the committee-wide overview, not the personal split: this is the button
 * for "everyone look at this", and the weekly run is what addresses people
 * individually.
 */
export const sendDigestNow = onCall(
  { region: REGION, secrets: [SMTP_PASSWORD] },
  async (request) => {
    await requireAdmin(request, 'send the digest')
    const email = request.auth.token.email.toLowerCase()

    const logRef = db.doc('config/digestLog')
    const last = (await logRef.get()).data()?.lastAdhocAt?.toMillis?.() ?? 0
    const waitMs = ADHOC_COOLDOWN_MS - (Date.now() - last)
    if (waitMs > 0) {
      throw new HttpsError(
        'resource-exhausted',
        `A digest was just sent. Try again in ${Math.ceil(waitMs / 1000)} seconds.`
      )
    }

    const result = await deliverDigest({
      includeCompleted: request.data?.scope === 'all',
      trigger: `manual:${email}`,
      only: Array.isArray(request.data?.to) ? request.data.to : null,
    })

    if (result.sent) {
      await logRef.set(
        { lastAdhocAt: FieldValue.serverTimestamp(), lastAdhocBy: email },
        { merge: true }
      )
    }
    return result
  }
)

/**
 * What Monday would send, without sending it.
 *
 * Deliberately binds **no secret**: this function has no SMTP password, so it
 * cannot email anyone even if it were wrong. A dry run that could send is not a
 * dry run.
 *
 * Reads live Firestore data, so it answers the question the test suite cannot —
 * the suite runs against the immutable seed, while the owners people actually
 * assign live in `eventOverrides`.
 */
export const previewMondayReminders = onCall({ region: REGION }, async (request) => {
  const roster = await requireAdmin(request, 'preview the reminders')
  return previewReminders({
    events: await readEvents(),
    today: new Date(),
    members: rosterMembers(roster),
    admins: adminsOf(roster),
  })
})
