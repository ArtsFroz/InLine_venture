// The time the crowd prediction uses: the device clock, or a demo time set by the presenter
// (so the pattern can be shown outside class hours). Kept outside AppState so a reset keeps it.
import { useSyncExternalStore } from 'react'

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Date.getDay(): 0 = Minggu

export interface Now {
  day: DayIndex
  minute: number // minutes since midnight
  simulated: boolean
}

const STORAGE_KEY = 'inline-demo-clock'
const TICK_MS = 30_000

export const DAY_NAMES: Readonly<Record<DayIndex, string>> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
}

type Override = { day: DayIndex; minute: number } | null

function readOverride(): Override {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { day?: unknown; minute?: unknown }
    if (typeof v.day === 'number' && v.day >= 0 && v.day <= 6 && typeof v.minute === 'number') {
      return { day: v.day as DayIndex, minute: Math.max(0, Math.min(1439, Math.round(v.minute))) }
    }
  } catch {
    // Unreadable value: fall back to the device clock.
  }
  return null
}

let override: Override = typeof window === 'undefined' ? null : readOverride()
let snapshot: Now = compute()
const listeners = new Set<() => void>()

function compute(): Now {
  if (override) return { ...override, simulated: true }
  const d = new Date()
  return { day: d.getDay() as DayIndex, minute: d.getHours() * 60 + d.getMinutes(), simulated: false }
}

function emit() {
  const next = compute()
  if (next.day === snapshot.day && next.minute === snapshot.minute && next.simulated === snapshot.simulated) return
  snapshot = next
  listeners.forEach((l) => l())
}

let timer: number | undefined

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (timer === undefined) timer = window.setInterval(emit, TICK_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }
}

/** Current prediction time (non-React callers, e.g. search ranking). */
export function getNow(): Now {
  return snapshot
}

export function useNow(): Now {
  return useSyncExternalStore(subscribe, getNow, getNow)
}

/** Pass null to go back to the device clock. */
export function setDemoClock(next: Override): void {
  override = next
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: the override still applies for this session.
  }
  emit()
}

export function hhmm(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}.${String(minute % 60).padStart(2, '0')}`
}
