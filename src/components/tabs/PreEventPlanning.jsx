import { useMemo, useState } from 'react'
import { taskStatusTone } from '../../data/events.js'
import StatusPill from '../StatusPill.jsx'

const STATUS_CYCLE = ['Not Started', 'In Progress', 'Blocked', 'Done']
const ANCHOR_ORDER = ['T-90', 'T-60', 'T-30', 'T-7', 'T-1']

export default function PreEventPlanning({ event }) {
  const [tasks, setTasks] = useState(event.checklist)
  const [category, setCategory] = useState('All')

  const filtered = useMemo(
    () => (category === 'All' ? tasks : tasks.filter((t) => t.category === category)),
    [tasks, category]
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

  function cycleStatus(id) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const idx = STATUS_CYCLE.indexOf(t.status)
        return { ...t, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] }
      })
    )
  }

  const doneCount = tasks.filter((t) => t.status === 'Done').length

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <p className="mb-4 text-xs text-ink-soft">
        Tap a status pill to advance it — Not Started &rarr; In Progress &rarr; Blocked &rarr; Done.
      </p>

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
                  className={`flex flex-col gap-2 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    i !== items.length - 1 ? 'border-b border-border-soft' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{t.task}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {t.category} &middot; {t.assignee} &middot; due{' '}
                      {new Date(t.due + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleStatus(t.id)}
                    className="focus-ring self-start rounded-full sm:self-center"
                  >
                    <StatusPill label={t.status} tone={taskStatusTone[t.status]} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
