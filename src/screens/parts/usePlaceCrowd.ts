import { useNow } from '../../lib/clock'
import { placeCrowd, type PlaceCrowd } from '../../lib/crowdModel'
import type { Place } from '../../state/types'

/** Crowd estimate for a place at the current prediction time (re-renders when the clock moves). */
export function usePlaceCrowd(place: Place): PlaceCrowd {
  const now = useNow()
  return placeCrowd(place, now.day, now.minute)
}
