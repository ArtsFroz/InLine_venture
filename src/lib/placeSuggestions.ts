// Places suggested by students. A signed-in, email-verified user submits a place as "pending";
// an InLine admin approves or rejects it in /admin; approved places are shown to everyone with the
// label "Usulan mahasiswa". firestore.rules enforces all of this. Only the submitter's uid is
// stored (no name, email or photo). Each account has SLOTS document ids (`<uid>_1` … `<uid>_5`), which
// caps how many suggestions one account can have without a server.
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { COMMUNITY_ID_PREFIX } from '../data/places'
import type { Area, Campus, Category, Place } from '../state/types'
import { getDb, getFirebaseAuth } from './firebase'

export type SuggestionStatus = 'pending' | 'approved' | 'rejected'

export interface SuggestionMenuItem {
  name: string
  price: number
}

export interface PlaceSuggestion {
  id: string // Firestore document id, `<uid>_<slot>`
  uid: string
  name: string
  category: Category
  campus: Campus
  area: Area
  distanceM: number
  locationNote: string
  openHours: string
  menu: SuggestionMenuItem[]
  status: SuggestionStatus
  note: string | null
  submittedAt: Timestamp | null
  reviewedAt: Timestamp | null
  reviewedBy: string | null
}

export interface SuggestionForm {
  name: string
  category: Category
  campus: Campus
  area: Area
  distanceM: number
  locationNote: string
  opens: string // '07:00' from <input type="time">
  closes: string
  menu: { name: string; price: string }[]
}

const COLLECTION = 'placeSuggestions'
export const SLOTS = 5
export const MAX_MENU_ITEMS = 3
const MIN_PRICE = 1000
const MAX_PRICE = 500_000

/** "07:00" → "07.00"; null when it is not a valid time. */
function toHours(time: string): string | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  return m ? `${m[1]}.${m[2]}` : null
}

function parsePrice(text: string): number {
  return Number(text.replace(/\D/g, ''))
}

function cleanMenu(menu: SuggestionForm['menu']): SuggestionMenuItem[] {
  return menu
    .map((item) => ({ name: item.name.trim(), price: parsePrice(item.price) }))
    .filter((item) => item.name !== '' || item.price > 0)
}

/** First problem with the form, in Indonesian, or null when it can be sent. */
export function validateSuggestion(form: SuggestionForm): string | null {
  const name = form.name.trim()
  if (name.length < 2 || name.length > 60) return 'Nama tempat 2–60 karakter.'
  if (form.locationNote.trim().length > 120) return 'Patokan lokasi maksimal 120 karakter.'
  const opens = toHours(form.opens)
  const closes = toHours(form.closes)
  if (!opens || !closes) return 'Isi jam buka dan jam tutup.'
  if (opens >= closes) return 'Jam tutup harus setelah jam buka.'
  const menu = cleanMenu(form.menu)
  if (menu.length === 0) return 'Isi minimal 1 menu dan harganya.'
  for (const item of menu) {
    if (item.name.length < 2 || item.name.length > 40) return 'Nama menu 2–40 karakter.'
    if (item.price < MIN_PRICE || item.price > MAX_PRICE) return 'Harga menu antara Rp1.000 dan Rp500.000.'
  }
  return null
}

/** Lowercased, accents and punctuation removed: "A&W" and "a w" match. */
function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Existing places whose name contains the typed name (or the other way round), for the "sudah ada" hint. */
export function similarPlaces(name: string, places: readonly Place[]): Place[] {
  const key = nameKey(name)
  if (key.length < 3) return []
  return places.filter((place) => {
    const other = nameKey(place.name)
    return other.includes(key) || key.includes(other)
  })
}

const PLACE_TYPE: Readonly<Record<Category, string>> = {
  Kopi: 'Kedai kopi',
  Kantin: 'Tempat makan',
  Minuman: 'Kedai minuman',
  Snack: 'Jajanan',
}

