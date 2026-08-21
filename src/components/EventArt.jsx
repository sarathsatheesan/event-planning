import { useId } from 'react'

/**
 * A decorative banner per event, so a calendar of fourteen entries reads as
 * fourteen distinct things rather than fourteen identical cards.
 *
 * Everything is generated SVG — gradient plus a tiled motif. No image files to
 * host, nothing to fetch, and it scales to any banner size. Each theme pairs a
 * colour story with a motif that means something for that kind of event:
 * a tricolour for the national days, a checkerboard for chess, film sprockets
 * for the Bollywood night.
 */
const THEMES = {
  // National days — the flag itself, saffron through green.
  tricolour: { from: '#FF9933', to: '#138808', motif: 'bands', ink: '#ffffff' },
  // Stage magic — deep violet, scattered sparks.
  magic: { from: '#4C1D95', to: '#9333EA', motif: 'stars', ink: '#F5D0FE' },
  // Golden-era cinema — gold on midnight, film sprockets.
  cinema: { from: '#1E1B4B', to: '#B45309', motif: 'film', ink: '#FCD34D' },
  // Table tennis — court blue, balls in flight.
  sport: { from: '#0E7490', to: '#2563EB', motif: 'dots', ink: '#BAE6FD' },
  // Instrumental recital — warm terracotta, sound waves.
  raga: { from: '#9A3412', to: '#D97706', motif: 'waves', ink: '#FED7AA' },
  // Spring festival — marigold and leaf green, festoon petals.
  spring: { from: '#15803D', to: '#EAB308', motif: 'petals', ink: '#FEF9C3' },
  // Classical devotional — deep maroon and gold.
  classical: { from: '#7F1D1D', to: '#B45309', motif: 'waves', ink: '#FDE68A' },
  // Yoga — sunrise, rays from the horizon.
  sunrise: { from: '#F97316', to: '#38BDF8', motif: 'rays', ink: '#FFF7ED' },
  // Dance recital — magenta, moving zigzag.
  dance: { from: '#BE185D', to: '#F97316', motif: 'zigzag', ink: '#FCE7F3' },
  // Navratri — the brightest night of the year, diamond mirror-work.
  navratri: { from: '#7C3AED', to: '#F43F5E', motif: 'diamonds', ink: '#FDE68A' },
  // Committee meeting — slate, an orderly grid.
  formal: { from: '#334155', to: '#0F766E', motif: 'grid', ink: '#CBD5E1' },
  // Volunteer thanks — warm rose, a burst.
  gratitude: { from: '#BE123C', to: '#F59E0B', motif: 'rays', ink: '#FFE4E6' },
  // Chess — charcoal and brass, checkerboard.
  chess: { from: '#1F2937', to: '#78716C', motif: 'checker', ink: '#FCD34D' },
  // India Mela — the biggest day of the year, marigold into festival pink.
  mela: { from: '#EA580C', to: '#DB2777', motif: 'petals', ink: '#FEF3C7' },
  // Anything unthemed.
  default: { from: '#334155', to: '#2F5FED', motif: 'grid', ink: '#E2E8F0' },
}

function Motif({ motif, id, ink }) {
  const common = { fill: 'none', stroke: ink, strokeWidth: 1.5, opacity: 0.5 }
  switch (motif) {
    case 'stars':
      return (
        <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse">
          <g stroke={ink} strokeWidth="1.4" opacity="0.65">
            <path d="M10 3v14M3 10h14" />
            <path d="M26 20v8M22 24h8" opacity="0.7" />
          </g>
        </pattern>
      )
    case 'film':
      return (
        <pattern id={id} width="26" height="40" patternUnits="userSpaceOnUse">
          <rect x="4" y="4" width="14" height="9" rx="2" fill={ink} opacity="0.55" />
          <rect x="4" y="27" width="14" height="9" rx="2" fill={ink} opacity="0.55" />
        </pattern>
      )
    case 'dots':
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="4.5" fill={ink} opacity="0.55" />
          <circle cx="23" cy="23" r="2.5" fill={ink} opacity="0.4" />
        </pattern>
      )
    case 'waves':
      return (
        <pattern id={id} width="48" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 18 Q12 4 24 18 T48 18" {...common} />
          <path d="M0 8 Q12 -6 24 8 T48 8" {...common} opacity="0.28" />
        </pattern>
      )
    case 'petals':
      return (
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <g fill={ink} opacity="0.5">
            <circle cx="18" cy="10" r="4" />
            <circle cx="10" cy="20" r="4" />
            <circle cx="26" cy="20" r="4" />
          </g>
          <circle cx="18" cy="17" r="2" fill={ink} opacity="0.8" />
        </pattern>
      )
    case 'rays':
      return (
        <pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse">
          <g stroke={ink} strokeWidth="2" opacity="0.4">
            <path d="M30 60 L30 6" />
            <path d="M30 60 L8 16" />
            <path d="M30 60 L52 16" />
          </g>
        </pattern>
      )
    case 'zigzag':
      return (
        <pattern id={id} width="32" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 18 L8 4 L16 18 L24 4 L32 18" {...common} strokeWidth="2" />
        </pattern>
      )
    case 'diamonds':
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M15 3 L27 15 L15 27 L3 15 Z" {...common} strokeWidth="1.6" opacity="0.55" />
          <path d="M15 10 L20 15 L15 20 L10 15 Z" fill={ink} opacity="0.35" stroke="none" />
        </pattern>
      )
    case 'checker':
      return (
        <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={ink} opacity="0.32" />
          <rect x="16" y="16" width="16" height="16" fill={ink} opacity="0.32" />
        </pattern>
      )
    case 'grid':
    default:
      return (
        <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" {...common} strokeWidth="1" opacity="0.35" />
        </pattern>
      )
  }
}

export default function EventArt({ theme = 'default', className = '' }) {
  const uid = useId().replace(/:/g, '')
  const t = THEMES[theme] ?? THEMES.default
  const gradId = `g-${uid}`
  const patId = `p-${uid}`

  // The tricolour is drawn as itself rather than a gradient wash. The bands
  // stretch to fill, but the chakra is a separate layer that keeps its aspect
  // ratio — stretched into an ellipse it stops reading as the flag.
  if (t.motif === 'bands') {
    return (
      <div className={`relative ${className}`} aria-hidden="true">
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <rect width="400" height="33.4" fill="#FF9933" />
          <rect y="33.4" width="400" height="33.2" fill="#FFFFFF" />
          <rect y="66.6" width="400" height="33.4" fill="#138808" />
        </svg>
        <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
          <g fill="none" stroke="#0A3D91" strokeWidth="1.4">
            <circle cx="20" cy="20" r="8.5" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6
              return (
                <line
                  key={i}
                  x1={20 + Math.cos(a) * 2}
                  y1={20 + Math.sin(a) * 2}
                  x2={20 + Math.cos(a) * 8.5}
                  y2={20 + Math.sin(a) * 8.5}
                  strokeWidth="0.7"
                />
              )
            })}
          </g>
          <circle cx="20" cy="20" r="1.8" fill="#0A3D91" />
        </svg>
      </div>
    )
  }

  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.from} />
          <stop offset="100%" stopColor={t.to} />
        </linearGradient>
        <Motif motif={t.motif} id={patId} ink={t.ink} />
      </defs>
      <rect width="400" height="100" fill={`url(#${gradId})`} />
      <rect width="400" height="100" fill={`url(#${patId})`} />
    </svg>
  )
}
