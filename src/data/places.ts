import type { Campus, Category, MenuItem, Place } from '../state/types'

// Mock places around the BINUS campuses. The 12 coffee places copy the values of
// the Figma frames "2 · Hasil AI" and "3 · Detail – <name>" verbatim
// (U+2011 in "Wi‑Fi", U+2013 in ranges). The 7 non-coffee places are fictional
// extras so the Kantin / Minuman / Snack categories are not empty.
// Crowd is not stored here: it is estimated from the class schedule (lib/crowdModel.ts).

const FIGMA_OPEN_HOURS = '07.00–22.00'
const PROMO_DISKON = 'Diskon 20% semua minuman kopi'
const PROMO_PAKET = 'Paket hemat mahasiswa Rp20.000'
const PROMO_CROISSANT = 'Beli 2 gratis 1 croissant'

function menu(placeId: string, items: ReadonlyArray<readonly [string, number]>): MenuItem[] {
  return items.map(([name, price], index) => ({ id: `${placeId}-m${index + 1}`, name, price }))
}

interface PlaceSeed {
  id: string
  name: string
  category: Category
  type: string
  campus: Campus
  rating: number
  reviews: number
  distanceM: number
  priceMin: number
  priceMax: number
  openHours?: string
  facilities: string[]
  tags: string[]
  waitMin: number
  queueCount: number
  promo?: string
  menu: ReadonlyArray<readonly [string, number]>
}

function build(seed: PlaceSeed): Place {
  const { menu: menuItems, ...rest } = seed
  return {
    ...rest,
    openHours: seed.openHours ?? FIGMA_OPEN_HOURS,
    image: `/images/places/${seed.id}.webp`,
    menu: menu(seed.id, menuItems),
  }
}

