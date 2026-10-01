import { buildMessage, makeTransport } from './mailer.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)?.slice(0, 80)}`)
}

const digest = { subject: 'EventOps: 3 overdue', text: 'plain', html: '<p>rich</p>' }
const msg = buildMessage({
  from: 'ICC EventOps <utahindiacc@gmail.com>',
  inbox: 'utahindiacc@gmail.com',
  recipients: ['a@icc.org', 'b@icc.org', 'c@icc.org'],
  digest,
})

console.log('--- message shape ---')
check('subject carried through', msg.subject, digest.subject)
check('both bodies present', Boolean(msg.text && msg.html), true)
check('committee is bcc, not to', Array.isArray(msg.bcc) && msg.bcc.length === 3, true)
check('to is the ICC inbox only', msg.to, 'utahindiacc@gmail.com')
check('no recipient leaks into to', String(msg.to).includes('icc.org'), false)

console.log('\n--- transport ---')
const t = makeTransport({ user: 'u@example.com', pass: 'hunter2' })
const opts = t.options ?? {}
check('implicit TLS on 465', `${opts.host}:${opts.port} secure=${opts.secure}`, 'smtp.gmail.com:465 secure=true')
check('not port 25 (blocked outbound on GCP)', opts.port === 25, false)

// The password must not be reachable from anything we might log.
const serialised = JSON.stringify(msg)
check('password absent from the message', serialised.includes('hunter2'), false)
t.close()

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
