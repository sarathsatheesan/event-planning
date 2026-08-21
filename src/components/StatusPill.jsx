const toneClasses = {
  neutral: 'bg-neutral-status-soft text-neutral-status',
  warning: 'bg-warning-soft text-warning',
  critical: 'bg-critical-soft text-critical',
  success: 'bg-success-soft text-success',
  live: 'bg-live-soft text-live',
}

export default function StatusPill({ label, tone = 'neutral', pulse = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </span>
  )
}
