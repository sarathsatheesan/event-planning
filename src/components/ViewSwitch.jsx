/**
 * Top-level switch between the calendar and the cross-event work list.
 *
 * Rendered by both views rather than by App, so each page keeps its own header
 * layout and the switch sits where that page's heading is.
 */
export default function ViewSwitch({ view, onChange }) {
  const options = [
    { key: 'calendar', label: 'Event calendar' },
    { key: 'work', label: 'My work' },
  ]
  return (
    <div className="inline-flex h-8 overflow-hidden rounded-lg border border-border bg-surface">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-current={view === o.key ? 'page' : undefined}
          className={`focus-ring whitespace-nowrap px-3 text-xs font-semibold transition duration-200 ${
            view === o.key
              ? 'bg-accent text-accent-ink'
              : 'text-ink-soft hover:bg-paper hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
