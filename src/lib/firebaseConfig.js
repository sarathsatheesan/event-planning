// Firebase web config for the ICC EventOps project.
//
// These values are NOT secrets. A Firebase web config is public by design —
// it ships in every browser bundle of every Firebase web app. What protects the
// data is the Firestore security rules plus Google sign-in, not hiding this
// object. See firestore.rules in the repo root for the rules that matter.
//
// Project: "Event Planning" (event-planning-de705), owned by utahindiacc@gmail.com.
// Web app: ICCEventOps.

export const firebaseConfig = {
  apiKey: 'AIzaSyCLBf09dsR-segNzWCUbH-8BckQhqopjtY',
  authDomain: 'event-planning-de705.firebaseapp.com',
  projectId: 'event-planning-de705',
  storageBucket: 'event-planning-de705.firebasestorage.app',
  messagingSenderId: '592737806951',
  appId: '1:592737806951:web:d627705b75d496ded402c2',
}

/**
 * Who is allowed to edit. This list is a UI convenience — it decides whether
 * the app treats you as a committee member. The real enforcement is the
 * identical list in firestore.rules, which runs on Google's servers and cannot
 * be bypassed by editing the page. Keep the two in step.
 *
 * Add the rest of the committee here and in firestore.rules, lower-case.
 */
export const COMMITTEE_EMAILS = [
  'utahindiacc@gmail.com',
  'sarath.s1884@gmail.com',
  'info@iccofutah.org',
]

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
