import { nextStatus } from '../data/events.js'
import { withAssignees } from '../data/assignees.js'

/**
 * Edits made from My work, where the row is all you have.
 *
 * My work flattens milestones and wrap-up follow-ups from every event into one
 * list. Changing one from there means finding its way back into the event it
 * came from — a different array depending on which kind of row it is. That
 * lookup lived twice in App.jsx, once per kind of edit, which is one copy too
 * many for something where getting the branch wrong writes the right value
 * into the wrong list.
 *
 * Both return a patch for `handleEventChange`, or `null` when there is nothing
 * to write. Null rather than an empty object on purpose: an empty patch still
 * costs a full document write, and `saveOverride` replaces rather than merges.
 */

/** Advance a row's status by one step. */
export function statusPatch(event, row) {
  if (!event || !row) return null
  if (row.kind === 'action') {
    const retro = event.retro
    if (!retro) return null
    const actions = retro.actions ?? []
    if (!actions.some((a) => a.id === row.itemId)) return null
    return {
      retro: {
        ...retro,
        actions: actions.map((a) =>
          a.id === row.itemId ? { ...a, status: nextStatus(a.status) } : a
        ),
      },
    }
  }
  const checklist = event.checklist ?? []
  if (!checklist.some((t) => t.id === row.itemId)) return null
  return {
    checklist: checklist.map((t) =>
      t.id === row.itemId ? { ...t, status: nextStatus(t.status) } : t
    ),
  }
}

/**
 * Set who owns a row.
 *
 * This is the one edit that does two jobs at once. The owners decide who the
 * Monday reminder reaches, and — since `participants` is recomputed from the
 * same owners on every save — who may open the event at all now that reads are
 * committee-scoped. Assigning somebody is what lets them see the thing they
 * have been assigned.
 */
export function ownersPatch(event, row, people) {
  if (!event || !row) return null
  const owners = withAssignees(people)
  if (row.kind === 'action') {
    const retro = event.retro
    if (!retro) return null
    const actions = retro.actions ?? []
    if (!actions.some((a) => a.id === row.itemId)) return null
    return {
      retro: {
        ...retro,
        actions: actions.map((a) => (a.id === row.itemId ? { ...a, ...owners } : a)),
      },
    }
  }
  const checklist = event.checklist ?? []
  if (!checklist.some((t) => t.id === row.itemId)) return null
  return {
    checklist: checklist.map((t) => (t.id === row.itemId ? { ...t, ...owners } : t)),
  }
}
