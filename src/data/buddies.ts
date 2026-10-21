import type { Buddy } from '../state/types'

// Fictional, NIM-verified fellow students. `activeOrders` here is the load at the
// start of the demo; live load (incl. the user's own active orders) comes from
// useBuddy()/getBuddyLoad() in state/AppState.tsx.
export const BUDDIES: readonly Buddy[] = [
  { id: 'raka', name: 'Raka A.', rating: 4.9, tasks: 120, nimVerified: true, activeOrders: 1 },
  { id: 'nathan', name: 'Nathan A.', rating: 4.8, tasks: 86, nimVerified: true, activeOrders: 0 },
  { id: 'salsa', name: 'Salsa P.', rating: 4.8, tasks: 64, nimVerified: true, activeOrders: 1 },
  { id: 'dimas', name: 'Dimas R.', rating: 4.7, tasks: 41, nimVerified: true, activeOrders: 0 },
]

export function getBuddy(id: string): Buddy | undefined {
  return BUDDIES.find((buddy) => buddy.id === id)
}
