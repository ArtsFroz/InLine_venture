// Crowd estimate from the BINUS class schedule (no sensors or queue data yet).
// Sessions run 100 minutes with 20-minute breaks; crowds jump at every break, peak around
// lunch (11.00–14.00), stay up while students with a free session wait between classes,
// and fade in the late afternoon. Every constant below is an ASSUMPTION to be replaced
// by field observation and user reports.
import type { Campus, Category, CrowdLevel, HourlyCrowd, Place } from '../state/types'
import { hhmm, type DayIndex } from './clock'

/** Class sessions [start, end] in minutes since midnight: 07.20–09.00 … 17.20–19.00. */
const SESSIONS: readonly (readonly [number, number])[] = [
  [440, 540],
  [560, 660],
  [680, 780],
  [800, 900],
  [920, 1020],
  [1040, 1140],
]
const STEP = 10
const FIRST = 360 // 06.00
const LAST = 1320 // 22.00
/** How often each session is scheduled, and P(0..4 sessions in a day) per student. */
const SLOT_WEIGHT = [0.12, 0.22, 0.2, 0.22, 0.16, 0.08]
const SESSIONS_PER_DAY = [0.15, 0.25, 0.35, 0.18, 0.07]
/** Students on campus vs a normal Monday; Tue–Thu assumed busiest, Saturday quiet. */
const DAY_FACTOR: Readonly<Record<DayIndex, number>> = { 0: 0.1, 1: 1, 2: 1.2, 3: 1.2, 4: 1.2, 5: 0.9, 6: 0.45 }
/** Anggrek holds most classes; the other campuses are quieter. */
const CAMPUS_FACTOR: Readonly<Record<Campus, number>> = { Anggrek: 1, Syahdan: 0.75, Kijang: 0.55, 'Binus Square': 0.35 }

const meal = (t: number) => (t < 540 ? 0.8 : t < 660 ? 0.9 : t < 810 ? 1.6 : t < 900 ? 1.2 : t < 1020 ? 0.7 : 0.5)
const heavyShare = (t: number) => (t < 540 ? 0.35 : t < 660 ? 0.3 : t < 840 ? 0.75 : t < 900 ? 0.5 : 0.3)

/** [chance of being at a food place, share wanting a heavy meal] for one student's sessions at minute t. */
function visit(idx: readonly number[], t: number): [number, number] {
  const idle: [number, number] = [0.03 * meal(t), heavyShare(t)]
  if (idx.length === 0) return idle
  const first = SESSIONS[idx[0]][0]
  const last = SESSIONS[idx[idx.length - 1]][1]
  if (t >= first - 40 && t < first) return [Math.min(0.9, 0.2 * meal(t)), heavyShare(t) * 0.6]
  if (t >= last && t < last + 40) return [t >= 660 && t < 840 ? 0.45 : 0.15, heavyShare(t)]
  if (t < first || t >= last) return idle
  if (idx.some((i) => t >= SESSIONS[i][0] && t < SESSIONS[i][1])) return [0, 0]
  const nextStart = Math.min(...idx.map((i) => SESSIONS[i][0]).filter((s) => s > t))
  const prevEnd = Math.max(...idx.map((i) => SESSIONS[i][1]).filter((e) => e <= t))
  return nextStart - prevEnd <= 20
    ? [Math.min(0.9, 0.3 * meal(t)), heavyShare(t) * 0.5] // 20-minute break: drinks and snacks
    : [Math.min(0.9, 0.55 * meal(t)), heavyShare(t)] // free session between classes: waits and eats
}

/** Exact probability of every set of sessions a student can have. */
function scheduleMix(): { idx: number[]; p: number }[] {
  const sets = new Map<string, { idx: number[]; p: number }>()
  const draw = (chosen: number[], p: number, k: number) => {
    if (chosen.length === k) {
      const idx = [...chosen].sort((a, b) => a - b)
      const key = idx.join(',')
      sets.set(key, { idx, p: (sets.get(key)?.p ?? 0) + p })
      return
    }
    const left = SLOT_WEIGHT.reduce((sum, w, i) => (chosen.includes(i) ? sum : sum + w), 0)
    SLOT_WEIGHT.forEach((w, i) => {
      if (!chosen.includes(i)) draw([...chosen, i], (p * w) / left, k)
    })
  }
  SESSIONS_PER_DAY.forEach((pk, k) => draw([], pk, k))
  return [...sets.values()]
}

/** Expected heavy-meal and snack/drink visitors per student, per 10-minute slot. */
const DEMAND: readonly { heavy: number; light: number }[] = (() => {
  const mix = scheduleMix()
  const out: { heavy: number; light: number }[] = []
  for (let t = FIRST; t < LAST; t += STEP) {
    let heavy = 0
    let light = 0
    for (const { idx, p } of mix) {
      const [here, h] = visit(idx, t)
      heavy += p * here * h
      light += p * here * (1 - h)
    }
    out.push({ heavy, light })
  }
  return out
})()

