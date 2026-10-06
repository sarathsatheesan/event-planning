import { InlineField, NumberField, PersonField, RemoveButton, AddButton } from '../fields.jsx'
import KanbanBoard, { ViewToggle } from '../KanbanBoard.jsx'
import StatusPill from '../StatusPill.jsx'
import { taskStatusTone } from '../../data/events.js'
import { nextId } from '../../lib/records.js'
import { useEditable } from '../../lib/editing.js'

const BLANK_RETRO = {
  whatWorked: [],
  whatDidnt: [],
  sponsorAcks: [],
  // Follow-ups are the half of a retro that normally evaporates: "book the hall
  // earlier next year" is agreed in the debrief and then owned by nobody. These
  // carry an owner and a due date, so they reach that person's Monday reminder
  // and their My Work list instead of living in a paragraph.
  actions: [],
  finalReconciliation: { budget: null, spent: null },
}

const ACTION_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Done']
const ACTION_LANES = ACTION_STATUSES.map((key) => ({ key, label: key }))

function blankAction(existing) {
  return {
    id: nextId(existing),
    action: '',
    assignee: '',
    assigneeEmail: null,
    // Two weeks out, not blank. Follow-ups are future work by nature — pay the
    // balance, ship the cheque, return the hire gear — and an undated one
    // reaches nobody: the weekly reminder skips anything without a date, so
    // "no date" is the quietest way to lose a commitment the debrief just made.
    due: inTwoWeeks(),
    status: 'Not Started',
  }
}

