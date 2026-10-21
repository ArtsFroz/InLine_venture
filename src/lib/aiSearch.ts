// Fake "AI" natural-language search. Deterministic, forgiving keyword parsing of
// casual Indonesian ("kopi susu dekat Anggrek, antre singkat, budget 25 ribu").
import { PLACES } from '../data/places'
import type { Campus, Category, CrowdLevel, Place } from '../state/types'
import { formatRupiah } from './format'

export interface ParsedQuery {
  category?: Category
  campus?: Campus
  maxBudget?: number
  shortQueue?: boolean
  openNow?: boolean
  quiet?: boolean
  nearest?: boolean
  facilities: string[] // canonical facility names, e.g. 'Wi‑Fi', 'Colokan', 'Area nugas'
  menuKeywords: string[] // e.g. 'kopi susu', 'croissant' (boost ranking, never filter)
}

export type SortKey = 'sepi' | 'terdekat' | 'rating' | 'termurah'
export const SORT_KEYS: readonly SortKey[] = ['sepi', 'terdekat', 'rating', 'termurah']
export const SORT_LABELS: Readonly<Record<SortKey, string>> = {
  sepi: 'Paling sepi',
  terdekat: 'Terdekat',
  rating: 'Rating tertinggi',
  termurah: 'Termurah',
}
export const DEFAULT_SORT: SortKey = 'sepi'

export type FilterKey = 'antre-singkat' | 'buka-sekarang' | 'budget' | 'sepi' | 'terdekat'
export const FILTER_KEYS: readonly FilterKey[] = ['antre-singkat', 'buka-sekarang', 'budget', 'sepi', 'terdekat']
export const FILTER_LABELS: Readonly<Record<FilterKey, string>> = {
  'antre-singkat': 'Antre singkat',
  'buka-sekarang': 'Buka sekarang',
  budget: 'Budget',
  sepi: 'Sepi',
  terdekat: 'Terdekat',
}

export const CATEGORIES: readonly Category[] = ['Kopi', 'Kantin', 'Minuman', 'Snack']

/** "Budget" filter chip = ≤ Rp25.000. */
export const BUDGET_FILTER_MAX = 25000
/** "Antre singkat" = AI wait estimate ≤ 5 minutes. */
export const SHORT_QUEUE_MAX_MIN = 5
/** "Terdekat" = within 700 m. */
export const NEAREST_MAX_M = 700

const EMPTY_DESCRIPTION = 'semua tempat di sekitar BINUS'

export function emptyQuery(): ParsedQuery {
  return { facilities: [], menuKeywords: [] }
}

