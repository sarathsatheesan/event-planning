import { createContext, useContext } from 'react'
import { COMMITTEES } from '../data/events.js'

/**
 * The committee roster, available anywhere a person needs to be chosen.
 *
 * Assignees used to be free text, which is why every overdue milestone in the
 * weekly digest read "Unassigned": a name typed into a box has no identity
 * behind it and no address to write to. Picking from the roster gives the task
 * an email, which is what makes a personal reminder possible at all.
 */
const CommitteeContext = createContext([])

export const CommitteeProvider = CommitteeContext.Provider

/** [{ email, name, label }], sorted by how they will read in a dropdown. */
export function useCommittee() {
  return useContext(CommitteeContext)
}

export function toMembers(roster) {
  const rows = roster?.members?.length
    ? roster.members
    : (roster?.emails ?? []).map((email) => ({ email, name: '' }))
  return rows
    .filter((m) => m?.email)
    .map((m) => ({
      email: String(m.email).toLowerCase(),
      name: (m.name ?? '').trim(),
      label: (m.name ?? '').trim() || String(m.email),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Which committees a member belongs to, as a list of ids.
 *
 * An admin is in all of them. Derived here rather than written into the stored
 * array on purpose, and the difference shows up twice: add a seventh committee
 * and every admin is in it the same day, with nothing to re-save; demote an
 * admin back to member and their own tags come back, instead of leaving them
 * sitting in all six because that is what got stored while they were an admin.
 *
 * Tolerant of two shapes for everyone else. Today the dialog saves an array,
 * which is what Firestore's array-contains can query. If per-committee roles
 * arrive later they will want a map ({ kitchen: 'manager' }), and a reader that
 * already accepts both means that change does not have to be a migration.
 * Anything else — absent, null, a stray string — reads as no committees, which
 * is the correct answer until an admin says otherwise.
 */
export function committeeIdsOf(member) {
  if (member?.role === 'admin') return COMMITTEES.map((c) => c.id)
  return storedCommitteesOf(member)
}

/**
 * The ids actually written on this member, admin rule not applied.
 *
 * Only the roster editor wants this. It seeds its rows from here so that an
 * admin's own selection survives being an admin: the chips render on and
 * locked from `committeeIdsOf`, but what gets saved is still what they picked,
 * ready for the day they are made an ordinary member again.
 */
/**
 * What this person is to one committee: 'manager', 'volunteer', or null.
 *
 * Manager runs the committee's work; volunteer does the part given to them.
 * An admin manages all of them, which is the whole point of the distinction —
 * before it existed, the only way to let someone run their own committee was
 * to make them an admin, and an admin can also rewrite the roster and read
 * every other committee's work.
 *
 * The older array shape carries no role, so it reads as volunteer: the lesser
 * of the two, which is the safe direction for a field that decides what
 * somebody can see.
 */
export function committeeRoleOf(member, committeeId) {
  if (member?.role === 'admin') return 'manager'
  return storedRoleOf(member, committeeId)
}

/**
 * The role actually written on this member, admin rule not applied.
 *
 * The roster editor seeds its rows from here, for the same reason it seeds
 * ids from storedCommitteesOf: reading the derived role would quietly rewrite
 * an admin's own volunteer committees as manager and save them that way, and
 * the mistake would only show the day somebody is demoted.
 */
export function storedRoleOf(member, committeeId) {
  const raw = member?.committees
  if (Array.isArray(raw)) return raw.includes(committeeId) ? 'volunteer' : null
  if (raw && typeof raw === 'object') {
    const value = raw[committeeId]
    if (!value) return null
    return value === 'manager' ? 'manager' : 'volunteer'
  }
  return null
}

export function storedCommitteesOf(member) {
  const raw = member?.committees
  if (Array.isArray(raw)) return raw.filter((id) => typeof id === 'string' && id)
  if (raw && typeof raw === 'object') return Object.keys(raw).filter((id) => raw[id])
  return []
}