/** Canteens serve heavy meals; cafés, drink and snack stalls mostly serve the quick break crowd. */
function mixFor(category: Category, slot: { heavy: number; light: number }): number {
  return category === 'Kantin' ? slot.heavy * 0.8 + slot.light * 0.2 : slot.light * 0.8 + slot.heavy * 0.2
}

/** Normal-Monday peak per category at Anggrek: a place with average popularity is ~95% full then. */
const PEAK: Readonly<Record<Category, number>> = (() => {
  const peakOf = (c: Category) => Math.max(...DEMAND.map((slot) => mixFor(c, slot)))
  return { Kopi: peakOf('Kopi'), Kantin: peakOf('Kantin'), Minuman: peakOf('Minuman'), Snack: peakOf('Snack') }
})()

/** Busier places (more reviews) fill up sooner. */
function popularity(place: Place): number {
  return Math.min(1.15, Math.max(0.8, 0.75 + place.reviews / 400))
}

function parseOpenHours(text: string): [number, number] {
  const m = /(\d{2})\.(\d{2})\D+(\d{2})\.(\d{2})/.exec(text)
  if (!m) return [FIRST, LAST]
  return [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])]
}

export function levelFromShare(share: number): CrowdLevel {
  if (share >= 1) return 'Penuh'
  if (share >= 0.75) return 'Tinggi'
  if (share >= 0.4) return 'Sedang'
  return 'Rendah'
}

/** Share of capacity in use (1 = full) at a place on a day and minute; 0 when closed. */
export function crowdShare(place: Place, day: DayIndex, minute: number): number {
  const [open, close] = parseOpenHours(place.openHours)
  if (minute < open || minute >= close || minute < FIRST || minute >= LAST) return 0
  const slot = DEMAND[Math.floor((minute - FIRST) / STEP)]
  // Friday prayer: fewer people around 11.40–12.40, then everyone eats at once.
  const friday = day === 5 ? (minute >= 700 && minute < 760 ? 0.65 : minute >= 760 && minute < 800 ? 1.25 : 1) : 1
  let share = (mixFor(place.category, slot) / PEAK[place.category]) * 0.95
  share *= DAY_FACTOR[day] * friday * CAMPUS_FACTOR[place.campus] * popularity(place)
  if (place.campus === 'Binus Square') share += dormShare(minute) * (day === 0 ? 0.8 : 1)
  return Math.round(share * 100) / 100
}

/** Binus Square is a dorm: busiest at breakfast and dinner, not at class breaks. */
function dormShare(minute: number): number {
  if (minute >= 390 && minute < 480) return 0.35
  if (minute >= 1080 && minute < 1260) return 0.45
  return 0.05
}

/** Open at this minute, from the opening hours ("07.00–22.00"). */
export function isOpenAt(place: Place, minute: number): boolean {
  const [open, close] = parseOpenHours(place.openHours)
  return minute >= open && minute < close
}

/** Minutes since midnight when the place opens. */
export function opensAtMinute(place: Place): number {
  return parseOpenHours(place.openHours)[0]
}

export interface PlaceCrowd {
  level: CrowdLevel
  share: number
  closed: boolean
}

export function placeCrowd(place: Place, day: DayIndex, minute: number): PlaceCrowd {
  const closed = !isOpenAt(place, minute)
  const share = crowdShare(place, day, minute)
  return { level: levelFromShare(share), share, closed }
}

/** Busiest moment of every hour 07–21, for the bar chart. */
export function hourlyCrowd(place: Place, day: DayIndex): HourlyCrowd[] {
  const hours: HourlyCrowd[] = []
  for (let hour = 7; hour <= 21; hour += 1) {
    const level = Math.max(...[0, 10, 20, 30, 40, 50].map((m) => crowdShare(place, day, hour * 60 + m)))
    hours.push({ hour, level })
  }
  return hours
}

/** "Waktu terbaik datang: 09.20–10.50" — the longest quiet stretch while open, between 07.00 and 21.00. */
export function bestTimeText(place: Place, day: DayIndex): string {
  const [open, close] = parseOpenHours(place.openHours)
  let best: [number, number] | undefined
  let runStart: number | undefined
  for (let t = Math.max(open, 420); t <= Math.min(close, 1260); t += STEP) {
    const quiet = t < Math.min(close, 1260) && crowdShare(place, day, t) < 0.4
    if (quiet && runStart === undefined) runStart = t
    if (!quiet && runStart !== undefined) {
      if (!best || t - runStart > best[1] - best[0]) best = [runStart, t]
      runStart = undefined
    }
  }
  if (!best) return 'Hari ini ramai hampir sepanjang hari. Datang di luar jam jeda kelas (xx.00–xx.20).'
  return `Waktu terbaik datang: ${hhmm(best[0])}–${hhmm(best[1])}`
}
