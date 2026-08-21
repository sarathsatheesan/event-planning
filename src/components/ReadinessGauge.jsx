export default function ReadinessGauge({ percent, size = 64, stroke = 6 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const tone = percent >= 90 ? 'var(--success)' : percent >= 60 ? 'var(--live)' : 'var(--warning)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className="font-display absolute font-bold tabular leading-none"
        style={{ color: tone, fontSize: `${Math.round(size * (percent >= 100 ? 0.26 : 0.3))}px` }}
      >
        {percent}%
      </span>
    </div>
  )
}
