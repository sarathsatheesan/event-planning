import {
  firebaseConfig,
  isFirebaseConfigured,
  FALLBACK_COMMITTEE,
  BOOTSTRAP_ADMINS,
} from './firebaseConfig.js'

// Firebase is loaded on demand. Unconfigured (or signed-out) visitors never
// download ~200KB of SDK they cannot use, and the app keeps working offline
// against localStorage exactly as before.
let appPromise = null

async function getFirebase() {
  if (!isFirebaseConfigured) return null
  if (!appPromise) {
    appPromise = (async () => {
      const [{ initializeApp }, auth, store, storage, functions] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
        import('firebase/storage'),
        import('firebase/functions'),
      ])
      const app = initializeApp(firebaseConfig)
      return {
        app,
        auth,
        store,
        storage,
        functions,
        authInstance: auth.getAuth(app),
        db: store.getFirestore(app),
        bucket: storage.getStorage(app),
        // Must match REGION in functions/index.js, or the call 404s.
        fns: functions.getFunctions(app, 'us-central1'),
      }
    })()
  }
  return appPromise
}

const lower = (list) => (list ?? []).map((e) => String(e).toLowerCase())

/**
 * Membership, decided against the live roster when we have it.
 *
 * `roster` is null before the document has loaded or when none exists, in
 * which case the source fallback applies. A roster that loaded but excludes
 * this person — including one that came back empty because the read was
 * denied — means exactly that: not a member.
 */
export function canEdit(user, roster) {
  if (!user?.email) return false
  const email = user.email.toLowerCase()
  if (BOOTSTRAP_ADMINS.map((e) => e.toLowerCase()).includes(email)) return true
  return lower(roster ? roster.emails : FALLBACK_COMMITTEE.emails).includes(email)
}

/** Who may change the roster itself. */
export function canManageCommittee(user, roster) {
  if (!user?.email) return false
  const email = user.email.toLowerCase()
  if (BOOTSTRAP_ADMINS.map((e) => e.toLowerCase()).includes(email)) return true
  return lower(roster ? roster.admins : FALLBACK_COMMITTEE.admins).includes(email)
}

/** Calls back with the signed-in user (or null). Returns an unsubscribe fn. */
export async function watchAuth(onUser) {
  const fb = await getFirebase()
  if (!fb) {
    onUser(null)
    return () => {}
  }
  return fb.auth.onAuthStateChanged(fb.authInstance, onUser)
}

export async function signIn() {
  const fb = await getFirebase()
  if (!fb) return
  const provider = new fb.auth.GoogleAuthProvider()
  await fb.auth.signInWithPopup(fb.authInstance, provider)
}

// ---------------------------------------------------------------- email link
//
// Not every committee member has a Google account — a shared org mailbox
// often isn't one. Email-link sign-in covers them: Firebase mails a one-time
// link, and clicking it proves the person controls that mailbox, which is the
// same thing a Google sign-in proves. The allowlist and the security rules are
// unchanged, so this widens who can prove an identity, never who may edit.

// The address has to survive the round trip out to the mail client and back,
// because the link lands on a fresh page load with no memory of the request.
const EMAIL_KEY = 'eventops.emailForSignIn'