function inTwoWeeks() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** One of the three free-text lists — worked, didn't, sponsors. */
function NoteList({ title, titleClass, items, placeholder, addLabel, onChange }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className={`font-display mb-3 text-lg font-bold ${titleClass}`}>{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((note, i) => (
          <li key={i} className="flex items-start gap-1">
            <InlineField
              value={note}
              onChange={(v) => onChange(items.map((n, j) => (j === i ? v : n)))}
              placeholder={placeholder}
              className="w-full text-sm leading-snug text-ink"
            />
            <RemoveButton
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              title="Remove this note"
            />
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
      </div>
    </div>
  )
}

export default function PostEventWrapUp({ event, onRetroChange, view = 'list', onViewChange }) {
  const editable = useEditable()
  const retro = event.retro

  if (!retro) {
    const isDone = event.status === 'Completed'
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-display text-lg font-bold text-ink">
          {isDone ? 'Wrap-up not filled in yet' : 'Wrap-up not started'}
        </p>
        <p className="max-w-sm text-sm text-ink-soft">
          {isDone ? (
            <>
              {event.name} has finished. Add the final reconciliation, sponsor acknowledgments, and
              what worked / what didn&apos;t, so next year starts from a blueprint rather than a
              blank page — plus any follow-up actions still owed, each with an owner and a due
              date so it reaches their Monday reminder.
            </>
          ) : (
            <>
              Reconciliation, sponsor acknowledgments, what worked and what didn&apos;t — usually
              filled in after the event from the debrief. Follow-up actions live here too, so a
              balance still to pay can be logged the moment it is agreed.
            </>
          )}
        </p>
        {/* One way in. Two buttons opening the same page was a false choice —
            the label just needed to name both of the things behind it, since a
            follow-up is what people come here for first. */}
        <div className="mt-2 w-72">
          <AddButton onClick={() => onRetroChange({ ...BLANK_RETRO })}>
            Start the wrap-up / add a follow-up
          </AddButton>
        </div>
      </div>
    )
  }

  const { whatWorked, whatDidnt, sponsorAcks, finalReconciliation } = retro
  // Absent on every wrap-up written before follow-ups existed.
  const actions = retro.actions ?? []

  function patchAction(id, patch) {
    onRetroChange({ ...retro, actions: actions.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
  }

  function addAction() {
    onRetroChange({ ...retro, actions: [...actions, blankAction(actions)] })
  }

  const budget = finalReconciliation?.budget ?? null
  const spent = finalReconciliation?.spent ?? null
  // Variance is derived, never stored — a stored copy drifts the moment either
  // figure is corrected.
  const variance = budget != null && spent != null ? budget - spent : null

  function patchReconciliation(patch) {
    onRetroChange({
      ...retro,
      finalReconciliation: { ...finalReconciliation, ...patch },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-bold">Final Payment Reconciliation</h3>
        <div className="grid grid-cols-1 gap-4 font-mono sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-soft">Budgeted</p>
            <NumberField
              value={budget}
              onChange={(v) => patchReconciliation({ budget: v })}
              placeholder="0"
              prefix="$"
              className="w-28 text-xl font-semibold"
            />
          </div>
          <div>
            <p className="text-xs text-ink-soft">Spent</p>
            <NumberField
              value={spent}
              onChange={(v) => patchReconciliation({ spent: v })}
              placeholder="0"
              prefix="$"
              className="w-28 text-xl font-semibold"
            />
          </div>
          <div>
            <p className="text-xs text-ink-soft">Variance</p>
            <p
              className={`tabular text-xl font-semibold ${
                variance == null ? 'text-ink-soft' : variance >= 0 ? 'text-success' : 'text-critical'
              }`}
            >
              {variance == null
                ? '—'
                : `${variance >= 0 ? '+' : '-'}$${Math.abs(variance).toLocaleString()}`}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-bold">Sponsor Acknowledgments</h3>
        <ul className="flex flex-col gap-2 sm:max-w-md">
          {sponsorAcks.map((s, i) => (
            <li key={i} className="flex items-center gap-1">
              <InlineField
                value={s}
                onChange={(v) =>
                  onRetroChange({
                    ...retro,
                    sponsorAcks: sponsorAcks.map((n, j) => (j === i ? v : n)),
                  })
                }
                placeholder="Sponsor name"
                className="w-full text-sm text-ink"
              />
              <RemoveButton
                onClick={() =>
                  onRetroChange(
                    { ...retro, sponsorAcks: sponsorAcks.filter((_, j) => j !== i) },
                    'Sponsor acknowledgment removed.'
                  )
                }
                title="Remove this sponsor"
              />
            </li>
          ))}
        </ul>
        <div className="mt-3 sm:max-w-md">
          <AddButton onClick={() => onRetroChange({ ...retro, sponsorAcks: [...sponsorAcks, ''] })}>
            Add a sponsor
          </AddButton>
        </div>
      </section>


      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-ink">Follow-up actions</h3>
          <div className="flex items-center gap-3">
            <p className="whitespace-nowrap text-xs text-ink-soft">
              <span className="tabular font-semibold text-ink">
                {actions.filter((a) => a.status === 'Done').length}
              </span>
              <span className="tabular"> / {actions.length}</span> done
            </p>
            {onViewChange && actions.length > 0 && (
              <ViewToggle view={view} onChange={onViewChange} />
            )}
          </div>
        </div>
        <p className="mb-3 text-xs text-ink-soft">
          What the debrief decided to actually do. These carry an owner and a due date, so they
          appear in My Work and in the weekly reminder like any other milestone.
        </p>

        {actions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-ink-soft">
              Nothing to follow up yet. &ldquo;Book the hall in January&rdquo; belongs here, with a
              name and a date on it.
            </p>
            {editable && (
              <div className="mx-auto mt-3 w-64">
                <AddButton onClick={addAction}>Add the first action</AddButton>
              </div>
            )}
          </div>
        ) : view === 'board' ? (
          <KanbanBoard
            lanes={ACTION_LANES}
            items={actions}
            laneOf={(a) => a.status ?? 'Not Started'}
            onMove={(a, status) => patchAction(a.id, { status })}
            keyOf={(a) => a.id}
            emptyLabel="No actions"
            renderCard={(a) => (
              <>
                <p className="text-sm font-medium leading-snug text-ink">
                  {a.action || 'Untitled action'}
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {a.assignee?.trim() ? a.assignee : 'Unassigned'}
                  {a.due ? (
                    ` · due ${new Date(a.due + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  ) : (
                    <span className="font-semibold text-warning"> · no date</span>
                  )}
                </p>
              </>
            )}
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border">
            {actions.map((a, i) => (
              <li
                key={a.id}
                className={`flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
                  i !== actions.length - 1 ? 'border-b border-border-soft' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <InlineField
                    value={a.action}
                    onChange={(v) => patchAction(a.id, { action: v })}
                    placeholder="What needs doing"
                    className="w-full text-sm font-medium text-ink"
                  />
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-1 pl-1.5 text-xs text-ink-soft">
                    <PersonField
                      value={a.assignee}
                      email={a.assigneeEmail}
                      onChange={(name, email) =>
                        patchAction(a.id, { assignee: name, assigneeEmail: email })
                      }
                      placeholder="Unassigned"
                      className="w-32 text-xs text-ink-soft"
                    />
                    <span aria-hidden="true">·</span>
                    <span>due</span>
                    <InlineField
                      type="date"
                      value={a.due}
                      onChange={(v) => patchAction(a.id, { due: v })}
                      className="font-mono text-xs text-ink-soft"
                    />
                    {!a.due && a.status !== 'Done' && (
                      <span className="font-semibold text-warning">
                        no date — nobody will be reminded
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      editable &&
                      patchAction(a.id, {
                        status:
                          ACTION_STATUSES[
                            (ACTION_STATUSES.indexOf(a.status) + 1) % ACTION_STATUSES.length
                          ],
                      })
                    }
                    className={editable ? 'focus-ring rounded-full' : 'cursor-default'}
                  >
                    <StatusPill label={a.status} tone={taskStatusTone[a.status]} />
                  </button>
                  <RemoveButton
                    onClick={() =>
                      onRetroChange(
                        { ...retro, actions: actions.filter((x) => x.id !== a.id) },
                        'Follow-up removed.'
                      )
                    }
                    title="Remove this action"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {actions.length > 0 && editable && (
          <div className="mt-3 sm:max-w-md">
            <AddButton onClick={addAction}>Add an action</AddButton>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NoteList
          title="What worked"
          titleClass="text-success"
          items={whatWorked}
          placeholder="Something worth repeating next year"
          addLabel="Add a note"
          onChange={(whatWorked) => onRetroChange({ ...retro, whatWorked })}
        />
        <NoteList
          title="What didn't — for next year's blueprint"
          titleClass="text-warning"
          items={whatDidnt}
          placeholder="Something to fix next year"
          addLabel="Add a note"
          onChange={(whatDidnt) => onRetroChange({ ...retro, whatDidnt })}
        />
      </section>
    </div>
  )
}
