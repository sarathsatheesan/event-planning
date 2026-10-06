// Is this dish already being sold at another stall?
//
// The committee's actual worry at India Mela is two stalls turning up with the
// same thing: eight stalls, eighty-odd items, and nobody holding the whole list
// in their head. Pure and separate from the screen, because what counts as "the
// same dish" is the part that has to be right.

/**
 * Strip what varies without changing the dish — case, punctuation, and the
 * piece counts the committee writes in square brackets ("Laddu[3]").
 *
 * Deliberately keeps two things an earlier version threw away. Digits: "Mango
 * 1 Scoop" and "Mango 2 Scoops" are different products, and so are "Combo 1"
 * and "Combo 2". Parenthetical contents: they are what tells four combos
 * apart. Dropping both made GTA's four combos normalise to the single word
 * "combo" and flagged them as duplicates of each other — the test against the
 * real menu is what caught it.
 */
export function normaliseItem(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * How alike two normalised names are, 0 to 1. Longest-common-subsequence over
 * characters: enough to see that "aloo bonda" and "aaloo bonda" are the same
 * dish spelled two ways, without pulling in a library.
 */
export function similarity(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const rows = a.length + 1
  const cols = b.length + 1
  let prev = new Array(cols).fill(0)
  let curr = new Array(cols).fill(0)
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1])
    }
    const swap = prev
    prev = curr
    curr = swap
    curr.fill(0)
  }
  return (2 * prev[cols - 1]) / (a.length + b.length)
}

// 0.90, not 0.85. At 0.85 the real menu pairs "Masala Mor" with "Masala Corn"
// — buttermilk and sweetcorn, nothing alike — while the pair actually worth
// catching, "Aloo Bonda" and "Aaloo Bonda", scores 0.95. A false flag on every
// screen teaches people to ignore the flags.
const SIMILAR_ENOUGH = 0.9

/**
 * Builds a map of menu-item id → clash, across every stall.
 *
 *   { level: 'duplicate', with: [{ stall, item }] }  same dish, different stall
 *   { level: 'similar',   with: [...] }              probably the same, worth a look
 *
 * Also flags a stall listing the same dish twice, which is its own small mess.
 */
export function findClashes(vendors) {
  const rows = []
  for (const vendor of vendors ?? []) {
    for (const entry of vendor.menu ?? []) {
      const key = normaliseItem(entry.item)
      if (!key) continue
      rows.push({ id: entry.id, vendorId: vendor.id, stall: vendor.stall, item: entry.item, key })
    }
  }

  const clashes = new Map()
  const note = (row, other, level) => {
    const existing = clashes.get(row.id)
    if (existing && existing.level === 'duplicate' && level === 'similar') return
    if (!existing || existing.level !== level) {
      clashes.set(row.id, { level, with: [{ stall: other.stall, item: other.item }] })
      return
    }
    if (!existing.with.some((w) => w.stall === other.stall && w.item === other.item)) {
      existing.with.push({ stall: other.stall, item: other.item })
    }
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i]
      const b = rows[j]
      const exact = a.key === b.key
      if (!exact && similarity(a.key, b.key) < SIMILAR_ENOUGH) continue
      // Within one stall only an exact repeat is worth saying anything about:
      // a stall legitimately sells "Mango 1 Scoop" and "Mango 2 Scoops".
      if (a.vendorId === b.vendorId && !exact) continue
      const level = exact ? 'duplicate' : 'similar'
      note(a, b, level)
      note(b, a, level)
    }
  }
  return clashes
}

/** Counts for the summary line. */
export function clashCounts(clashes) {
  let duplicate = 0
  let similar = 0
  for (const c of clashes.values()) {
    if (c.level === 'duplicate') duplicate++
    else similar++
  }
  return { duplicate, similar }
}
