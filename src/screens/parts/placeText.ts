// Display strings derived from a Place, shared by several screens.
import type { Place } from '../../state/types'
import type { PlaceCrowd } from '../../lib/crowdModel'
import { formatDistance } from '../../lib/format'

/** "4.8 · 300 m" */
export function ratingDistance(place: Place): string {
  return `${place.rating.toFixed(1)} · ${formatDistance(place.distanceM)}`
}

/** "tutup" suffix for the crowd pill of a closed place. */
export function crowdDetail(crowd: PlaceCrowd): string | undefined {
  return crowd.closed ? 'tutup' : undefined
}

/** Opening time, the first half of "17.00–22.00". */
export function opensAt(place: Place): string {
  return place.openHours.split('–')[0] ?? place.openHours
}
