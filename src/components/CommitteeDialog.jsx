import { useEffect, useState } from 'react'
import { FALLBACK_COMMITTEE, BOOTSTRAP_ADMINS } from '../lib/firebaseConfig.js'

/**
 * Who can edit, managed in the app.
 *
 * This list used to live in three source files and took two deploys and a push
 * to change. It is now one Firestore document that the security rules read, so
 * adding an organiser is an administrative act rather than a developer task.
 *
 * Two safeguards worth knowing. The permanent owners cannot be removed here —
 * the rules let them in regardless, so removing them would only make this
 * screen lie. And the list cannot be saved without an admin on it, because the
 * document that decides who may edit the list is itself governed by the list.
 */

const FIELD =
  'focus-ring w-full rounded-md border border-border bg-paper px-2 py-1 text-sm text-ink placeholder:text-ink-soft/60'
const MINI =
  'focus-ring rounded-md border border-border px-2 py-1 text-xs font-semibold text-ink-soft transition disabled:cursor-not-allowed disabled:opacity-40'

const BOOTSTRAP = BOOTSTRAP_ADMINS.map((e) => e.toLowerCase())
const isPermanent = (email) => BOOTSTRAP.includes(email.trim().toLowerCase())

function seedFrom(roster) {
  if (roster?.members?.length) {
    return roster.members.map((m) => ({
      email: m.email ?? '',
      name: m.name ?? '',
      role: m.role === 'admin' ? 'admin' : 'member',
    }))
  }
  // No roster saved yet: show what the rules are currently honouring, so the
  // first save is a confirmation rather than a blank slate.
  const source = roster?.emails?.length ? roster : FALLBACK_COMMITTEE
  return source.emails.map((email) => ({
    email,
    name: '',
    role: (source.admins ?? []).map((e) => e.toLowerCase()).includes(email.toLowerCase())
      ? 'admin'
      : 'member',
  }))
}

export default function CommitteeDialog({ roster, currentEmail, busy, onSave, onClose }) {
  const [members, setMembers] = useState(() => seedFrom(roster))
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  function setRow(i, patch) {
    setMembers((list) => list.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  }

  const filled = members.filter((m) => m.email.trim())
  const admins = filled.filter((m) => m.role === 'admin')
  const losingSelf =
    currentEmail &&
    !filled.some((m) => m.email.trim().toLowerCase() === currentEmail.toLowerCase())

  function handleSubmit(e) {
    e.preventDefault()
    const emails = filled.map((m) => m.email.trim().toLowerCase())

    const malformed = emails.find((e2) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e2))
    if (malformed) {
      setError(`"${malformed}" is not an email address.`)
      return
    }
    if (new Set(emails).size !== emails.length) {
      setError('The same address is listed twice.')
      return
    }
    if (admins.length === 0) {
      setError('Keep at least one admin, or nobody can change this list again.')
      return
    }

    onSave({
      emails,
      admins: admins.map((m) => m.email.trim().toLowerCase()),
      members: filled.map((m) => ({
        email: m.email.trim().toLowerCase(),
        name: m.name.trim(),
        role: m.role,
      })),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8"
      onClick={() => !busy && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Manage the committee"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 className="font-display text-lg font-bold text-ink">Committee</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Everyone listed here can edit events. Admins can also change this list. Sign-in is by
          Google or an emailed link — the address has to match exactly.
        </p>

        <ul className="mt-4 flex flex-col gap-1.5">
          {members.map((m, i) => {
            const locked = isPermanent(m.email)
            return (
              <li
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border-soft bg-paper p-2"
              >
                <input
                  type="email"
                  value={m.email}
                  onChange={(e) => setRow(i, { email: e.target.value })}
                  placeholder="name@example.org"
                  aria-label={`Member ${i + 1} email`}
                  disabled={locked}
                  className={`${FIELD} min-w-56 flex-1 bg-surface disabled:opacity-70`}
                />
                <input
                  value={m.name}
                  onChange={(e) => setRow(i, { name: e.target.value })}
                  placeholder="Name (optional)"
                  aria-label={`Member ${i + 1} name`}
                  className={`${FIELD} w-40 bg-surface`}
                />
                <select
                  value={m.role}
                  onChange={(e) => setRow(i, { role: e.target.value })}
                  aria-label={`Member ${i + 1} role`}
                  disabled={locked}
                  className="focus-ring rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-ink disabled:opacity-70"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                {locked ? (
                  <span
                    title="Permanent owner — the security rules always allow this address"
                    className="px-1 text-[10px] font-bold uppercase tracking-wide text-ink-soft"
                  >
                    Owner
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMembers((list) => list.filter((_, j) => j !== i))}
                    title="Remove this member"
                    className="focus-ring rounded-md px-1.5 py-0.5 text-sm text-ink-soft transition hover:bg-critical-soft hover:text-critical"
                  >
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">Remove {m.email || `member ${i + 1}`}</span>
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          onClick={() => setMembers((list) => [...list, { email: '', name: '', role: 'member' }])}
          className={`${MINI} mt-2`}
        >
          + Add member
        </button>

        {losingSelf && (
          <p className="mt-3 text-xs font-medium text-warning">
            You are removing your own access. You will not be able to edit events, or reopen this
            screen, after saving.
          </p>
        )}
        {error && <p className="mt-3 text-xs font-medium text-critical">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            {filled.length} member{filled.length === 1 ? '' : 's'} · {admins.length} admin
            {admins.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="focus-ring rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="focus-ring rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save committee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
