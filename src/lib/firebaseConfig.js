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
 * The committee now lives in Firestore at config/committee and is managed in
 * the app — this is only what to believe before that document exists or while
 * it is loading. It mirrors the fallback in firestore.rules and storage.rules;
 * once the roster is saved for the first time, all three stop mattering.
 *
 * Adding someone to the committee is no longer a code change. Use the
 * Committee screen in the app.
 */
export const FALLBACK_COMMITTEE = {
  emails: ['utahindiacc@gmail.com', 'sarath.s1884@gmail.com', 'info@iccofutah.org'],
  admins: ['utahindiacc@gmail.com', 'sarath.s1884@gmail.com'],
}

/** Permanent owners, matching bootstrapAdmins() in both rule files. These
 *  addresses are always admins, so the committee cannot lock itself out by
 *  removing the last one. */
export const BOOTSTRAP_ADMINS = ['utahindiacc@gmail.com']

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
