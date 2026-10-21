// Display strings derived from a Place, shared by several screens.
import type { Place } from '../../state/types'
import { formatDistance } from '../../lib/format'

/** "4.8 · 300 m" */
export function ratingDistance(place: Place): string {
  return `${place.rating.toFixed(1)} · ${formatDistance(place.distanceM)}`
}

/** "±5 mnt" (AI wait estimate) or "tutup" for a closed place — the suffix of the crowd pill. */
export function crowdDetail(place: Place): string {
  return place.isOpen ? `±${place.waitMin} mnt` : 'tutup'
}

/** Opening time, the first half of "17.00–22.00". */
export function opensAt(place: Place): string {
  return place.openHours.split('–')[0] ?? place.openHours
}
