// Sending the digest, without Firebase Extensions.
//
// The Trigger Email extension was the obvious route — write a document, it
// sends — but Firebase Extensions shuts down on 31 March 2027. Installed
// extensions keep running after that, so it was not a cliff, but it would have
// meant adopting a dependency that can never be edited or reconfigured again.
// Google's own guidance is to use plain 2nd-gen functions. This is that, and
// it is about twenty lines.
//
// The SMTP password is a Secret Manager secret bound to the function at deploy
// time. It is never in this repository, never in an environment file, and
// never printed — including in the error paths below.

import nodemailer from 'nodemailer'

const HOST = 'smtp.gmail.com'
// 465 with implicit TLS. Not 25, which Google Cloud blocks outbound.
const PORT = 465

export function makeTransport({ user, pass }) {
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: true,
    auth: { user, pass },
  })
}

/**
 * Addressed to the ICC inbox with the committee bcc'd.
 *
 * Not a plain "to" with thirty addresses in it: that exposes everyone's
 * address to everyone and invites a reply-all thread on an automated message.
 * Replies land in the ICC inbox instead, which is where someone reads them.
 */
export function buildMessage({ from, inbox, recipients, digest }) {
  return {
    from,
    to: inbox,
    bcc: recipients,
    subject: digest.subject,
    text: digest.text,
    html: digest.html,
  }
}

/**
 * One person's own reminder: straight to them, nobody else on it.
 *
 * replyTo points at the ICC inbox rather than the sending address so that
 * "that's not mine" lands somewhere a human reads, not in an automation's
 * mailbox. No bcc — a personal list is personal, and seeing a hidden copy go
 * somewhere else is how people stop trusting a reminder.
 */
export function buildPersonalMessage({ from, inbox, to, digest }) {
  return {
    from,
    to,
    replyTo: inbox,
    subject: digest.subject,
    text: digest.text,
    html: digest.html,
  }
}
