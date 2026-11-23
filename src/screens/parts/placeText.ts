// Display strings derived from a Place, shared by several screens.
import type { Area, Place } from '../../state/types'
import type { PlaceCrowd } from '../../lib/crowdModel'
import { formatDistance } from '../../lib/format'

const AREA_LABEL: Readonly<Record<Area, string>> = {
  Basement: 'FOODPARK Basement',
  Outdoor: 'Kantin Outdoor',
  'Lantai 1': 'Lantai 1',
  'Lantai 5': 'Lantai 5',
  Kampus: 'Kampus',
  'Sekitar kampus': 'Sekitar',
}

/** "FOODPARK Basement", "Kampus Syahdan", "Sekitar Anggrek". */
export function areaLabel(place: Place): string {
  const label = AREA_LABEL[place.area]
  return place.area === 'Kampus' || place.area === 'Sekitar kampus' ? `${label} ${place.campus}` : label
}

/** "FOODPARK Basement · 60 m" */
export function areaDistance(place: Place): string {
  return `${areaLabel(place)} · ${formatDistance(place.distanceM)}`
}

/** "tutup" suffix for the crowd pill of a closed place. */
export function crowdDetail(crowd: PlaceCrowd): string | undefined {
  return crowd.closed ? 'tutup' : undefined
}

/** Opening time, the first half of "17.00–22.00". */
export function opensAt(place: Place): string {
  return place.openHours.split('–')[0] ?? place.openHours
}
