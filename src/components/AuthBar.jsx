import { useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebaseConfig.js'

/**
 * Says who you are and whether your edits are going anywhere other people can
 * see. Ambiguity here is the expensive kind — someone assigning tasks to the
 * committee needs to know their work is actually shared.
 *
 * Two ways in. Google sign-in for the people who have a Google account, and a
 * mailed one-time link for the people who don't (a shared org mailbox usually
 * isn't a Google account). Either way you end up at the same allowlist check.
 */

const BTN =
  'focus-ring shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent disabled:opacity-50'

function Bar({ tone = 'text-ink-soft', message, actions }) {
  return (
    <div className="border-b border-border-soft bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 sm:px-8">
        <p className={`text-xs ${tone}`}>{message}</p>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
      </div>
    </div>
  )
}

function EmailForm({ submitLabel, initial = '', busy, onSubmit, onCancel }) {
  const [email, setEmail] = useState(initial)
  return (
    <form
      className="flex flex-wrap items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = email.trim()
        if (trimmed) onSubmit(trimmed)
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.org"
        aria-label="Email address"
        className="focus-ring w-56 rounded-md border border-border bg-paper px-2 py-1 text-xs text-ink"
      />
      <button type="submit" disabled={busy} className={BTN}>
        {busy ? 'Working…' : submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className={BTN}>
          Cancel
        </button>
      )}
    </form>
  )
}

export default function AuthBar({
  user,
  allowed,
  busy,
  onSignIn,
  onSignOut,
  onSendLink,
  onConfirmEmail,
  linkSentTo,
  needsEmailConfirm,
  onManageCommittee,
}) {
  const [typingEmail, setTypingEmail] = useState(false)

  if (!isFirebaseConfigured) {
    return (
      <div className="border-b border-border-soft bg-surface">
        <p className="mx-auto max-w-6xl px-5 py-2 text-xs text-ink-soft sm:px-8">
          <span className="font-semibold text-ink">Local mode.</span> Edits are saved in this
          browser only and are not shared with anyone else.
        </p>
      </div>
    )
  }

  // The link was opened somewhere that never made the request — a different
  // browser, or private browsing — so the address it was sent to is unknown.
  // Firebase requires it back as proof the link was not intercepted.
  if (!user && needsEmailConfirm) {
    return (
      <Bar
        tone="text-warning"
        message={
          <>
            <span className="font-semibold">Almost there.</span> Confirm the address this sign-in
            link was sent to.
          </>
        }
        actions={<EmailForm submitLabel="Finish signing in" busy={busy} onSubmit={onConfirmEmail} />}
      />
    )
  }

  if (user) {
    const editor = allowed
    return (
      <Bar
        tone={editor ? 'text-success' : 'text-warning'}
        message={
          editor ? (
            <>
              <span className="font-semibold">Signed in as {user.email}.</span> Changes save for the
              whole committee.
            </>
          ) : (
            <>
              <span className="font-semibold">{user.email} is not on the committee list.</span>{' '}
              Read-only — ask an organiser to add you.
            </>
          )
        }
        actions={
          <>
            {onManageCommittee && (
              <button type="button" onClick={onManageCommittee} className={BTN}>
                Committee
              </button>
            )}
            <button type="button" onClick={onSignOut} disabled={busy} className={BTN}>
              {busy ? 'Working…' : 'Sign out'}
            </button>
          </>
        }
      />
    )
  }

  if (typingEmail) {
    return (
      <Bar
        message={
          <>
            <span className="font-semibold">Sign in by email.</span> We&rsquo;ll send a one-time
            link — no password to remember.
          </>
        }
        actions={
          <EmailForm
            submitLabel="Send link"
            initial={linkSentTo ?? ''}
            busy={busy}
            onSubmit={(email) => {
              setTypingEmail(false)
              onSendLink(email)
            }}
            onCancel={() => setTypingEmail(false)}
          />
        }
      />
    )
  }

  if (linkSentTo) {
    return (
      <Bar
        message={
          <>
            <span className="font-semibold">Link sent to {linkSentTo}.</span> Open it on this device
            to finish signing in.
          </>
        }
        actions={
          <button type="button" onClick={() => setTypingEmail(true)} className={BTN}>
            Use a different address
          </button>
        }
      />
    )
  }

  return (
    <Bar
      message={
        <>
          <span className="font-semibold">Not signed in.</span> Showing the original plan, read-only
          — sign in to see the committee&rsquo;s current version and edit it.
        </>
      }
      actions={
        <>
          <button type="button" onClick={onSignIn} disabled={busy} className={BTN}>
            {busy ? 'Working…' : 'Sign in with Google'}
          </button>
          <button type="button" onClick={() => setTypingEmail(true)} className={BTN}>
            Email me a link
          </button>
        </>
      }
    />
  )
}
