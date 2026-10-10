// Who owns a milestone, a run-of-show item or a wrap-up follow-up.
//
// One owner was the original shape: `assignee` holding a name, and
// `assigneeEmail` holding the address the roster picker stored beside it —
// which is what makes a personal reminder possible at all. Some work has more
// than one owner, so `assignees` is a list of { name, email } and is now the
// authoritative field.
//
// The two scalars are kept in step with the first entry rather than dropped.
// Hosting deploys itself on push and functions never do, so there is always a
// window where a new client is writing records that an old digest has to read;
// mirroring means that window costs the second and third owner a reminder
// instead of costing the first one too. Once functions are redeployed the
// mirror is dead weight — there is an open item in HANDOFF.md to remove it.
//
// This lives in src/data rather than src/lib because copy-seed.mjs stages this
// directory into functions/ on every deploy and the digest needs the same
// definition the app uses. One definition, not two that drift.

/** Everyone on an item, oldest shape or newest. Empty when nobody owns it. */
export function assigneesOf(item) {
  const list = item?.assignees
  if (Array.isArray(list)) {
    return list
      .map((a) => ({ name: (a?.name ?? '').trim(), email: a?.email ?? null }))
      .filter((a) => a.name || a.email)
  }
  const name = (item?.assignee ?? '').trim()
  const email = item?.assigneeEmail ?? null
  return name || email ? [{ name, email }] : []
}

/** Display names, in order. An address stands in for a missing name. */
export function assigneeNames(item) {
  return assigneesOf(item)
    .map((a) => a.name || a.email)
    .filter(Boolean)
}

/**
 * The patch to write when an item's owners change.
 *
 * Always returns all three fields, so clearing the last owner clears the
 * mirror too rather than leaving a stale name behind on a task nobody owns.
 */
export function withAssignees(people) {
  const clean = (people ?? [])
    .map((a) => ({ name: (a?.name ?? '').trim(), email: a?.email ?? null }))
    .filter((a) => a.name || a.email)
  return {
    assignees: clean,
    assignee: clean[0]?.name ?? '',
    assigneeEmail: clean[0]?.email ?? null,
  }
}
