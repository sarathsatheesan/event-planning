import { useEffect, useRef } from 'react'
import { taskStatusTone } from '../data/events.js'
import StatusPill from './StatusPill.jsx'
import { useEditable } from '../lib/editing.js'

/**
 * A board view of anything that has a status.
 *
 * Shared by the milestone list, the run of show and the wrap-up follow-ups, so
 * the three cannot drift into three different ideas of what a board is.
 *
 * Two decisions worth knowing:
 *
 * Nothing is dragged. HTML5 drag-and-drop does not work on touch at all, and a
 * library that does costs about 40KB for a gesture nobody can use one-handed at
 * a venue. Tapping the status chip advances it exactly as tapping a row does in
 * the list; the chevron beside it opens a menu to jump straight to a lane.
 *
 * On a phone the lanes scroll sideways one at a time with snap points, rather
 * than squeezing four columns into 390px or stacking them into a list that is
 * no longer a board. The lane heading carries its count, so a swipe away from
 * an empty lane still tells you it is empty.
 */

// Static class names so Tailwind keeps them; a computed string would be purged.
const COLUMNS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5' }

export default function KanbanBoard({
  lanes,
  items,
  laneOf,
  onMove,
  renderCard,
  keyOf = (item, i) => i,
  emptyLabel = 'Nothing here',
}) {
  const editable = useEditable()
  const board = useRef(null)

  // On a phone the board starts below the event header, the category pills and
  // the toggle itself — tap Board and the screen appears not to change at all.
  // Bring it into view once, and only when it is actually off-screen.
  useEffect(() => {
    const el = board.current
    if (!el || window.innerWidth >= 640) return
    if (el.getBoundingClientRect().top > window.innerHeight * 0.6) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [])

  const grouped = lanes.map((lane) => ({
    ...lane,
    items: items.filter((item) => laneOf(item) === lane.key),
  }))

  return (
    <div ref={board} className="scroll-mt-2">
      <div
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-x-visible sm:pb-0 ${
          COLUMNS[lanes.length] ?? 'sm:grid-cols-4'
        }`}
      >
        {grouped.map((lane) => (
          <section
            key={lane.key}
            className="flex w-[85vw] shrink-0 snap-center flex-col rounded-xl border border-border bg-paper p-2 sm:w-auto sm:shrink"
          >
            <header className="sticky top-0 z-10 -mx-2 flex items-baseline justify-between rounded-t-xl bg-paper px-3 pb-2 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {lane.label}
              </h4>
              <span className="tabular text-xs font-semibold text-ink-soft">
                {lane.items.length}
              </span>
            </header>

            {lane.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-ink-soft">
                {emptyLabel}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lane.items.map((item, i) => (
                  <li
                    key={keyOf(item, i)}
                    className="rounded-lg border border-border bg-surface p-2.5 shadow-sm"
                  >
                    {renderCard(item)}
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-soft pt-2">
                      <LaneControl
                        lanes={lanes}
                        current={lane.key}
                        editable={editable}
                        onMove={(next) => onMove(item, next)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="pt-1 text-center text-[11px] text-ink-soft sm:hidden">
        Swipe to see the other lanes
      </p>
    </div>
  )
}

/**
 * The chip is the control. Tapping it advances to the next lane — the same
 * gesture the list has always had — and the chevron beside it is a native
 * select, so jumping from Not Started straight to Done is one tap rather than
 * three. The select covers only the chevron, which is what keeps the tap on the
 * chip itself meaning "advance".
 */
function LaneControl({ lanes, current, editable, onMove }) {
  const index = lanes.findIndex((l) => l.key === current)
  const label = lanes[index]?.label ?? current

  if (!editable) return <StatusPill label={label} tone={taskStatusTone[current]} />

  const next = lanes[(index + 1) % lanes.length].key

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => onMove(next)}
        title={`Move to ${lanes[(index + 1) % lanes.length].label}`}
        className="focus-ring rounded-full"
      >
        <StatusPill label={label} tone={taskStatusTone[current]} />
      </button>
      <span aria-hidden="true" className="pl-1 text-[10px] text-ink-soft">
        ▾
      </span>
      <select
        value={current}
        onChange={(e) => onMove(e.target.value)}
        aria-label={`Move “${label}” to another lane`}
        className="absolute right-0 top-0 h-full w-6 cursor-pointer opacity-0"
      >
        {lanes.map((l) => (
          <option key={l.key} value={l.key}>
            {l.label}
          </option>
        ))}
      </select>
    </span>
  )
}

/** The List / Board switch, so all three tabs offer it the same way. */
export function ViewToggle({ view, onChange, boardLabel = 'Board', listLabel = 'List' }) {
  const options = [
    { key: 'list', label: listLabel },
    { key: 'board', label: boardLabel },
  ]
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-border">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={view === o.key}
          className={`focus-ring whitespace-nowrap px-2.5 py-1 text-xs font-semibold transition ${
            view === o.key ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