// ——— Parsing ———

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\bantri/g, 'antre')
    .replace(/\bngantri/g, 'ngantre')
    .replace(/[^a-z0-9.,<≤\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

const CATEGORY_RULES: ReadonlyArray<readonly [Category, RegExp]> = [
  // Kopi first so "es kopi" / "minum kopi" stays Kopi.
  ['Kopi', /\b(kopi|coffee|ngopi|latte|cappuc+h?in+o|americano|espresso|kafe|cafe|v60|cold brew|flat white)\b/],
  ['Snack', /\b(snack|snak|camilan|cemilan|ngemil|makanan ringan|roti|croissant|donat|donut|kue|pastry|gorengan|cireng|risol\w*)\b/],
  ['Kantin', /\b(kantin|makan|makanan|nasi|ayam|mie|mi|soto|bakso|geprek|lapar|laper|lunch)\b/],
  ['Minuman', /\b(minum|minuman|teh|tea|jus|juice|boba|es|smoothie|haus|segar)\b/],
]

const CAMPUS_RULES: ReadonlyArray<readonly [Campus, RegExp]> = [
  ['Binus Square', /\b(binus square|binsq|bsq|square)\b/],
  ['Anggrek', /\banggrek\b/],
  ['Syahdan', /\bsyahdan\b/],
  ['Kijang', /\bkijang\b/],
]

const FACILITY_RULES: ReadonlyArray<readonly [string, RegExp]> = [
  ['Wi‑Fi', /\b(wifi|wi-fi|wi fi|internet)\b/],
  ['Colokan', /\b(colokan|stop ?kontak|charger|ngecas|ngecharge|cas)\b/],
  ['Area nugas', /\b(nugas|tugas|belajar|kerja|laptop|wfc)\b/],
  ['Outdoor', /\b(outdoor|luar ruangan)\b/],
  ['Indoor', /\b(indoor|ber ?ac|dalam ruangan)\b/],
]

/** A canonical facility also matches these place facilities/tags. */
const FACILITY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'Area nugas': ['Area nugas', 'Perpustakaan'],
}

const MENU_TERMS: readonly string[] = [
  'kopi susu', 'es kopi', 'kopi aren', 'latte', 'cappuccino', 'americano', 'matcha', 'cold brew', 'v60',
  'croissant', 'roti', 'donat', 'banana bread', 'cheesecake',
  'teh', 'boba', 'jus', 'smoothie', 'cokelat',
  'nasi', 'ayam', 'mie', 'soto', 'geprek',
  'air mineral',
]

const SHORT_QUEUE_RE =
  /\b(antre(an)? (yang )?(singkat|cepat|pendek|sebentar|dikit|sedikit)|(ga|gak|nggak|ngga|enggak|tidak|tanpa|anti|no) (ng)?antre|cepat|cepet|buru-buru|buru2|gercep|singkat)\b/
const QUIET_RE = /\b(sepi|tenang|sunyi|kalem|(ga|gak|nggak|ngga|tidak) (rame|ramai))\b/
const OPEN_NOW_RE = /\b(buka|open|lagi buka|masih buka)\b/
const NEAREST_RE = /\b(terdekat|paling dekat|paling deket|nearby)\b/
const NEAR_RE = /\b(dekat|deket)\b/
const CHEAP_RE = /\b(murah|hemat|irit|kantong mahasiswa)\b/

// Money: "25 ribu", "25rb", "25k", "Rp25.000", "rp 25rb", "budget 25", "di bawah 30 ribu", "maks 20rb".
const MONEY_RE = /(rp\.? ?)?(\d+(?:[.,]\d+)*) ?(ribuan|ribu|rban|rb|k|jt|juta)?(?![a-z0-9])/g
const BUDGET_CUE_RE = /(budget|bujet|budjet|maks|max|maksimal|di bawah|dibawah|kurang dari|under|sampai|harga|<|≤)\s*$/

function toNumber(raw: string): number {
  return Number.parseFloat(raw.replace(',', '.'))
}

function parseBudget(text: string): number | undefined {
  for (const match of text.matchAll(MONEY_RE)) {
    const [, rp, digits, unit] = match
    const before = text.slice(0, match.index)
    const hasCue = BUDGET_CUE_RE.test(before)
    if (!rp && !unit && !hasCue) continue
    let value: number
    if (unit === 'jt' || unit === 'juta') value = toNumber(digits) * 1_000_000
    else if (unit) value = toNumber(digits) * 1000
    else {
      // "25.000" / "25,000" → 25000; "25" (after "budget" or "rp") → 25000.
      const whole = Number.parseInt(digits.replace(/[.,]/g, ''), 10)
      value = whole < 1000 ? whole * 1000 : whole
    }
    if (Number.isFinite(value) && value > 0) return Math.round(value)
  }
  return undefined
}

export function parseQuery(text: string): ParsedQuery {
  const t = normalize(text)
  const category = CATEGORY_RULES.find(([, re]) => re.test(t))?.[0]
  const campus = CAMPUS_RULES.find(([, re]) => re.test(t))?.[0]
  const explicitBudget = parseBudget(t)
  const maxBudget = explicitBudget ?? (CHEAP_RE.test(t) ? BUDGET_FILTER_MAX : undefined)
  const nearest = NEAREST_RE.test(t) || (NEAR_RE.test(t) && !campus)
  const parsed: ParsedQuery = {
    facilities: FACILITY_RULES.filter(([, re]) => re.test(t)).map(([name]) => name),
    menuKeywords: MENU_TERMS.filter((term) => new RegExp(`\\b${term}\\b`).test(t)),
  }
  if (category) parsed.category = category
  if (campus) parsed.campus = campus
  if (maxBudget !== undefined) parsed.maxBudget = maxBudget
  if (SHORT_QUEUE_RE.test(t)) parsed.shortQueue = true
  if (OPEN_NOW_RE.test(t)) parsed.openNow = true
  if (QUIET_RE.test(t)) parsed.quiet = true
  if (nearest) parsed.nearest = true
  return parsed
}

/** Merge Home/Results filter chips (and a category chip) into a parsed query. */
export function applyFilters(parsed: ParsedQuery, filters: readonly FilterKey[], category?: Category): ParsedQuery {
  const next: ParsedQuery = { ...parsed, facilities: [...parsed.facilities], menuKeywords: [...parsed.menuKeywords] }
  if (category) next.category = category
  for (const filter of filters) {
    if (filter === 'antre-singkat') next.shortQueue = true
    else if (filter === 'buka-sekarang') next.openNow = true
    else if (filter === 'sepi') next.quiet = true
    else if (filter === 'terdekat') next.nearest = true
    else if (filter === 'budget') next.maxBudget = Math.min(next.maxBudget ?? BUDGET_FILTER_MAX, BUDGET_FILTER_MAX)
  }
  return next
}

/** Which filter chips a parsed query implies (to highlight chips understood from the text). */
export function activeFilters(parsed: ParsedQuery): FilterKey[] {
  const keys: FilterKey[] = []
  if (parsed.shortQueue) keys.push('antre-singkat')
  if (parsed.openNow) keys.push('buka-sekarang')
  if (parsed.maxBudget !== undefined && parsed.maxBudget <= BUDGET_FILTER_MAX) keys.push('budget')
  if (parsed.quiet) keys.push('sepi')
  if (parsed.nearest) keys.push('terdekat')
  return keys
}

const FACILITY_PHRASES: Readonly<Record<string, string>> = {
  'Wi‑Fi': 'ada Wi‑Fi',
  Colokan: 'ada colokan',
  'Area nugas': 'enak buat nugas',
  Outdoor: 'outdoor',
  Indoor: 'indoor',
}

/** "kategori kopi · budget ≤ Rp25.000 · dekat Anggrek · antre singkat" (for "AI memahami: …"). */
export function describeParsed(parsed: ParsedQuery): string {
  const parts: string[] = []
  if (parsed.category) parts.push(`kategori ${parsed.category.toLowerCase()}`)
  if (parsed.maxBudget !== undefined) parts.push(`budget ≤ ${formatRupiah(parsed.maxBudget)}`)
  if (parsed.campus) parts.push(`dekat ${parsed.campus}`)
  else if (parsed.nearest) parts.push('terdekat')
  if (parsed.shortQueue) parts.push('antre singkat')
  if (parsed.quiet) parts.push('suasana sepi')
  if (parsed.openNow) parts.push('buka sekarang')
  for (const facility of parsed.facilities) parts.push(FACILITY_PHRASES[facility] ?? facility.toLowerCase())
  return parts.length > 0 ? parts.join(' · ') : EMPTY_DESCRIPTION
}

// ——— Searching ———

type Constraint = 'maxBudget' | 'campus' | 'shortQueue' | 'nearest' | 'quiet' | 'openNow' | 'facilities' | 'category'

/** Order in which strict filters are dropped when nothing matches. */
const RELAX_ORDER: readonly Constraint[] = [
  'maxBudget', 'campus', 'shortQueue', 'nearest', 'quiet', 'openNow', 'facilities', 'category',
]

const CROWD_RANK: Readonly<Record<CrowdLevel, number>> = { Rendah: 0, Sedang: 1, Tinggi: 2 }

function hasFacility(place: Place, facility: string): boolean {
  const accepted = FACILITY_ALIASES[facility] ?? [facility]
  return accepted.some((name) => place.facilities.includes(name) || place.tags.includes(name))
}

function satisfies(place: Place, parsed: ParsedQuery, constraint: Constraint): boolean {
  switch (constraint) {
    case 'category':
      return !parsed.category || place.category === parsed.category
    case 'campus':
      return !parsed.campus || place.campus === parsed.campus
    case 'maxBudget':
      return parsed.maxBudget === undefined || place.priceMin <= parsed.maxBudget
    case 'shortQueue':
      return !parsed.shortQueue || place.waitMin <= SHORT_QUEUE_MAX_MIN
    case 'nearest':
      return !parsed.nearest || place.distanceM <= NEAREST_MAX_M
    case 'quiet':
      return !parsed.quiet || place.crowd === 'Rendah'
    case 'openNow':
      return !parsed.openNow || place.isOpen
    case 'facilities':
      return parsed.facilities.every((facility) => hasFacility(place, facility))
  }
}

/** How well a place fits the whole query (used to rank inside a sort, and relaxed alternatives). */
function relevance(place: Place, parsed: ParsedQuery): number {
  const constraintScore = RELAX_ORDER.filter((c) => satisfies(place, parsed, c)).length
  const menuNames = place.menu.map((item) => item.name.toLowerCase())
  const menuScore = parsed.menuKeywords.filter((kw) => menuNames.some((name) => name.includes(kw))).length
  return constraintScore * 2 + menuScore * 3
}

function primaryCompare(a: Place, b: Place, sort: SortKey): number {
  switch (sort) {
    case 'sepi':
      return CROWD_RANK[a.crowd] - CROWD_RANK[b.crowd]
    case 'terdekat':
      return a.distanceM - b.distanceM
    case 'rating':
      return b.rating - a.rating || b.reviews - a.reviews
    case 'termurah':
      return a.priceMin - b.priceMin
  }
}

function rank(places: readonly Place[], parsed: ParsedQuery, sort: SortKey): Place[] {
  const scored = places.map((place) => ({ place, score: relevance(place, parsed) }))
  return scored
    .sort(
      (a, b) =>
        Number(b.place.isOpen) - Number(a.place.isOpen) || // closed places always last
        primaryCompare(a.place, b.place, sort) ||
        b.score - a.score ||
        a.place.waitMin - b.place.waitMin ||
        a.place.distanceM - b.place.distanceM,
    )
    .map(({ place }) => place)
}

export interface SearchResult {
  results: Place[]
  /** true when strict filters returned nothing and some were dropped. */
  relaxed: boolean
  /** Human labels of the dropped filters, e.g. ['budget', 'kampus'] (empty when not relaxed). */
  dropped: string[]
}

const CONSTRAINT_LABELS: Readonly<Record<Constraint, string>> = {
  maxBudget: 'budget',
  campus: 'kampus',
  shortQueue: 'antre singkat',
  nearest: 'jarak',
  quiet: 'sepi',
  openNow: 'buka sekarang',
  facilities: 'fasilitas',
  category: 'kategori',
}

/** Filter then rank. Never returns an empty list: filters are relaxed one by one until something matches. */
export function searchPlaces(
  parsed: ParsedQuery,
  sort: SortKey = DEFAULT_SORT,
  places: readonly Place[] = PLACES,
): SearchResult {
  const active = [...RELAX_ORDER]
  const dropped: Constraint[] = []
  for (let i = 0; i <= RELAX_ORDER.length; i += 1) {
    const matches = places.filter((place) => active.every((c) => satisfies(place, parsed, c)))
    if (matches.length > 0 || active.length === 0) {
      return finish(rank(matches.length > 0 ? matches : places, parsed, sort), parsed, dropped)
    }
    const next = RELAX_ORDER[i]
    active.splice(active.indexOf(next), 1)
    dropped.push(next)
  }
  return finish(rank(places, parsed, sort), parsed, dropped)
}

/** Only blame dropped constraints that the final results actually violate. */
function finish(results: Place[], parsed: ParsedQuery, dropped: readonly Constraint[]): SearchResult {
  const violated = dropped.filter((c) => results.some((place) => !satisfies(place, parsed, c)))
  return { results, relaxed: violated.length > 0, dropped: violated.map((c) => CONSTRAINT_LABELS[c]) }
}

// ——— Results URL (?q=..&f=..&cat=..&s=..) ———

export interface ResultsSearchInput {
  q?: string
  filters?: readonly FilterKey[]
  category?: Category
  sort?: SortKey
}

export interface ResultsSearchState {
  q: string
  filters: FilterKey[]
  category?: Category
  sort: SortKey
}

export function buildResultsSearch({ q, filters, category, sort }: ResultsSearchInput): string {
  const params = new URLSearchParams()
  const query = q?.trim()
  if (query) params.set('q', query)
  const uniqueFilters = FILTER_KEYS.filter((key) => filters?.includes(key))
  if (uniqueFilters.length > 0) params.set('f', uniqueFilters.join(','))
  if (category) params.set('cat', category)
  if (sort && sort !== DEFAULT_SORT) params.set('s', sort)
  const str = params.toString()
  return str ? `?${str}` : ''
}

function isFilterKey(value: string): value is FilterKey {
  return (FILTER_KEYS as readonly string[]).includes(value)
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value)
}

export function readResultsSearch(params: URLSearchParams): ResultsSearchState {
  const filters = (params.get('f') ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(isFilterKey)
  const cat = params.get('cat') ?? ''
  const sort = params.get('s') ?? ''
  const state: ResultsSearchState = {
    q: params.get('q') ?? '',
    filters: FILTER_KEYS.filter((key) => filters.includes(key)),
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
  }
  if (isCategory(cat)) state.category = cat
  return state
}

/** Convenience for the Results screen: URL → parsed query with chips merged in. */
export function resolveResultsSearch(params: URLSearchParams): ResultsSearchState & { parsed: ParsedQuery } {
  const state = readResultsSearch(params)
  return { ...state, parsed: applyFilters(parseQuery(state.q), state.filters, state.category) }
}
