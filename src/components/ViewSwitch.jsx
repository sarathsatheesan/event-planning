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
    <div className="inline-flex overflow-hidden rounded-md border border-border">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-current={view === o.key ? 'page' : undefined}
          className={`focus-ring whitespace-nowrap px-3 py-1.5 text-xs font-semibold transition ${
            view === o.key ? 'bg-accent text-accent-ink' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
