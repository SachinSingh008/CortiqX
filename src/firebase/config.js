import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

/**
 * Prefer VITE_* vars (see .env.example). Optional fallback matches legacy CortiqX project
 * so existing deployments keep working when .env is not set.
 */
const fromEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
}

const fallback = {
  apiKey: 'AIzaSyA-gVYdfMpzlgOO8HcdMVL9mkZe8TblQMc',
  authDomain: 'cortiq-5f624.firebaseapp.com',
  projectId: 'cortiq-5f624',
  storageBucket: 'cortiq-5f624.firebasestorage.app',
  messagingSenderId: '266138323486',
  appId: '1:266138323486:web:9ca50e1064244aaeaf7c0f',
  measurementId: 'G-2JM0KCWP4P',
}

const useFallback = !fromEnv.apiKey || !fromEnv.projectId
const firebaseConfig = useFallback ? fallback : fromEnv

export const isFirebaseFromEnv = !useFallback

const app = initializeApp(firebaseConfig)

let analytics = null
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app)
  } catch {
    /* analytics unavailable (SSR, blocked, etc.) */
  }
}

const auth = getAuth(app)

/**
 * Firestore transport:
 * - Forced long-polling avoids WebChannel streaming that often hits HTTP/3 (QUIC) on
 *   firestore.googleapis.com; QUIC packet loss surfaces as QUIC_TOO_MANY_RTOS in DevTools.
 * - Must not set experimentalForceLongPolling and experimentalAutoDetectLongPolling both true
 *   (Firebase INVALID_ARGUMENT). When forcing long-poll, auto-detect is explicitly false.
 * - Opt out (max throughput on stable networks): VITE_FIRESTORE_LONG_POLLING=false
 *
 * @see https://firebase.google.com/docs/firestore/manage-data/enable-network
 */
const longPollingDisabled =
  import.meta.env.VITE_FIRESTORE_LONG_POLLING === 'false' ||
  import.meta.env.VITE_FIRESTORE_LONG_POLLING === '0'

/** @type {import('firebase/firestore').FirestoreSettings} */
const firestoreSettings = longPollingDisabled
  ? {
      ignoreUndefinedProperties: true,
    }
  : {
      ignoreUndefinedProperties: true,
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    }

let db
try {
  db = initializeFirestore(app, firestoreSettings)
} catch (e) {
  const msg = String(e?.message ?? '')
  if (e?.code === 'failed-precondition' && msg.includes('initializeFirestore')) {
    db = getFirestore(app)
  } else {
    throw e
  }
}
const storage = getStorage(app)
const functions = getFunctions(app)

/** Same-origin API route (e.g. Vercel) or full URL via VITE_SEND_MAIL_URL */
export const sendMailFunctionUrl = import.meta.env.VITE_SEND_MAIL_URL ?? '/api/sendMail'

export { app, analytics, auth, db, storage, functions }
