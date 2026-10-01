import { InlineField, NumberField, RemoveButton, AddButton } from '../fields.jsx'

const BLANK_RETRO = {
  whatWorked: [],
  whatDidnt: [],
  sponsorAcks: [],
  finalReconciliation: { budget: null, spent: null },
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

export default function PostEventWrapUp({ event, onRetroChange }) {
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
              blank page.
            </>
          ) : (
            <>
              You can start the wrap-up before the event runs, but it is usually filled in
              afterwards from the reconciliation and the debrief.
            </>
          )}
        </p>
        <div className="mt-2 w-64">
          <AddButton onClick={() => onRetroChange({ ...BLANK_RETRO })}>Start the wrap-up</AddButton>
        </div>
      </div>
    )
  }

  const { whatWorked, whatDidnt, sponsorAcks, finalReconciliation } = retro
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
