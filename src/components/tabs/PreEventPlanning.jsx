import { useMemo, useState } from 'react'
import { taskStatusTone } from '../../data/events.js'
import { realignDueDates, shiftDate, ANCHOR_ORDER, ANCHOR_DAYS } from '../../data/template.js'
import StatusPill from '../StatusPill.jsx'
import { InlineField, InlineSelect, RemoveButton, AddButton } from '../fields.jsx'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'

const STATUS_CYCLE = ['Not Started', 'In Progress', 'Blocked', 'Done']
const UNASSIGNED = '__unassigned__'

export default function PreEventPlanning({ event, onChecklistChange }) {
  const editable = useEditable()
  const tasks = event.checklist
  const [category, setCategory] = useState('All')
  const [owner, setOwner] = useState('All')

  // Owners come from the data, not a fixed roster — whoever has been typed
  // into an assignee field shows up here.
  const owners = useMemo(() => {
    const names = new Set()
    let hasUnassigned = false
    for (const t of tasks) {
      const name = (t.assignee ?? '').trim()
      if (name && name.toLowerCase() !== 'unassigned') names.add(name)
      else hasUnassigned = true
    }
    return { names: [...names].sort((a, b) => a.localeCompare(b)), hasUnassigned }
  }, [tasks])

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (category !== 'All' && t.category !== category) return false
        if (owner === 'All') return true
        const name = (t.assignee ?? '').trim()
        const isUnassigned = !name || name.toLowerCase() === 'unassigned'
        return owner === UNASSIGNED ? isUnassigned : name === owner
      }),
    [tasks, category, owner]
  )

  const grouped = useMemo(() => {
    const map = new Map()
    for (const anchor of ANCHOR_ORDER) map.set(anchor, [])
    for (const t of filtered) {
      if (!map.has(t.anchor)) map.set(t.anchor, [])
      map.get(t.anchor).push(t)
    }
    return [...map.entries()].filter(([, items]) => items.length > 0)
  }, [filtered])

  function patchTask(id, patch) {
    onChecklistChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function addTask(anchor) {
    const days = ANCHOR_DAYS[anchor] ?? 30
    onChecklistChange([
      ...tasks,
      {
        id: nextId(tasks),
        task: '',
        // Inherit the active category filter, so a new row stays visible.
        category: category !== 'All' ? category : (event.categories[0] ?? 'Venue'),
        anchor,
        assignee: owner !== 'All' && owner !== UNASSIGNED ? owner : '',
        due: shiftDate(event.date, days),
        status: 'Not Started',
      },
    ])
  }

  // Moving a milestone between phases is a rescheduling decision, so the due
  // date follows the new anchor rather than being left stale.
  function moveTask(id, anchor) {
    const days = ANCHOR_DAYS[anchor]
    patchTask(id, days == null ? { anchor } : { anchor, due: shiftDate(event.date, days) })
  }

  function removeTask(id) {
    onChecklistChange(tasks.filter((t) => t.id !== id), 'Milestone removed.')
  }

  function cycleStatus(id) {
    const t = tasks.find((x) => x.id === id)
    const idx = STATUS_CYCLE.indexOf(t.status)
    patchTask(id, { status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] })
  }

  const doneCount = tasks.filter((t) => t.status === 'Done').length

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">No milestones yet</p>
        <p className="max-w-md text-sm text-ink-soft">
          {event.name} has a date but no plan behind it.
        </p>
        <div className="mt-2 w-64">
          <AddButton onClick={() => addTask('T-30')}>Add the first milestone</AddButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {['All', ...event.categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`focus-ring rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  category === c
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border text-ink-soft hover:border-ink-soft'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="whitespace-nowrap text-xs text-ink-soft">
            <span className="tabular font-semibold text-ink">{doneCount}</span>
            <span className="tabular"> / {tasks.length}</span> milestones complete
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Owner
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="focus-ring rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-ink"
            >
              <option value="All">Everyone</option>
              {owners.names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              {owners.hasUnassigned && <option value={UNASSIGNED}>Unassigned</option>}
            </select>
          </label>

          {/* Due dates hang off the event date. If the event moves, this
              re-spaces them without touching any other edit. */}
          {editable && (
            <button
              type="button"
              onClick={() => onChecklistChange(realignDueDates(tasks, event.date))}
              title="Recalculate every due date from the event date, keeping your other edits"
              className="focus-ring rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
            >
              Realign due dates
            </button>
          )}

          <p className="text-xs text-ink-soft">
            {filtered.length !== tasks.length
              ? `Showing ${filtered.length} of ${tasks.length}.`
              : editable
              ? 'Click any field to edit it.'
              : 'Sign in as a committee member to make changes.'}
          </p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
          No milestones match this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([anchor, items]) => (
            <section key={anchor}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink">{anchor}</h3>
                <span className="text-xs text-ink-soft">
                  {anchor === 'T-90'
                    ? 'lead-time milestones'
                    : anchor === 'T-1'
                    ? 'final day-before checks'
                    : 'days out'}
                </span>
              </div>
              <ul className="overflow-hidden rounded-lg border border-border">
                {items.map((t, i) => (
                  <li
                    key={t.id}
                    className={`flex flex-col gap-1 bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
                      i !== items.length - 1 ? 'border-b border-border-soft' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <InlineField
                        value={t.task}
                        onChange={(v) => patchTask(t.id, { task: v })}
                        placeholder="Describe the milestone"
                        className="w-full text-sm font-medium text-ink"
                      />
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-1 pl-1.5 text-xs text-ink-soft">
                        <InlineSelect
                          value={t.category}
                          onChange={(v) => patchTask(t.id, { category: v })}
                          options={event.categories}
                          ariaLabel="Category"
                          className="text-xs text-ink-soft"
                        />
                        <span aria-hidden="true">·</span>
                        <InlineField
                          value={t.assignee}
                          onChange={(v) => patchTask(t.id, { assignee: v })}
                          placeholder="Unassigned"
                          className="w-28 text-xs text-ink-soft"
                        />
                        <span aria-hidden="true">·</span>
                        <span>due</span>
                        <InlineField
                          type="date"
                          value={t.due}
                          onChange={(v) => v && patchTask(t.id, { due: v })}
                          className="font-mono text-xs text-ink-soft"
                        />
                        <span aria-hidden="true">·</span>
                        <InlineSelect
                          value={t.anchor}
                          onChange={(v) => moveTask(t.id, v)}
                          options={ANCHOR_ORDER}
                          ariaLabel="Move to phase"
                          className="font-mono text-xs text-ink-soft"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                      {editable ? (
                        <button
                          type="button"
                          onClick={() => cycleStatus(t.id)}
                          className="focus-ring rounded-full"
                        >
                          <StatusPill label={t.status} tone={taskStatusTone[t.status]} />
                        </button>
                      ) : (
                        <StatusPill label={t.status} tone={taskStatusTone[t.status]} />
                      )}
                      <RemoveButton onClick={() => removeTask(t.id)} title="Remove this milestone" />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <AddButton onClick={() => addTask(anchor)}>Add a {anchor} milestone</AddButton>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
