// Firebase Authentication (Google, Microsoft, email/password) and Firestore (buddy verification).
// The web config is public by design; access is limited by the authorized domains set in the
// Firebase console and by firestore.rules.
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** False until the four VITE_FIREBASE_* values are set (see .env.example). */
export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

/** Microsoft tenant for "Masuk dengan Microsoft": the BINUS domain by default (see docs/SETUP-LOGIN.md). */
export const MICROSOFT_TENANT = (import.meta.env.VITE_MICROSOFT_TENANT as string | undefined)?.trim() || 'binus.ac.id'
/** Shown when Microsoft sign-in is turned off (VITE_MICROSOFT_LOGIN=off), e.g. while BINUS blocks consent. */
export const microsoftLoginEnabled = (import.meta.env.VITE_MICROSOFT_LOGIN as string | undefined) !== 'off'

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

function getApp(): FirebaseApp {
  if (!firebaseConfigured) throw new Error('Firebase belum dikonfigurasi')
  app ??= initializeApp(config)
  return app
}

export function getFirebaseAuth(): Auth {
  auth ??= getAuth(getApp())
  return auth
}

export function getDb(): Firestore {
  db ??= getFirestore(getApp())
  return db
}
