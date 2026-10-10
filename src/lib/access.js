// Who may see which event.
//
// One function answers it everywhere, so the calendar, the query and (next)
// the security rules cannot disagree about what somebody is entitled to.
//
// Three sources, first match wins:
//   admin       — everything, all six committees
//   manager     — every event of a committee they run
//   participant — the events they personally have work on, whatever committee
//
// A volunteer is simply a member with nothing in `manages`: they fall through
// to the third test and see only what is theirs. That is the whole of
// row-level scoping, and it costs no extra machinery.

import { COMMITTEES, DEFAULT_COMMITTEE } from '../data/events.js'
import { committeeRoleOf } from './committee.js'

/** Everything. Local mode, signed-out visitors (who have only seed data), admins. */
export const EVERYTHING = Object.freeze({ kind: 'all' })
/** Signed in, but on no roster. */
export const NOTHING = Object.freeze({ kind: 'none' })

/**
 * `member` is the raw roster entry, not the trimmed one the person picker
 * uses — the role and the committee map are exactly what that one drops.
 */
export function scopeFor({ email, member, isAdmin }) {
  if (isAdmin) return EVERYTHING
  const who = String(email ?? '').trim().toLowerCase()
  if (!who || !member) return NOTHING
  return {
    kind: 'scoped',
    manages: COMMITTEES.map((c) => c.id).filter((id) => committeeRoleOf(member, id) === 'manager'),
    email: who,
  }
}

/**
 * Takes the event as the app reads it — committee already defaulted and
 * participants already merged in by applyOverrides — so this never has to
 * know where a field came from.
 */
export function canSeeEvent(event, scope) {
  if (scope?.kind === 'all') return true
  if (scope?.kind !== 'scoped') return false
  if (scope.manages.includes(event?.committee ?? DEFAULT_COMMITTEE)) return true
  return (event?.participants ?? []).includes(scope.email)
}

export function visibleEvents(events, scope) {
  if (scope?.kind === 'all') return events
  return events.filter((event) => canSeeEvent(event, scope))
}