const SEEDS: PlaceSeed[] = [
  // ——— 12 Figma coffee places ———
  {
    id: 'kopi-tepi', name: 'Kopi Tepi', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.8, reviews: 120, distanceM: 300, priceMin: 20000, priceMax: 50000,
    facilities: ['Wi‑Fi', 'Colokan', 'Area nugas'], tags: ['Take away', 'Dekat Anggrek', 'Indoor', 'Wi‑Fi'],
    waitMin: 5, queueCount: 3,
    promo: PROMO_DISKON,
    menu: [['Es Kopi Susu', 22000], ['Croissant Cokelat', 18000], ['Air Mineral', 5000]],
  },
  {
    id: 'ruang-seduh', name: 'Ruang Seduh', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.6, reviews: 88, distanceM: 450, priceMin: 25000, priceMax: 45000,
    facilities: ['Wi‑Fi', 'Colokan', 'Indoor'], tags: ['Wi‑Fi', 'Buka malam', 'Take away', 'Dekat Anggrek'],
    waitMin: 4, queueCount: 1,
    promo: PROMO_CROISSANT,
    menu: [['Cappuccino', 28000], ['Croissant Butter', 25000], ['Es Teh Lemon', 18000]],
  },
  {
    id: 'kedai-senja', name: 'Kedai Senja', category: 'Kopi', type: 'Kafe', campus: 'Syahdan',
    rating: 4.5, reviews: 64, distanceM: 800, priceMin: 18000, priceMax: 40000,
    facilities: ['Wi‑Fi', 'Outdoor'], tags: ['Colokan', 'QRIS', 'Dekat Syahdan', 'Outdoor'],
    waitMin: 7, queueCount: 6,
    promo: PROMO_DISKON,
    menu: [['Es Kopi Aren', 20000], ['Pisang Goreng Keju', 18000], ['Teh Tarik', 15000]],
  },
  {
    id: 'kopi-kaca', name: 'Kopi Kaca', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.7, reviews: 92, distanceM: 250, priceMin: 18000, priceMax: 48000,
    facilities: ['Wi‑Fi', 'Colokan', 'Area nugas'], tags: ['Dekat Anggrek', 'Indoor', 'Wi‑Fi', 'Buka malam'],
    waitMin: 2, queueCount: 1,
    promo: PROMO_PAKET,
    menu: [['Caffe Latte', 26000], ['Es Kopi Aren', 18000], ['Paket Hemat Kopi + Roti', 20000], ['Air Mineral', 5000]],
  },
  {
    // Figma result meta line reads "v" (typo); values below come from its Detail frame.
    id: 'ruang-baca', name: 'Ruang Baca', category: 'Kopi', type: 'Kafe', campus: 'Kijang',
    rating: 4.9, reviews: 156, distanceM: 520, priceMin: 28000, priceMax: 55000,
    facilities: ['Wi‑Fi', 'Colokan', 'Perpustakaan'], tags: ['Outdoor', 'Menu < 25rb', 'Colokan', 'QRIS'],
    waitMin: 4, queueCount: 2,
    promo: PROMO_DISKON,
    menu: [['Flat White', 30000], ['Matcha Latte', 30000], ['Cheesecake', 32000]],
  },
  {
    id: 'kedai-hujan', name: 'Kedai Hujan', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.4, reviews: 71, distanceM: 900, priceMin: 19000, priceMax: 38000,
    facilities: ['Wi‑Fi', 'Outdoor', 'View jalan'], tags: ['Buka malam', 'Take away', 'Dekat Anggrek', 'Indoor'],
    waitMin: 9, queueCount: 5,
    promo: PROMO_DISKON,
    menu: [['Kopi Tubruk', 19000], ['Roti Bakar Cokelat', 20000], ['Wedang Jahe', 18000]],
  },
  {
    id: 'seduh-studio', name: 'Seduh Studio', category: 'Kopi', type: 'Kafe', campus: 'Syahdan',
    rating: 4.8, reviews: 104, distanceM: 380, priceMin: 24000, priceMax: 42000,
    facilities: ['Wi‑Fi', 'Colokan', 'Indoor'], tags: ['QRIS', 'Dekat Syahdan', 'Outdoor', 'Menu < 25rb'],
    waitMin: 6, queueCount: 3,
    promo: PROMO_DISKON,
    menu: [['V60 Single Origin', 32000], ['Americano', 24000], ['Banana Bread', 25000]],
  },
  {
    id: 'kopi-kayu', name: 'Kopi Kayu', category: 'Kopi', type: 'Kafe', campus: 'Binus Square',
    rating: 4.5, reviews: 67, distanceM: 950, priceMin: 21000, priceMax: 41000,
    facilities: ['Wi‑Fi', 'Outdoor', 'Area nugas'], tags: ['Indoor', 'Wi‑Fi', 'Buka malam', 'Take away'],
    waitMin: 8, queueCount: 4,
    promo: PROMO_CROISSANT,
    menu: [['Es Kopi Aren', 23000], ['Croissant Almond', 26000], ['Lemon Tea', 18000]],
  },
  {
    id: 'ruang-hijau', name: 'Ruang Hijau', category: 'Kopi', type: 'Kafe', campus: 'Syahdan',
    rating: 4.7, reviews: 95, distanceM: 600, priceMin: 26000, priceMax: 50000,
    facilities: ['Wi‑Fi', 'Colokan', 'Indoor'], tags: ['Menu < 25rb', 'Colokan', 'QRIS', 'Dekat Syahdan'],
    waitMin: 10, queueCount: 5,
    promo: PROMO_DISKON,
    menu: [['Matcha Latte', 30000], ['Cold Brew', 28000], ['Avocado Toast', 35000]],
  },
  {
    id: 'kedai-pagi', name: 'Kedai Pagi', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.3, reviews: 58, distanceM: 1100, priceMin: 17000, priceMax: 35000,
    facilities: ['Wi‑Fi', 'Outdoor', 'Sarapan'], tags: ['Take away', 'Dekat Anggrek', 'Indoor', 'Wi‑Fi'],
    waitMin: 3, queueCount: 2,
    promo: PROMO_PAKET,
    menu: [['Kopi Hitam', 17000], ['Nasi Uduk Pagi', 20000], ['Roti Srikaya', 15000]],
  },
  {
    id: 'seduh-malam', name: 'Seduh Malam', category: 'Kopi', type: 'Kafe', campus: 'Syahdan',
    rating: 4.6, reviews: 82, distanceM: 700, priceMin: 23000, priceMax: 44000,
    facilities: ['Wi‑Fi', 'Colokan', 'Indoor'], tags: ['Dekat Syahdan', 'Outdoor', 'Menu < 25rb', 'Colokan'],
    waitMin: 5, queueCount: 3,
    promo: PROMO_DISKON,
    menu: [['Es Kopi Pandan', 24000], ['Kentang Goreng', 22000], ['Cokelat Panas', 25000]],
  },
  {
    id: 'kopi-bawah', name: 'Kopi Bawah', category: 'Kopi', type: 'Kafe', campus: 'Anggrek',
    rating: 4.4, reviews: 61, distanceM: 1200, priceMin: 20000, priceMax: 40000,
    facilities: ['Wi‑Fi', 'Outdoor', 'Area nugas'], tags: ['Wi‑Fi', 'Buka malam', 'Take away', 'Dekat Anggrek'],
    waitMin: 7, queueCount: 4,
    promo: PROMO_DISKON,
    menu: [['Americano', 20000], ['Es Kopi Aren', 22000], ['Donat Gula', 12000]],
  },

  // ——— Fictional extras (no promos) ———
  {
    id: 'dapur-mahasiswa', name: 'Dapur Mahasiswa', category: 'Kantin', type: 'Kantin', campus: 'Binus Square',
    rating: 4.5, reviews: 210, distanceM: 350, priceMin: 15000, priceMax: 35000, openHours: '07.00–20.00',
    facilities: ['Colokan', 'Area makan luas'], tags: ['Dine in', 'Dekat Binus Square', 'QRIS', 'Halal'],
    waitMin: 12, queueCount: 9,
    menu: [['Nasi Ayam Geprek', 22000], ['Nasi Goreng Kampus', 20000], ['Es Teh Manis', 6000], ['Air Mineral', 5000]],
  },
  {
    id: 'kantin-kijang', name: 'Kantin Kijang', category: 'Kantin', type: 'Kantin', campus: 'Kijang',
    rating: 4.3, reviews: 142, distanceM: 500, priceMin: 12000, priceMax: 30000, openHours: '07.00–19.00',
    facilities: ['Colokan', 'Indoor'], tags: ['Dine in', 'Dekat Kijang', 'QRIS', 'Halal'],
    waitMin: 6, queueCount: 5,
    menu: [['Nasi Ayam Bakar', 25000], ['Mie Ayam', 18000], ['Soto Ayam', 20000], ['Es Jeruk', 8000]],
  },
  {
    id: 'dapur-syahdan', name: 'Dapur Syahdan', category: 'Kantin', type: 'Kantin', campus: 'Syahdan',
    rating: 4.4, reviews: 118, distanceM: 450, priceMin: 10000, priceMax: 25000, openHours: '07.00–19.00',
    facilities: ['Colokan', 'Indoor'], tags: ['Dine in', 'Dekat Syahdan', 'QRIS', 'Halal'],
    waitMin: 6, queueCount: 4,
    menu: [['Nasi Ayam Penyet', 18000], ['Nasi Telur Balado', 13000], ['Gado-gado', 15000], ['Es Teh Manis', 5000]],
  },
  {
    id: 'teras-teh', name: 'Teras Teh', category: 'Minuman', type: 'Kedai minuman', campus: 'Syahdan',
    rating: 4.6, reviews: 98, distanceM: 420, priceMin: 8000, priceMax: 25000, openHours: '08.00–21.00',
    facilities: ['Wi‑Fi', 'Outdoor'], tags: ['Take away', 'Dekat Syahdan', 'QRIS'],
    waitMin: 8, queueCount: 7,
    menu: [['Es Teh Leci', 15000], ['Teh Susu Boba', 20000], ['Lemon Tea', 12000]],
  },
  {
    id: 'segar-jus', name: 'Segar Jus Bar', category: 'Minuman', type: 'Kedai minuman', campus: 'Kijang',
    rating: 4.4, reviews: 76, distanceM: 650, priceMin: 12000, priceMax: 28000, openHours: '08.00–20.00',
    facilities: ['Indoor', 'Colokan'], tags: ['Take away', 'Dekat Kijang', 'QRIS'],
    waitMin: 5, queueCount: 3,
    menu: [['Jus Alpukat', 18000], ['Jus Mangga', 15000], ['Smoothie Stroberi', 22000]],
  },
  {
    id: 'roti-sudut', name: 'Roti Sudut', category: 'Snack', type: 'Toko roti', campus: 'Binus Square',
    rating: 4.7, reviews: 131, distanceM: 280, priceMin: 10000, priceMax: 30000, openHours: '07.00–21.00',
    facilities: ['Indoor', 'Take away'], tags: ['Dekat Binus Square', 'Take away', 'QRIS'],
    waitMin: 4, queueCount: 3,
    menu: [['Croissant Cokelat', 18000], ['Roti Sosis', 14000], ['Donat Gula', 10000], ['Air Mineral', 5000]],
  },
  {
    id: 'camilan-koridor', name: 'Camilan Koridor', category: 'Snack', type: 'Kios camilan', campus: 'Anggrek',
    rating: 4.2, reviews: 54, distanceM: 200, priceMin: 8000, priceMax: 20000, openHours: '17.00–22.00',
    facilities: ['Take away', 'Outdoor'], tags: ['Dekat Anggrek', 'Take away', 'Buka malam'],
    waitMin: 2, queueCount: 0,
    menu: [['Cireng Isi', 12000], ['Risoles Mayo', 10000], ['Pisang Cokelat', 12000]],
  },
]

export const PLACES: readonly Place[] = SEEDS.map(build)

export const PLACE_IDS: readonly string[] = PLACES.map((place) => place.id)

export function getPlace(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id)
}

/** Home "Rekomendasi untukmu" (Figma: Kopi Tepi, Kopi Kaca). */
export const RECOMMENDED_PLACE_IDS: readonly string[] = ['kopi-tepi', 'kopi-kaca']

