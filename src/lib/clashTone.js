// How a clash looks, in one place.
//
// The stall list and the menu board both colour the same three things — a menu
// row, the stall card around it, and the count badge — and they have to agree.
// Written as whole class strings rather than built from pieces, because
// Tailwind scans source text and would purge anything assembled at runtime.
export const CLASH_TONE = {
  duplicate: {
    row: 'border-critical bg-critical-soft/40',
    card: 'border-critical/50 bg-critical-soft/15',
    text: 'text-critical',
    badge: 'bg-critical-soft text-critical',
  },
  similar: {
    row: 'border-warning bg-warning-soft/40',
    card: 'border-warning/50 bg-warning-soft/15',
    text: 'text-warning',
    badge: 'bg-warning-soft text-warning',
  },
}