export function rememberedEmail() {
  try {
    return window.localStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

function rememberEmail(email) {
  try {
    window.localStorage.setItem(EMAIL_KEY, email)
  } catch {
    // Private browsing. The user is asked for the address on return instead.
  }
}

function forgetEmail() {
  try {
    window.localStorage.removeItem(EMAIL_KEY)
  } catch {
    // Nothing was stored, so nothing to clear.
  }
}

/** True when this page load came from a sign-in link we issued. */
export async function isEmailLink() {
  const fb = await getFirebase()
  if (!fb) return false
  return fb.auth.isSignInWithEmailLink(fb.authInstance, window.location.href)
}

export async function sendEmailLink(email) {
  const fb = await getFirebase()
  if (!fb) return
  await fb.auth.sendSignInLinkToEmail(fb.authInstance, email, {
    // Must be an authorised domain in Firebase Auth settings, or the link is
    // rejected on arrival. Deliberately drops any query or hash already here.
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  })
  rememberEmail(email)
}

export async function completeEmailLink(email) {
  const fb = await getFirebase()
  if (!fb) return
  await fb.auth.signInWithEmailLink(fb.authInstance, email, window.location.href)
  forgetEmail()
  // The link carries a single-use code. Signing in spends it, but leaving it
  // in the address bar puts it in history, bookmarks and shared screenshots.
  try {
    window.history.replaceState({}, '', window.location.origin + window.location.pathname)
  } catch {
    // Not worth failing a successful sign-in over.
  }
}

export async function signOutUser() {
  const fb = await getFirebase()
  if (!fb) return
  await fb.auth.signOut(fb.authInstance)
}

/**
 * Live subscription to every event's saved edits.
 *
 * One document per event rather than one big document for all of them: two
 * people editing different events would otherwise overwrite each other, and a
 * 130-milestone checklist would push a combined document toward Firestore's
 * 1MB limit.
 */
export async function watchOverrides(onChange, onError) {
  const fb = await getFirebase()
  if (!fb) return () => {}
  const { collection, onSnapshot } = fb.store
  return onSnapshot(
    collection(fb.db, 'eventOverrides'),
    (snap) => {
      const overrides = {}
      snap.forEach((doc) => {
        overrides[doc.id] = doc.data()
      })
      onChange(overrides)
    },
    onError
  )
}

/**
 * Live subscription to the committee roster.
 *
 * Attempted for anyone signed in, not only people we already believe are
 * members — otherwise somebody added to the roster could never learn that they
 * were, because reading it requires being on it. A denied read is the answer,
 * not an error: it means not a member.
 *
 * Calls back with the roster, or null when no roster document exists yet (use
 * the source fallback), or an empty roster when the read was refused.
 */
export async function watchCommittee(onChange) {
  const fb = await getFirebase()
  if (!fb) {
    onChange(null)
    return () => {}
  }
  const { doc, onSnapshot } = fb.store
  return onSnapshot(
    doc(fb.db, 'config', 'committee'),
    (snap) => onChange(snap.exists() ? snap.data() : null),
    () => onChange({ emails: [], admins: [], members: [] })
  )
}

export async function saveCommittee(roster) {
  const fb = await getFirebase()
  if (!fb) throw new Error('Cloud storage is not configured.')
  const { doc, setDoc } = fb.store
  await setDoc(doc(fb.db, 'config', 'committee'), roster)
}

/** Write one event's edits. Callers debounce; inline editing fires per keystroke. */
export async function saveOverride(eventId, data) {
  const fb = await getFirebase()
  if (!fb) return
  const { doc, setDoc } = fb.store
  await setDoc(doc(fb.db, 'eventOverrides', eventId), data)
}

export async function deleteOverride(eventId) {
  const fb = await getFirebase()
  if (!fb) return
  const { doc, deleteDoc } = fb.store
  await deleteDoc(doc(fb.db, 'eventOverrides', eventId))
}

// ------------------------------------------------------------ artist posters
//
// Images go to Cloud Storage rather than into the event document. A Firestore
// document caps at 1MB and India Mela's checklist alone is 130 entries, so
// base64 posters would break the event that needs them most.

/** Uploads an already-downscaled blob. Returns the path and a display URL. */
export async function uploadArtistPoster(eventId, blob) {
  const fb = await getFirebase()
  if (!fb) throw new Error('Cloud storage is not configured.')
  const { ref, uploadBytes, getDownloadURL } = fb.storage
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (blob.type.split('/')[1] ?? 'img')
  // Random suffix, not the original filename: two committee members uploading
  // "poster.jpg" for the same event must not overwrite each other.
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `artistPosters/${eventId}/${name}`
  const handle = ref(fb.bucket, path)
  await uploadBytes(handle, blob, { contentType: blob.type })
  return { path, url: await getDownloadURL(handle) }
}

/** Uploads a bio document as-is. The caller has already checked type and size. */
export async function uploadArtistBio(eventId, file, contentType) {
  const fb = await getFirebase()
  if (!fb) throw new Error('Cloud storage is not configured.')
  const { ref, uploadBytes, getDownloadURL } = fb.storage
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase()
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `artistBios/${eventId}/${name}`
  const handle = ref(fb.bucket, path)
  await uploadBytes(handle, file, { contentType })
  return { path, url: await getDownloadURL(handle), name: file.name, size: file.size }
}

/** Best-effort cleanup so removing a candidate does not orphan its files. */
export async function deleteArtistFile(path) {
  const fb = await getFirebase()
  if (!fb || !path) return
  const { ref, deleteObject } = fb.storage
  try {
    await deleteObject(ref(fb.bucket, path))
  } catch {
    // Already gone, or never uploaded. Not worth surfacing to the user.
  }
}

/**
 * Sends the weekly digest immediately. The function re-checks that the caller
 * is an admin: this button is hidden from everyone else, but a hidden button
 * is not a permission.
 */
export async function requestDigestNow(scope = 'upcoming') {
  const fb = await getFirebase()
  if (!fb) throw new Error('Cloud functions are not configured.')
  const { httpsCallable } = fb.functions
  const result = await httpsCallable(fb.fns, 'sendDigestNow')({ scope })
  return result.data
}

/**
 * What the Monday run would send, without sending it.
 *
 * The function it calls binds no SMTP secret, so there is no path from this
 * button to anyone's inbox. Admin-only, re-checked server side.
 */
export async function previewMondayReminders() {
  const fb = await getFirebase()
  if (!fb) throw new Error('Cloud functions are not configured.')
  const { httpsCallable } = fb.functions
  const result = await httpsCallable(fb.fns, 'previewMondayReminders')({})
  return result.data
}
