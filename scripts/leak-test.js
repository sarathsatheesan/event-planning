/* EventOps — committee scoping leak test
 * ======================================
 * Paste this into the browser console on https://icceventops.web.app while
 * signed in. Run it once as a manager and once as a volunteer.
 *
 * It does NOT go through the app. It reads your ID token out of the Firebase
 * auth store and talks to the Firestore REST API directly, which is what an
 * attacker with your session would do. The app being narrower proves nothing
 * about the rules; this does.
 *
 * Reload the page first so the token is fresh.
 *
 * What it checks:
 *   1. the wide read      — asking for the whole collection must be refused
 *   2. the scoped reads   — your own two queries must still work
 *   3. a document by id   — one event you should not see must be refused
 *   4. what you can see   — the ids that come back, to eyeball against the app
 *
 * Doors 3 and 4 of the four-door gate are checked outside this script:
 *   PDF export  — export an event, confirm it holds nothing you cannot see
 *                 (it builds from loaded state, so this follows from 2)
 *   the digest   — Preview Monday, confirm your rows are only your own
 */
(async () => {
  const PROJECT = 'event-planning-de705'
  const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

  // --- the token, straight out of Firebase's own IndexedDB store ---
  const token = await new Promise((resolve, reject) => {
    const open = indexedDB.open('firebaseLocalStorageDb')
    open.onerror = () => reject(new Error('cannot open firebaseLocalStorageDb'))
    open.onsuccess = () => {
      const tx = open.result.transaction('firebaseLocalStorage', 'readonly')
      const all = tx.objectStore('firebaseLocalStorage').getAll()
      all.onsuccess = () => {
        const row = all.result.find((r) => r?.value?.stsTokenManager?.accessToken)
        if (!row) return reject(new Error('not signed in on this origin'))
        const t = row.value.stsTokenManager
        if (Number(t.expirationTime) < Date.now())
          return reject(new Error('token expired — reload the page and run again'))
        resolve({ jwt: t.accessToken, email: String(row.value.email || '').toLowerCase() })
      }
      all.onerror = () => reject(new Error('cannot read firebaseLocalStorage'))
    }
  })
  const H = { Authorization: `Bearer ${token.jwt}`, 'Content-Type': 'application/json' }
  console.log(`signed in as ${token.email}`)

  const q = async (body) => {
    const r = await fetch(`${BASE}:runQuery`, { method: 'POST', headers: H, body: JSON.stringify(body) })
    const text = await r.text()
    let ids = []
    if (r.ok) {
      try {
        ids = JSON.parse(text).map((row) => row?.document?.name?.split('/').pop()).filter(Boolean)
      } catch { /* empty result bodies are not always JSON arrays */ }
    }
    return { status: r.status, ids, text }
  }
  const select = (where) => ({
    structuredQuery: { from: [{ collectionId: 'eventOverrides' }], ...(where ? { where } : {}) },
  })

  let fails = 0
  const check = (label, ok, detail) => {
    if (!ok) fails++
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${label}${detail ? '  — ' + detail : ''}`)
  }

  // --- who the roster says you are ---
  const rosterRes = await fetch(`${BASE}/config/committee`, { headers: H })
  const roster = rosterRes.ok ? await rosterRes.json() : null
  const field = (n) => roster?.fields?.[n]
  const isAdmin = (field('admins')?.arrayValue?.values ?? []).some(
    (v) => String(v.stringValue).toLowerCase() === token.email
  )
  const managersMap = field('managers')?.mapValue?.fields ?? null
  const manages = Object.entries(managersMap ?? {})
    .filter(([, v]) => (v.arrayValue?.values ?? []).some((x) => String(x.stringValue).toLowerCase() === token.email))
    .map(([k]) => k)
  console.log(`roster says: admin=${isAdmin}  manages=[${manages.join(', ')}]`)
  check('the roster carries a managers map', !!managersMap,
    managersMap ? '' : 'scoping is NOT live yet — an admin has to open Committee and save once')
  if (isAdmin) {
    console.log('\nYou are an admin, so the rules allow you everything by design.')
    console.log('Run this again signed in as a manager and as a volunteer — that is the test.')
    return
  }

  // --- 1. the wide read ---
  const wide = await q(null)
  check('the whole collection is refused', wide.status === 403,
    `HTTP ${wide.status}${wide.status === 200 ? ` and returned ${wide.ids.length} events` : ''}`)

  // --- 2. the scoped reads ---
  if (manages.length) {
    const mine = await q(select({
      fieldFilter: {
        field: { fieldPath: 'committee' }, op: 'IN',
        value: { arrayValue: { values: manages.map((c) => ({ stringValue: c })) } },
      },
    }))
    check('your committees’ events come back', mine.status === 200, `HTTP ${mine.status}, ${mine.ids.length} events`)
    var seen = mine.ids
  } else {
    console.log('ok    you manage nothing, so there is no committee query to make')
    var seen = []
  }
  const onMe = await q(select({
    fieldFilter: {
      field: { fieldPath: 'participants' }, op: 'ARRAY_CONTAINS',
      value: { stringValue: token.email },
    },
  }))
  check('the events you are on come back', onMe.status === 200, `HTTP ${onMe.status}, ${onMe.ids.length} events`)
  const visible = [...new Set([...seen, ...onMe.ids])]

  // --- 3. a document you should not see ---
  // Found by asking for one you can see and walking the seed ids; any id that
  // is not in `visible` is a fair target. If every saved event is visible to
  // you there is nothing to test here and the script says so.
  const probe = await fetch(`${BASE}/eventOverrides?pageSize=300`, { headers: H })
  if (probe.status === 403) {
    console.log('ok    listing the collection is refused too (HTTP 403)')
    console.log('note  cannot discover a forbidden id without admin; ask an admin for one and run:')
    console.log(`      await fetch('${BASE}/eventOverrides/<id>', {headers:{Authorization:'Bearer '+<jwt>}})`)
  } else {
    const all = (await probe.json()).documents ?? []
    const forbidden = all.map((d) => d.name.split('/').pop()).find((id) => !visible.includes(id))
    check('a plain list is refused', probe.status === 403, `HTTP ${probe.status}`)
    if (forbidden) {
      const one = await fetch(`${BASE}/eventOverrides/${forbidden}`, { headers: H })
      check(`fetching ${forbidden} by id is refused`, one.status === 403, `HTTP ${one.status}`)
    }
  }

  // --- 4. what you can see ---
  console.log(`\nvisible to you: ${visible.length} saved event record(s)`)
  console.log(visible.join(', ') || '(none)')
  console.log('\nCompare that with the calendar on screen. They must match.')
  console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S) — do not call this done`)
})()
