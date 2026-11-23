// What the AI chat may know: the current (or demo) time and every place as the app shows it right
// now. Public place data only; nothing about the user.
import { allPlaces } from '../data/places'
import { DAY_NAMES, hhmm, type Now } from './clock'
import { crowdShortLabel } from './crowd'
import { placeCrowd } from './crowdModel'

const MAX_FACILITIES = 8
/** The AI function accepts at most 80 places (netlify/lib/grounding.ts). */
const MAX_PLACES = 80

export interface ChatPlaceRow {
  id: string
  name: string
  category: string
  campus: string
  distanceM: number
  area: string
  hours: string
  status: string
  priceMin: number
  priceMax: number
  facilities: string[]
  menu: [string, number][]
}

export interface ChatContext {
  now: string
  places: ChatPlaceRow[]
}

export function chatContext(now: Now): ChatContext {
  return {
    now: `${DAY_NAMES[now.day]} ${hhmm(now.minute)}`,
    places: allPlaces().slice(0, MAX_PLACES).map((place) => {
      const crowd = placeCrowd(place, now.day, now.minute)
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        campus: place.campus,
        distanceM: place.distanceM,
        area: place.area,
        hours: place.openHours,
        status: crowd.closed ? 'Tutup' : crowdShortLabel(crowd.level),
        priceMin: place.priceMin,
        priceMax: place.priceMax,
        facilities: [...new Set([...place.facilities, ...place.tags])].slice(0, MAX_FACILITIES),
        menu: place.menu.map((item): [string, number] => [item.name, item.price]),
      }
    }),
  }
}
