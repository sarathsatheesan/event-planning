import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import { events as seedEvents, deriveStatus } from './seed/events.js'
import { applyOverrides } from './seed/storage.js'
import { buildDigest } from './digest.js'
import { makeTransport, buildMessage } from './mailer.js'

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
 * Builds and sends the digest. Shared by the Monday schedule and the manual
 * send, so the email somebody pushes out by hand is byte-for-byte the one they
 * would have received anyway — no second code path to drift.
 */
async function deliverDigest({ includeCompleted = false, trigger }) {
  const roster = await readRoster()
  const recipients = (roster?.emails ?? [])
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean)

  if (recipients.length === 0) {
    // Guessing a recipient list from source would mean emailing people the
    // committee may already have removed.
    logger.warn('No committee roster — nothing sent.', { trigger })
    return { sent: false, reason: 'no-roster', recipients: 0 }
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
    await deliverDigest({ trigger: 'schedule' })
  }
)

/**
 * Send one now. Admins only — the roster decides, exactly as the security
 * rules do, because this spends the committee's attention and the ICC's
 * sending reputation.
 */
export const sendDigestNow = onCall(
  { region: REGION, secrets: [SMTP_PASSWORD] },
  async (request) => {
    const email = request.auth?.token?.email?.toLowerCase()
    const verified = request.auth?.token?.email_verified === true
    if (!email || !verified) {
      throw new HttpsError('unauthenticated', 'Sign in first.')
    }

    const roster = await readRoster()
    const admins = (roster?.admins ?? []).map((e) => String(e).toLowerCase())
    const isAdmin = BOOTSTRAP_ADMINS.includes(email) || admins.includes(email)
    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'Only committee admins can send the digest.')
    }

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
