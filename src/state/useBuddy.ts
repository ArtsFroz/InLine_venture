// Live buddy-verification state for the signed-in account (Firestore), plus the admin flag.
import { useEffect, useState } from 'react'
import { firebaseConfigured } from '../lib/firebase'
import { firestoreErrorMessage, watchIsAdmin, watchMyApplication, type BuddyApplication } from '../lib/buddyApplication'
import { useAuth } from './Auth'

export type BuddyAccess =
  | { kind: 'loading' }
  /** Firebase not configured (local demo): Mode Buddy stays open as before. */
  | { kind: 'demo' }
  | { kind: 'none' }
  | { kind: 'error'; message: string }
  | { kind: 'application'; application: BuddyApplication }

interface Snapshot {
  uid: string
  access: BuddyAccess
}

export function useBuddyAccess(): BuddyAccess {
  const { user } = useAuth()
  const uid = firebaseConfigured && user && user.provider !== 'demo' ? user.uid : null
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  useEffect(() => {
    if (!uid) return undefined
    return watchMyApplication(
      uid,
      (application) => setSnapshot({ uid, access: application ? { kind: 'application', application } : { kind: 'none' } }),
      (error) => setSnapshot({ uid, access: { kind: 'error', message: firestoreErrorMessage(error) } }),
    )
  }, [uid])

  if (!uid) return { kind: 'demo' }
  return snapshot?.uid === uid ? snapshot.access : { kind: 'loading' }
}

/** True when the buddy application is approved, or in the local demo without Firebase. */
export function canUseBuddyMode(access: BuddyAccess): boolean {
  return access.kind === 'demo' || (access.kind === 'application' && access.application.status === 'verified')
}

export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const uid = firebaseConfigured && user && user.provider !== 'demo' ? user.uid : null
  const [admin, setAdmin] = useState<{ uid: string; value: boolean } | null>(null)

  useEffect(() => {
    if (!uid) return undefined
    return watchIsAdmin(uid, (value) => setAdmin({ uid, value }))
  }, [uid])

  return uid !== null && admin?.uid === uid && admin.value
}
