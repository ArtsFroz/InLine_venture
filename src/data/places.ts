import type { Area, Campus, Category, MenuItem, Place } from '../state/types'

// Food places at BINUS @Kemanggisan. Tenant names: FOODPARK Basement from the BINUS announcement
// (April 2025, Beehive Mart has since closed); Kantin Outdoor, Lantai 1 and Lantai 5 from the team's
// own visits. Menus, prices, opening hours and walking distances are ESTIMATES until checked on site
// (the app labels them "perkiraan"). Only Starbucks' hours (07.00–20.00) come from a public listing.
// Places added by students arrive later from Firestore (see setCommunityPlaces / lib/placeSuggestions.ts).
// Crowd is not stored here: it is estimated from the class schedule (lib/crowdModel.ts).

function menu(placeId: string, items: ReadonlyArray<readonly [string, number]>): MenuItem[] {
  return items.map(([name, price], index) => ({ id: `${placeId}-m${index + 1}`, name, price }))
}

interface PlaceSeed {
  id: string
  name: string
  category: Category
  type: string
  campus: Campus
  area: Area
  distanceM: number
  openHours: string
  facilities: string[]
  tags: string[]
  waitMin: number
  queueCount: number
  menu: ReadonlyArray<readonly [string, number]>
}

function build(seed: PlaceSeed): Place {
  const { menu: menuItems, ...rest } = seed
  const prices = menuItems.map(([, price]) => price)
  return {
    ...rest,
    source: 'tim',
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    menu: menu(seed.id, menuItems),
  }
}

// FOODPARK: indoor, air-conditioned; BINUS says every tenant has halal food.
const FOODPARK = { campus: 'Anggrek', area: 'Basement', distanceM: 60, openHours: '07.00–18.00', facilities: ['Indoor ber-AC', 'Area makan'] } as const
const FOODPARK_TAGS = ['FOODPARK', 'Dekat Anggrek', 'Halal', 'Dine in', 'Take away']
const OUTDOOR = { campus: 'Anggrek', area: 'Outdoor', distanceM: 120, openHours: '07.00–17.00', facilities: ['Outdoor', 'Area makan'] } as const
const OUTDOOR_TAGS = ['Kantin Outdoor', 'Dekat Anggrek', 'Dine in', 'Take away']
const LANTAI_1 = { campus: 'Anggrek', area: 'Lantai 1', distanceM: 30, facilities: ['Indoor'] } as const
const LANTAI_1_TAGS = ['Lantai 1', 'Dekat Anggrek', 'Take away']

