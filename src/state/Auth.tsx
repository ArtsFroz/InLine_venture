import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type AuthProvider as FirebaseAuthProvider,
  type User,
} from 'firebase/auth'
import { MICROSOFT_TENANT, firebaseConfigured, getFirebaseAuth } from '../lib/firebase'

const BINUS_DOMAIN = '@binus.ac.id'

export interface AuthUser {
  uid: string
  name: string
  email: string
  provider: 'google' | 'microsoft' | 'password' | 'demo'
  /** Google and Microsoft emails count as verified; email/password accounts must click the link. */
  emailVerified: boolean
  /** A Microsoft account is linked to this InLine account. */
  microsoftLinked: boolean
  /** The @binus.ac.id address the user proved they own (via Microsoft or a verified email), if any. */
  binusEmail: string | null
}

type Status = 'loading' | 'signedIn' | 'signedOut'

interface AuthCtx {
  status: Status
  user: AuthUser | null
  /** False when Firebase is not set up yet: only the demo login is offered. */
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  /** Adds the BINUS Microsoft account to the signed-in account (one account, two ways in). */
  linkMicrosoft: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
  /** Reloads the account (e.g. after the user clicked the verification link). */
  refreshUser: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signInDemo: () => void
  signOut: () => Promise<void>
}

const DEMO_KEY = 'inline-demo-session'
const DEMO_USER: AuthUser = {
  uid: 'demo',
  name: 'Pengguna Demo',
  email: 'demo@inline.app',
  provider: 'demo',
  emailVerified: true,
  microsoftLinked: false,
  binusEmail: null,
}

const isBinus = (email: string | null | undefined): email is string =>
  typeof email === 'string' && email.toLowerCase().endsWith(BINUS_DOMAIN)

function fromFirebase(user: User): AuthUser {
  const ids = user.providerData.map((p) => p.providerId)
  const microsoft = user.providerData.find((p) => p.providerId === 'microsoft.com')
  const email = user.email ?? microsoft?.email ?? ''
  const provider: AuthUser['provider'] = ids.includes('google.com')
    ? 'google'
    : ids.includes('microsoft.com') && !ids.includes('password')
      ? 'microsoft'
      : 'password'
  let binusEmail: string | null = null
  if (isBinus(microsoft?.email)) binusEmail = microsoft.email
  else if (isBinus(user.email) && user.emailVerified) binusEmail = user.email
  return {
    uid: user.uid,
    name: user.displayName?.trim() || email.split('@')[0] || 'Pengguna',
    email,
    provider,
    emailVerified: user.emailVerified || provider !== 'password',
    microsoftLinked: microsoft !== undefined,
    binusEmail: binusEmail ? binusEmail.toLowerCase() : null,
  }
}

function microsoftProvider(): OAuthProvider {
  const provider = new OAuthProvider('microsoft.com')
  provider.setCustomParameters({ tenant: MICROSOFT_TENANT, prompt: 'select_account' })
  return provider
}

/** Popup first; some phone browsers block popups, so continue with a full-page redirect. */
async function popupOrRedirect(provider: FirebaseAuthProvider): Promise<void> {
  const auth = getFirebaseAuth()
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    if (authCode(error) === 'auth/popup-blocked') await signInWithRedirect(auth, provider)
    else throw error
  }
}

function readDemoSession(): boolean {
  try {
    return window.localStorage.getItem(DEMO_KEY) === '1'
  } catch {
    return false
  }
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState(readDemoSession)
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(!firebaseConfigured)

  useEffect(() => {
    if (!firebaseConfigured) return undefined
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setFirebaseUser(user ? fromFirebase(user) : null)
      setReady(true)
    })
  }, [])

  const value = useMemo<AuthCtx>(() => {
    const user = firebaseUser ?? (demo ? DEMO_USER : null)
    const setDemoSession = (on: boolean) => {
      try {
        if (on) window.localStorage.setItem(DEMO_KEY, '1')
        else window.localStorage.removeItem(DEMO_KEY)
      } catch {
        // Storage blocked: the session lasts until reload.
      }
      setDemo(on)
    }
    const current = () => {
      const signedIn = getFirebaseAuth().currentUser
      if (!signedIn) throw new Error('Belum masuk')
      return signedIn
    }
    return {
      status: !ready ? 'loading' : user ? 'signedIn' : 'signedOut',
      user,
      configured: firebaseConfigured,
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        await popupOrRedirect(provider)
      },
      signInWithMicrosoft: () => popupOrRedirect(microsoftProvider()),
      linkMicrosoft: async () => {
        const signedIn = current()
        try {
          await linkWithPopup(signedIn, microsoftProvider())
        } catch (error) {
          if (authCode(error) === 'auth/popup-blocked') await linkWithRedirect(signedIn, microsoftProvider())
          else throw error
        }
        await signedIn.reload()
        // A new token so Firestore rules see the linked Microsoft identity right away.
        await signedIn.getIdToken(true)
        setFirebaseUser(fromFirebase(signedIn))
      },
      sendVerificationEmail: async () => {
        await sendEmailVerification(current())
      },
      refreshUser: async () => {
        const signedIn = current()
        await signedIn.reload()
        // A new token so Firestore rules see email_verified right away.
        await signedIn.getIdToken(true)
        setFirebaseUser(fromFirebase(signedIn))
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      },
      signUpWithEmail: async (name, email, password) => {
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
        await updateProfile(credential.user, { displayName: name.trim() })
        setFirebaseUser(fromFirebase(credential.user))
        // If sending fails here, Profil offers "Kirim ulang".
        await sendEmailVerification(credential.user).catch(() => undefined)
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
      },
      signInDemo: () => setDemoSession(true),
      signOut: async () => {
        setDemoSession(false)
        if (firebaseConfigured) await firebaseSignOut(getFirebaseAuth())
      },
    }
  }, [firebaseUser, demo, ready])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

function authCode(error: unknown): string {
  return error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''
}

/** User-facing Indonesian message for a Firebase Auth error. */
export function authErrorMessage(error: unknown): string {
  const code = authCode(error)
  if (code.startsWith('auth/api-key-not-valid')) return 'Konfigurasi Firebase tidak valid (cek VITE_FIREBASE_*).'
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // Firebase gives the same code for an account made with Google, which has no password.
      return 'Email atau password salah. Kalau akunmu dibuat lewat Google, pakai tombol "Masuk dengan Google".'
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk.'
    case 'auth/weak-password':
      return 'Password minimal 8 karakter.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'Login dibatalkan.'
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan cara lain. Masuk dengan Google atau email dulu, lalu hubungkan akun Microsoft di Profil.'
    case 'auth/credential-already-in-use':
      return 'Akun Microsoft ini sudah dipakai akun InLine lain.'
    case 'auth/provider-already-linked':
      return 'Akun Microsoft sudah terhubung.'
    case 'auth/requires-recent-login':
      return 'Demi keamanan, keluar lalu masuk lagi, kemudian ulangi.'
    case 'auth/admin-restricted-operation':
      return 'Akun kampus belum mengizinkan aplikasi ini (butuh persetujuan admin). Pakai Google atau email dulu.'
    case 'auth/network-request-failed':
      return 'Tidak ada koneksi internet.'
    case 'auth/unauthorized-domain':
      return 'Domain ini belum diizinkan di Firebase (Authorized domains).'
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase.'
    default:
      return 'Terjadi kesalahan. Coba lagi.'
  }
}
