// Run with: node src/lib/menu.test.mjs
import { normaliseItem, similarity, findClashes, clashCounts, stallClashLevel } from './menu.js'
import { melaFoodVendors } from '../data/melaFood.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    typeof expected === 'function'
      ? expected(actual)
      : Array.isArray(expected)
        ? JSON.stringify(actual) === JSON.stringify(expected)
        : actual === expected
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)?.slice(0, 90)}`)
}

console.log('--- normalising ---')
check('quantity markers go', normaliseItem('Gobi Manchurian[5]'), 'gobi manchurian')
check('combo contents stay', normaliseItem('Combo 1 (Bagara Rice, Aloo Kurma)'), 'combo 1 bagara rice aloo kurma')
check('sizes stay distinct', normaliseItem('Mango 2 Scoops'), 'mango 2 scoops')
check('case and punctuation go', normaliseItem('Rava Idly+Chutney'), 'rava idly chutney')
check('blank stays blank', normaliseItem(''), '')
check('nullish is safe', normaliseItem(undefined), '')

console.log('\n--- similarity ---')
check('identical', similarity('aloo bonda', 'aloo bonda'), 1)
check('one letter apart scores high', similarity('aloo bonda', 'aaloo bonda'), (n) => n > 0.9)
check('different dishes score low', similarity('masala mor', 'masala corn'), (n) => n < 0.9)
check('nothing in common', similarity('laddu', 'pav bhaji'), (n) => n < 0.5)

console.log('\n--- clashes across stalls ---')
const two = [
  { id: 1, stall: 'Temple', menu: [{ id: 1, item: 'Mango Lassi', price: 3 }] },
  { id: 2, stall: 'UKK', menu: [{ id: 2, item: 'mango lassi', price: 4.5 }] },
]
const found = findClashes(two)
check('the same dish at two stalls is a duplicate', found.get(1)?.level, 'duplicate')
check('and names the other stall', found.get(1)?.with[0].stall, 'UKK')
check('both sides are flagged', found.get(2)?.level, 'duplicate')

const spelled = [
  { id: 1, stall: 'NH44', menu: [{ id: 1, item: 'Aloo Bonda' }] },
  { id: 2, stall: 'GTA', menu: [{ id: 2, item: 'Aaloo Bonda' }] },
]
check('a spelling variant is similar, not identical', findClashes(spelled).get(1)?.level, 'similar')

const distinct = [
  { id: 1, stall: 'UTS', menu: [{ id: 1, item: 'Masala Mor' }] },
  { id: 2, stall: 'GTA', menu: [{ id: 2, item: 'Masala Corn' }] },
]
check('buttermilk is not sweetcorn', findClashes(distinct).size, 0)

const sameStall = [
  { id: 1, stall: 'Melting Mango', menu: [{ id: 1, item: 'Mango 1 Scoop' }, { id: 2, item: 'Mango 2 Scoops' }] },
]
check('one stall selling two sizes is fine', findClashes(sameStall).size, 0)

const repeated = [
  { id: 1, stall: 'Temple', menu: [{ id: 1, item: 'Laddu[3]' }, { id: 2, item: 'laddu' }] },
]
check('but the same stall listing it twice is flagged', findClashes(repeated).get(1)?.level, 'duplicate')

const threeWay = [
  { id: 1, stall: 'A', menu: [{ id: 1, item: 'Samosa' }] },
  { id: 2, stall: 'B', menu: [{ id: 2, item: 'samosa' }] },
  { id: 3, stall: 'C', menu: [{ id: 3, item: 'SAMOSA' }] },
]
check('three stalls, each told about the other two', findClashes(threeWay).get(1)?.with.length, 2)

check('empty input is safe', findClashes([]).size, 0)
check('a vendor with no menu is safe', findClashes([{ id: 1, stall: 'X' }]).size, 0)
check('a blank item name is ignored', findClashes([
  { id: 1, stall: 'A', menu: [{ id: 1, item: '' }] },
  { id: 2, stall: 'B', menu: [{ id: 2, item: '  ' }] },
]).size, 0)

console.log('\n--- tinting a whole stall ---')
{
  // One stall sells a dish outright duplicated elsewhere and another that is
  // only a near match. The card has to read as the worse of the two.
  const mixed = [
    { id: 1, stall: 'A', menu: [{ id: 1, item: 'Samosa' }, { id: 2, item: 'Aloo Bonda' }] },
    { id: 2, stall: 'B', menu: [{ id: 3, item: 'samosa' }] },
    { id: 3, stall: 'C', menu: [{ id: 4, item: 'Aaloo Bonda' }] },
  ]
  const c = findClashes(mixed)
  check('red beats amber on the same stall', stallClashLevel(mixed[0], c), 'duplicate')
  check('a near match alone is amber', stallClashLevel(mixed[2], c), 'similar')
  check('a clean stall is not tinted', stallClashLevel({ id: 9, menu: [{ id: 9, item: 'Chai' }] }, c), null)
  check('an empty stall is not tinted', stallClashLevel({ id: 9 }, c), null)
}

console.log('\n--- against the real India Mela menu ---')
const real = findClashes(melaFoodVendors)
const counts = clashCounts(real)
const items = melaFoodVendors.reduce((n, v) => n + v.menu.length, 0)
console.log(`    ${melaFoodVendors.length} stalls, ${items} menu items`)
check('the workbook has no outright duplicates', counts.duplicate, 0)
check('and one pair worth a second look', counts.similar, 2)
for (const [id, c] of real) {
  const v = melaFoodVendors.find((x) => x.menu.some((m) => m.id === id))
  const m = v.menu.find((x) => x.id === id)
  console.log(`    ${c.level}: ${v.stall} "${m.item}" ~ ${c.with.map((w) => `${w.stall} "${w.item}"`).join(', ')}`)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