/** An approved suggestion as a Place. Crowd is estimated like any other place. */
export function suggestionToPlace(s: PlaceSuggestion): Place {
  const id = `${COMMUNITY_ID_PREFIX}${s.id}`
  const prices = s.menu.map((item) => item.price)
  return {
    id,
    name: s.name,
    category: s.category,
    type: PLACE_TYPE[s.category],
    campus: s.campus,
    area: s.area,
    source: 'mahasiswa',
    distanceM: s.distanceM,
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    openHours: s.openHours,
    facilities: [],
    ...(s.locationNote ? { locationNote: s.locationNote } : {}),
    tags: ['Usulan mahasiswa'],
    waitMin: 5,
    queueCount: 3,
    menu: s.menu.map((item, index) => ({ id: `${id}-m${index + 1}`, name: item.name, price: item.price })),
  }
}

/** Rules cannot check every menu entry, so drop anything malformed before it reaches the UI. */
function readSuggestion(id: string, data: Record<string, unknown>): PlaceSuggestion {
  const menu = Array.isArray(data.menu)
    ? data.menu.filter(
        (item): item is SuggestionMenuItem =>
          typeof item === 'object' && item !== null && typeof item.name === 'string' && typeof item.price === 'number',
      )
    : []
  return { ...(data as Omit<PlaceSuggestion, 'id' | 'menu'>), id, menu }
}

/** First free document id for this user, or null when all SLOTS are used. */
export function freeSlotId(uid: string, mine: readonly PlaceSuggestion[]): string | null {
  for (let slot = 1; slot <= SLOTS; slot += 1) {
    const id = `${uid}_${slot}`
    if (!mine.some((s) => s.id === id)) return id
  }
  return null
}

export async function submitSuggestion(docId: string, uid: string, form: SuggestionForm): Promise<void> {
  const problem = validateSuggestion(form)
  if (problem) throw new Error(problem)
  // Fresh token: the rules check email_verified from it.
  await getFirebaseAuth().currentUser?.getIdToken(true)
  await setDoc(doc(getDb(), COLLECTION, docId), {
    uid,
    name: form.name.trim(),
    category: form.category,
    campus: form.campus,
    area: form.area,
    distanceM: form.distanceM,
    locationNote: form.locationNote.trim(),
    openHours: `${toHours(form.opens)}–${toHours(form.closes)}`,
    menu: cleanMenu(form.menu),
    status: 'pending',
    note: null,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  })
}

/** Removes a pending or rejected suggestion, which frees its slot. */
export async function deleteSuggestion(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION, id))
}

function watch(
  constraint: ReturnType<typeof where>,
  onChange: (list: PlaceSuggestion[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(getDb(), COLLECTION), constraint),
    (snap) => {
      const list = snap.docs.map((d) => readSuggestion(d.id, d.data()))
      list.sort((a, b) => (a.submittedAt?.toMillis() ?? 0) - (b.submittedAt?.toMillis() ?? 0))
      onChange(list)
    },
    onError,
  )
}

export function watchApprovedSuggestions(onChange: (list: PlaceSuggestion[]) => void, onError: (error: Error) => void): Unsubscribe {
  return watch(where('status', '==', 'approved'), onChange, onError)
}

export function watchMySuggestions(uid: string, onChange: (list: PlaceSuggestion[]) => void, onError: (error: Error) => void): Unsubscribe {
  return watch(where('uid', '==', uid), onChange, onError)
}

/** Admins only (the rules refuse everyone else). */
export function watchPendingSuggestions(onChange: (list: PlaceSuggestion[]) => void, onError: (error: Error) => void): Unsubscribe {
  return watch(where('status', '==', 'pending'), onChange, onError)
}

export async function reviewSuggestion(id: string, decision: 'approved' | 'rejected', note: string, adminUid: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION, id), {
    status: decision,
    note: note.trim().slice(0, 200) || null,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid,
  })
}
