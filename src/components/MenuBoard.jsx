/**
 * The menu, stall by stall, with nothing else on screen.
 *
 * The food meeting asks one question — is anybody else selling that — and the
 * stall cards in the list view answer it badly, because the paperwork, the
 * contacts and the prices sit between you and the dishes. This view strips all
 * of it: a column per stall, its dishes, and the clash colours. Prices are
 * deliberately left out; they are a different conversation, and the list view
 * is one tap away.
 *
 * Dishes are editable here as well as in the list. They are the same records
 * either way — the board renders the event's own menu arrays, so a correction
 * made while comparing two stalls side by side is the correction, not a copy
 * of one. Prices stay out: this view answers "is anybody else selling that",
 * and the list is one tap away for the rest.
 *
 * Not built on KanbanBoard despite looking like one. That component is about
 * statuses: every card carries a control that moves it between lanes, and a
 * dish does not move from one stall to another by tapping it. The mobile
 * behaviour is copied deliberately, though, so the two read as the same idea.
 */

import { stallClashLevel } from '../lib/menu.js'
import { CLASH_TONE } from '../lib/clashTone.js'
import { useEditable } from '../lib/editing.js'
import { InlineField, RemoveButton, AddButton } from './fields.jsx'

// Static class name so Tailwind keeps it in the build.
const GRID = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export default function MenuBoard({
  vendors,
  clashes,
  onItemChange,
  onItemRemove,
  onAddItem,
  onImport,
}) {
  const editable = useEditable()
  // An editor needs the empty stalls too — that is where a menu gets typed in.
  // A viewer does not: a column of nothing is noise on a review screen.
  const withMenus = editable ? vendors : vendors.filter((v) => (v.menu?.length ?? 0) > 0)
  const missing = vendors.length - withMenus.length

  if (withMenus.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
        No menus yet. Add dishes to a stall and they appear here side by side.
      </div>
    )
  }

  return (
    <div>
      <div
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:overflow-x-visible sm:pb-0 ${GRID}`}
      >
        {withMenus.map((vendor) => {
          const level = stallClashLevel(vendor, clashes)
          const tone = level ? CLASH_TONE[level] : null
          const menu = vendor.menu ?? []
          const flagged = menu.filter((m) => clashes.has(m.id)).length
          return (
            <section
              key={vendor.id}
              // `relative` is load-bearing, not decoration. The remove
              // buttons carry a visually-hidden label, and `sr-only` is
              // `position: absolute`. With no positioned ancestor those labels
              // resolve against the page, so a lane sitting 8,000px along the
              // strip drags the whole document sideways with it — the page
              // scrolls, the header slides off, and the board itself looks
              // innocent because every lane measures the right width.
              className={`relative flex w-[85vw] shrink-0 snap-center flex-col rounded-xl border p-2 sm:w-auto sm:shrink ${
                tone ? tone.card : 'border-border bg-paper'
              }`}
            >
              <header className="sticky top-0 z-10 -mx-2 flex items-baseline justify-between gap-2 rounded-t-xl bg-inherit px-3 pb-2 pt-1">
                <h4 className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {vendor.stall || 'Unnamed stall'}
                </h4>
                <span className="flex shrink-0 items-baseline gap-1.5">
                  {flagged > 0 && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${tone.badge}`}
                      title={
                        level === 'duplicate'
                          ? 'At least one dish is sold at another stall'
                          : 'At least one dish looks like another stall’s'
                      }
                    >
                      {flagged}
                      <span className="hidden sm:inline"> flagged</span>
                    </span>
                  )}
                  <span className="tabular text-xs font-semibold text-ink-soft">{menu.length}</span>
                </span>
              </header>

              <ul className="flex flex-col gap-1.5">
                {menu.map((entry) => {
                  const clash = clashes.get(entry.id)
                  const itemTone = clash ? CLASH_TONE[clash.level] : null
                  return (
                    <li
                      key={entry.id}
                      className={`rounded-lg border-l-2 px-2.5 py-1.5 text-sm ${
                        itemTone ? itemTone.row : 'border-transparent bg-surface'
                      }`}
                    >
                      <div className="flex items-start gap-1">
                        <div className="min-w-0 flex-1">
                          <InlineField
                            value={entry.item}
                            onChange={(v) => onItemChange?.(vendor.id, entry.id, { item: v })}
                            placeholder="Dish"
                            className="w-full text-sm text-ink"
                          />
                        </div>
                        {editable && (
                          <RemoveButton
                            onClick={() => onItemRemove?.(vendor.id, entry.id)}
                            title="Remove this item"
                          />
                        )}
                      </div>
                      {clash && (
                        <p className={`pt-0.5 text-xs font-medium ${itemTone.text}`}>
                          {clash.level === 'duplicate' ? 'Also at ' : 'Similar to '}
                          {clash.with.map((w) => `${w.stall} — ${w.item}`).join('; ')}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>

              {editable && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <AddButton onClick={() => onAddItem?.(vendor.id)}>Add a dish</AddButton>
                  <button
                    type="button"
                    onClick={() => onImport?.(vendor.id)}
                    className="focus-ring rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-ink-soft transition hover:border-accent hover:text-accent"
                  >
                    Import from a file or paste
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <p className="pt-1 text-center text-[11px] text-ink-soft sm:hidden">
        Swipe to see the other stalls
      </p>

      {/* A stall with no menu is not worth a column here, but it is worth
          saying out loud: the committee is still chasing those menus. */}
      {missing > 0 && (
        <p className="pt-2 text-center text-xs text-ink-soft">
          <span className="tabular font-semibold text-ink">{missing}</span> stall
          {missing === 1 ? '' : 's'} have no menu in yet.
        </p>
      )}
    </div>
  )
}
