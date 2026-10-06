// Run with: node src/lib/menuImport.test.mjs
import { parsePrice, splitRows, looksLikeHeader, rowToItem, parseMenuText, pdfLinesToRows } from './menuImport.js'
import { melaFoodVendors } from '../data/melaFood.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok =
    typeof expected === 'function'
      ? expected(actual)
      : JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}: ${JSON.stringify(actual)?.slice(0, 110)}`)
}

console.log('--- prices as people write them ---')
check('plain', parsePrice('5'), 5)
check('dollars', parsePrice('$7.00'), 7)
check('spaced symbol', parsePrice('$ 4.50'), 4.5)
check('comma decimal', parsePrice('5,99'), 5.99)
check('rupees', parsePrice('Rs. 120'), 120)
check('trailing words', parsePrice('6.99 each'), 6.99)
check('a number already', parsePrice(7), 7)
check('nothing', parsePrice(''), null)
check('not a price', parsePrice('Mango Lassi'), null)
check('negative is not a price', parsePrice('-3'), null)

console.log('\n--- splitting ---')
check('tabs win over commas', splitRows('Combo 1, with rice\t5.99'), [['Combo 1, with rice', '5.99']])
check('quoted commas survive', splitRows('"Combo 1 (rice, kurma)",10'), [['Combo 1 (rice, kurma)', '10']])
check('blank lines go', splitRows('a,1\n\n\nb,2').length, 2)

console.log('\n--- headers ---')
check('Item/Price is a header', looksLikeHeader(['Item', 'Price']), true)
check('S.No/Dish/Cost is a header', looksLikeHeader(['S.No', 'Dish', 'Cost']), true)
check('a real row is not', looksLikeHeader(['Pani Puri', '5.99']), false)
check('a dish called Menu with a price is not', looksLikeHeader(['Menu', '5']), false)

console.log('\n--- rows to items ---')
check('name and price', rowToItem(['Pani Puri', '5.99']), { item: 'Pani Puri', price: 5.99 })
check('serial number is not a dish', rowToItem(['7', 'Masala Dosa', '6.99']), { item: 'Masala Dosa', price: 6.99 })
check('price last, not first', rowToItem(['Combo 2 - 3 Gobi + 2 Idli', '10']), { item: 'Combo 2 - 3 Gobi + 2 Idli', price: 10 })
check('price inline with a dash', rowToItem(['Masala Dosa - $6.99']), { item: 'Masala Dosa', price: 6.99 })
check('no price is allowed', rowToItem(['Filter Coffee']), { item: 'Filter Coffee', price: null })
check('an empty row is nothing', rowToItem(['', '  ']), null)
check('quantity markers are kept', rowToItem(['Laddu[3]', '5']), { item: 'Laddu[3]', price: 5 })

console.log('\n--- a whole paste, as it actually arrives ---')
const pasted = `Item\tPrice
1\tPotato Samosa\t4.99
2\tOnion Samosa\t5.99
3\tMasala Cut Mirchi\t
\t\t
4\tCombo 1 (Bagara Rice, Aloo Kurma)\t12.50`
const got = parseMenuText(pasted)
check('header dropped', got.headerDropped, true)
check('four dishes', got.items.length, 4)
check('a dish with no price still comes in', got.items[2], { item: 'Masala Cut Mirchi', price: null })
check('the combo keeps its contents', got.items[3].item, 'Combo 1 (Bagara Rice, Aloo Kurma)')
check('nothing silently dropped', got.skipped.length, 0)

console.log('\n--- a messy one ---')
const messy = parseMenuText('Pani Puri - $5.99\nDabeli — 5.99\n\n12\nVada Pav')
check('a bare number is reported, not imported as a dish', messy.skipped.length, 1)
check('and the rest survive', messy.items.map((i) => i.item), ['Pani Puri', 'Dabeli', 'Vada Pav'])

console.log('\n--- PDF fragments back into lines ---')
const frags = [
  { text: 'Pani Puri', x: 50, y: 700 },
  { text: '5.99', x: 400, y: 701 },
  { text: 'Dabeli', x: 50, y: 680 },
  { text: '5.99', x: 400, y: 680 },
]
check('two lines, in page order', pdfLinesToRows(frags), [['Pani Puri', '5.99'], ['Dabeli', '5.99']])
check('and they parse', parseMenuText(pdfLinesToRows(frags).map((r) => r.join('\t')).join('\n')).items.length, 2)

console.log('\n--- round-tripping a real stall menu ---')
{
  // Temple's 14 dishes, written out the way a vendor would paste them from a
  // spreadsheet, then read back. If the parser cannot survive the committee's
  // own menu it will not survive a stranger's.
  const temple = melaFoodVendors.find((v) => v.stall === 'Temple')
  const pasted = temple.menu.map((m) => `${m.item}\t${m.price.toFixed(2)}`).join('\n')
  const back = parseMenuText(pasted)
  check('every dish comes back', back.items.length, temple.menu.length)
  // Runs of spaces are collapsed on the way in — the seed has
  // "Combo 1-  Pulihora  + ..." straight out of the spreadsheet, and two
  // spaces in a dish name are a typing artefact, not information.
  const tidy = (t) => t.replace(/\s+/g, ' ').trim()
  check('names unchanged but for stray spaces', back.items.map((i) => i.item), temple.menu.map((m) => tidy(m.item)))
  check('and that is the only difference', back.items.filter((i, n) => i.item !== temple.menu[n].item).length, 1)
  check('prices unchanged', back.items.map((i) => i.price), temple.menu.map((m) => m.price))
  check('nothing skipped', back.skipped.length, 0)
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURES`)
process.exit(fails === 0 ? 0 : 1)
