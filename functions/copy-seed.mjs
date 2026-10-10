// The scheduled digest needs the same event calendar the app shows. Those
// modules live in ../src/data and are pure ESM with no browser APIs, so they
// run unchanged in Node — but `firebase deploy` only uploads this directory,
// so they are staged into ./seed on the way out.
//
// Copying rather than duplicating by hand: there is exactly one definition of
// the calendar and the override layering, and it cannot drift from the app's.

import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const from = join(here, '..', 'src', 'data')
const to = join(here, 'seed')

// events.js imports the Mela's stalls, sponsors and booths, so staging it
// without them leaves seed/events.js unable to resolve its own imports and
// the digest dead on arrival. Every module the chain needs is listed here.
const FILES = [
  'events.js',
  'template.js',
  'storage.js',
  'melaFood.js',
  'sponsors.js',
  'businessVendors.js',
]

await mkdir(to, { recursive: true })
for (const file of FILES) {
  await copyFile(join(from, file), join(to, file))
}
console.log(`staged ${FILES.join(', ')} -> functions/seed/`)