const SEEDS: PlaceSeed[] = [
  // ——— Anggrek · FOODPARK Basement ———
  {
    ...FOODPARK, id: 'bicasa-coffee', name: 'BICASA Coffee', category: 'Kopi', type: 'Kedai kopi',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 4, queueCount: 3,
    menu: [['Kopi Susu BICASA', 18000], ['Americano', 15000], ['Caffe Latte', 22000], ['Matcha Latte', 24000]],
  },
  {
    ...FOODPARK, id: 'rasa-sayange', name: 'Rasa Sayange', category: 'Kantin', type: 'Masakan Indonesia',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 8, queueCount: 6,
    menu: [['Nasi Ayam Goreng', 22000], ['Nasi Ayam Bakar', 25000], ['Nasi Campur', 24000], ['Es Teh Manis', 6000]],
  },
  {
    ...FOODPARK, id: 'cerita-cinta', name: 'Cerita Cinta', category: 'Kantin', type: 'Tenant FOODPARK',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 7, queueCount: 5,
    menu: [['Nasi Ayam Penyet', 22000], ['Nasi Telur Balado', 18000], ['Es Jeruk', 8000]],
  },
  {
    ...FOODPARK, id: 'chicken-oriental', name: 'Chicken Oriental', category: 'Kantin', type: 'Masakan oriental',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 9, queueCount: 7,
    menu: [['Nasi Ayam Cah Jamur', 25000], ['Chicken Rice Bowl', 24000], ['Ayam Saus Mentega', 27000], ['Es Teh Manis', 6000]],
  },
  {
    ...FOODPARK, id: 'good-waffle', name: 'Good Waffle', category: 'Snack', type: 'Waffle',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 5, queueCount: 2,
    menu: [['Waffle Cokelat', 18000], ['Waffle Keju', 18000], ['Waffle Es Krim', 25000]],
  },
  {
    ...FOODPARK, id: 'rasela', name: 'Rasela', category: 'Kantin', type: 'Tenant FOODPARK',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 7, queueCount: 5,
    menu: [['Nasi Ayam Rica', 23000], ['Nasi Sayur Lauk', 20000], ['Es Teh Manis', 6000]],
  },
  {
    ...FOODPARK, id: 'bakmi-effata', name: 'Bakmi Effata', category: 'Kantin', type: 'Bakmi',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 10, queueCount: 8,
    menu: [['Bakmi Ayam', 22000], ['Bakmi Ayam Pangsit', 27000], ['Pangsit Goreng', 15000], ['Es Teh Manis', 6000]],
  },
  {
    ...FOODPARK, id: 'yoshinoya-foodpark', name: 'Yoshinoya (FOODPARK)', category: 'Kantin', type: 'Rice bowl Jepang',
    facilities: [...FOODPARK.facilities], tags: FOODPARK_TAGS, waitMin: 8, queueCount: 6,
    menu: [['Beef Bowl', 45000], ['Chicken Teriyaki Bowl', 40000], ['Ocha', 10000]],
  },

  // ——— Anggrek · Kantin Outdoor ———
  {
    ...OUTDOOR, id: 'nasi-ayam-hainan', name: 'Nasi Ayam Hainan', category: 'Kantin', type: 'Nasi hainan',
    facilities: [...OUTDOOR.facilities], tags: OUTDOOR_TAGS, waitMin: 8, queueCount: 6,
    menu: [['Nasi Ayam Hainan Rebus', 22000], ['Nasi Ayam Hainan Panggang', 25000], ['Es Teh Manis', 6000]],
  },
  {
    ...OUTDOOR, id: 'jus-buah', name: 'Jus Buah', category: 'Minuman', type: 'Kedai jus',
    facilities: [...OUTDOOR.facilities], tags: OUTDOOR_TAGS, waitMin: 4, queueCount: 3,
    menu: [['Jus Alpukat', 15000], ['Jus Mangga', 13000], ['Jus Jeruk', 12000]],
  },

  // ——— Anggrek · Lantai 1 ———
  {
    ...LANTAI_1, id: 'starbucks', name: 'Starbucks', category: 'Kopi', type: 'Kafe', openHours: '07.00–20.00',
    facilities: ['Indoor', 'Area nugas'], tags: LANTAI_1_TAGS, waitMin: 6, queueCount: 4,
    menu: [['Caffe Latte', 50000], ['Java Chip Frappuccino', 62000], ['Americano', 42000], ['Croissant', 30000]],
  },
  {
    ...LANTAI_1, id: 'aw', name: 'A&W', category: 'Kantin', type: 'Fast food', openHours: '08.00–20.00',
    facilities: [...LANTAI_1.facilities], tags: LANTAI_1_TAGS, waitMin: 7, queueCount: 4,
    menu: [['Paket Ayam + Nasi', 40000], ['Burger', 35000], ['Root Beer', 20000], ['Waffle Fries', 25000]],
  },
  {
    ...LANTAI_1, id: 'charmony', name: 'Charmony Fresh Milk Tea', category: 'Minuman', type: 'Milk tea', openHours: '09.00–20.00',
    facilities: [...LANTAI_1.facilities], tags: LANTAI_1_TAGS, waitMin: 5, queueCount: 3,
    menu: [['Fresh Milk Tea', 28000], ['Matcha Milk Tea', 37000], ['Peach Oolong Milk Tea', 32000]],
  },
  {
    ...LANTAI_1, id: 'yoshinoya-lantai-1', name: 'Yoshinoya (Lantai 1)', category: 'Kantin', type: 'Rice bowl Jepang', openHours: '08.00–20.00',
    facilities: [...LANTAI_1.facilities], tags: LANTAI_1_TAGS, waitMin: 6, queueCount: 4,
    menu: [['Beef Bowl', 45000], ['Chicken Teriyaki Bowl', 40000], ['Ocha', 10000]],
  },
  {
    ...LANTAI_1, id: 'hokben', name: 'HokBen', category: 'Kantin', type: 'Masakan Jepang', openHours: '08.00–20.00',
    facilities: [...LANTAI_1.facilities], tags: LANTAI_1_TAGS, waitMin: 7, queueCount: 5,
    menu: [['Bento Chicken Teriyaki', 52000], ['Ekkado (3 pcs)', 25000], ['Chicken Katsu Rice', 45000], ['Ocha', 12000]],
  },

  // ——— Anggrek · Lantai 5 ———
  {
    id: 'kantin-lantai-5', name: 'Kantin Lantai 5', category: 'Snack', type: 'Minimarket kampus', campus: 'Anggrek', area: 'Lantai 5',
    distanceM: 90, openHours: '07.00–18.00', facilities: ['Indoor', 'Take away'], tags: ['Lantai 5', 'Dekat Anggrek', 'Take away'],
    waitMin: 3, queueCount: 2,
    menu: [['Roti / snack', 8000], ['Minuman dingin', 7000], ['Kopi kemasan', 12000], ['Makanan kotak', 22000]],
  },

  // ——— Other campuses (tenant names not known yet) ———
  {
    id: 'foodpark-syahdan', name: 'FoodPark Syahdan', category: 'Kantin', type: 'Kantin semi-outdoor', campus: 'Syahdan', area: 'Kampus',
    distanceM: 100, openHours: '07.00–19.00', facilities: ['Outdoor', 'Area makan'], tags: ['Dekat Syahdan', 'Dine in', 'Take away'],
    waitMin: 6, queueCount: 4,
    menu: [['Nasi Ayam Penyet', 18000], ['Mie Ayam', 17000], ['Es Teh Manis', 5000]],
  },
  {
    id: 'kantin-kijang', name: 'Kantin Kijang', category: 'Kantin', type: 'Kantin', campus: 'Kijang', area: 'Kampus',
    distanceM: 80, openHours: '07.00–18.00', facilities: ['Area makan'], tags: ['Dekat Kijang', 'Dine in'],
    waitMin: 6, queueCount: 4,
    menu: [['Nasi Ayam Bakar', 22000], ['Soto Ayam', 18000], ['Es Jeruk', 7000]],
  },
  {
    id: 'kantin-binus-square', name: 'Kantin Binus Square', category: 'Kantin', type: 'Food court asrama', campus: 'Binus Square', area: 'Kampus',
    distanceM: 80, openHours: '07.00–21.00', facilities: ['Indoor', 'Area makan'], tags: ['Dekat Binus Square', 'Dine in', 'Take away'],
    waitMin: 8, queueCount: 6,
    menu: [['Nasi Ayam Geprek', 20000], ['Nasi Goreng', 20000], ['Es Teh Manis', 5000]],
  },
]

export const PLACES: readonly Place[] = SEEDS.map(build)

/** Home "Rekomendasi untukmu" starts with these, then the quietest open places. */
export const RECOMMENDED_PLACE_IDS: readonly string[] = ['bicasa-coffee', 'bakmi-effata']

// ——— Places added by students (approved in /admin, loaded from Firestore) ———

/** Ids of student places start with this, so they never collide with the ids above. */
export const COMMUNITY_ID_PREFIX = 'c-'

let community: readonly Place[] = []
let all: readonly Place[] = PLACES
const listeners = new Set<() => void>()

export function setCommunityPlaces(next: readonly Place[]): void {
  community = next
  all = [...PLACES, ...community]
  listeners.forEach((listener) => listener())
}

export function subscribePlaces(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Every place: the team's list plus approved student places. */
export function allPlaces(): readonly Place[] {
  return all
}

export function getPlace(id: string): Place | undefined {
  return all.find((place) => place.id === id)
}
