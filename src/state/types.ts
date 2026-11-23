// Shared domain types. This file is the contract between data, state and screens:
// change it only together with every consumer.

export type Campus = 'Anggrek' | 'Syahdan' | 'Kijang' | 'Binus Square'
export const CAMPUSES: readonly Campus[] = ['Anggrek', 'Syahdan', 'Kijang', 'Binus Square']

export type Category = 'Kopi' | 'Kantin' | 'Minuman' | 'Snack'
/** Shown as Sepi / Sedang / Ramai / Penuh. */
export type CrowdLevel = 'Rendah' | 'Sedang' | 'Tinggi' | 'Penuh'

export interface MenuItem {
  id: string
  name: string
  price: number // Rupiah
}

export interface HourlyCrowd {
  hour: number // 7..21
  level: number // busiest share of capacity in that hour (1 = full)
}

export interface Place {
  id: string // slug, e.g. 'kopi-tepi'
  name: string
  category: Category
  type: string // e.g. 'Kafe', 'Kantin', 'Kedai minuman'
  campus: Campus
  rating: number
  reviews: number
  distanceM: number
  priceMin: number
  priceMax: number
  openHours: string // '07.00–22.00'; open or closed is decided from this and the clock
  image: string // public path, e.g. '/images/places/kopi-tepi.webp'
  facilities: string[] // list line: ['Wi‑Fi', 'Colokan', 'Area nugas']
  tags: string[] // detail chips: ['Take away', 'Dekat Anggrek', 'Indoor', 'Wi‑Fi']
  // Only used to seed a virtual queue ticket (Antrean Saya); never shown as a prediction.
  waitMin: number
  queueCount: number
  promo?: string // shown ONLY inside a banner labeled "Promosi"
  menu: MenuItem[]
}

export interface Buddy {
  id: string
  name: string // 'Raka A.'
  rating: number
  tasks: number
  nimVerified: true
  activeOrders: number // must stay <= MAX_ORDERS_PER_BUDDY
}

export type OrderType = 'joki' | 'titip'
export type OrderStatus = 'menunggu_bayar' | 'aktif' | 'selesai' | 'dibatalkan'
export type EscrowStatus = 'ditahan' | 'diteruskan' | 'dikembalikan'

export interface OrderLine {
  menuId: string
  name: string
  price: number
  qty: number
}

export interface FeeLine {
  label: string // 'Biaya joki', 'Biaya layanan', 'Subtotal menu', 'Ongkos antar'
  amount: number
}

export interface Order {
  id: string // 'QB-0129'
  type: OrderType
  placeId: string
  createdAt: number // epoch ms
  queueNumber?: string // joki: the user's queue number, e.g. 'A028'
  meetingPoint?: string // joki: 'Anggrek, lobby lt. 1'
  items: OrderLine[] // titip only (empty for joki)
  deliverTo?: { campus: Campus; detail: string } // titip only
  fees: FeeLine[]
  total: number
  status: OrderStatus
  step: number // index into the tracking steps (0 = Pesanan dibuat)
  buddyId: string
  escrow: EscrowStatus
  review?: { stars: number; tags: string[]; comment: string }
}

export interface ActiveQueue {
  placeId: string
  number: string // 'A028'
  serving: string // 'A024'
  ahead: number // people in front
  etaMin: number
  createdAt: string // '10:32'
  servingAt: string // '10:45'
  turnAt: string // '10:57'
}

export type BuddyRequestStatus = 'baru' | 'diterima' | 'ditolak' | 'selesai'

export interface BuddyRequest {
  id: string
  type: OrderType
  placeId: string
  title: string // 'Kopi Tepi → Anggrek lobby lt. 1'
  detail: string // '2 item · Es Kopi Susu, Croissant Cokelat'
  earn: number // Rp6.000 titip / Rp4.000 joki
  etaMin: number
  status: BuddyRequestStatus
}

export interface BuddyModeState {
  online: boolean
  earningsToday: number
  completedToday: number
  requests: BuddyRequest[]
}

export interface AppState {
  savedPlaceIds: string[]
  activeQueue: ActiveQueue | null
  orders: Order[]
  buddy: BuddyModeState
  demoAutoAdvance: boolean // tracking steps advance by themselves
}
