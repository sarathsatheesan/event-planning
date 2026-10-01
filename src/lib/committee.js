import { createContext, useContext } from 'react'

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
