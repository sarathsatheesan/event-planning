import { isFirebaseConfigured } from '../lib/firebaseConfig.js'

/**
 * Says who you are and whether your edits are going anywhere other people can
 * see. Ambiguity here is the expensive kind — someone assigning tasks to the
 * committee needs to know their work is actually shared.
 */
export default function AuthBar({ user, allowed, busy, onSignIn, onSignOut }) {
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

  const state = !user ? 'signedOut' : allowed ? 'editor' : 'viewer'
  const tone = {
    signedOut: 'text-ink-soft',
    editor: 'text-success',
    viewer: 'text-warning',
  }[state]

  return (
    <div className="border-b border-border-soft bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 sm:px-8">
        <p className={`text-xs ${tone}`}>
          {state === 'signedOut' && (
            <>
              <span className="font-semibold">Not signed in.</span> Edits stay in this browser until
              you sign in.
            </>
          )}
          {state === 'editor' && (
            <>
              <span className="font-semibold">Signed in as {user.email}.</span> Changes save for the
              whole committee.
            </>
          )}
          {state === 'viewer' && (
            <>
              <span className="font-semibold">{user.email} is not on the committee list.</span>{' '}
              Edits stay in this browser and are not shared.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={user ? onSignOut : onSignIn}
          disabled={busy}
          className="focus-ring shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy ? 'Working…' : user ? 'Sign out' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  )
}
