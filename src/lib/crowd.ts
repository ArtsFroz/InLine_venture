import type { CrowdLevel } from '../state/types'
import { levelFromShare } from './crowdModel'

export type CrowdTone = 'green' | 'amber' | 'red'

const SHORT_LABEL: Record<CrowdLevel, string> = {
  Rendah: 'Sepi',
  Sedang: 'Sedang',
  Tinggi: 'Ramai',
  Penuh: 'Penuh',
}

const TEXT_CLASS: Record<CrowdLevel, string> = {
  Rendah: 'text-crowd-low',
  Sedang: 'text-crowd-mid',
  Tinggi: 'text-crowd-high',
  Penuh: 'text-danger-dark',
}

const TONE: Record<CrowdLevel, CrowdTone> = {
  Rendah: 'green',
  Sedang: 'amber',
  Tinggi: 'red',
  Penuh: 'red',
}

/** Card pill wording: Rendah → Sepi, Sedang → Sedang, Tinggi → Ramai, Penuh → Penuh. */
export function crowdShortLabel(level: CrowdLevel): string {
  return SHORT_LABEL[level]
}

/** Tailwind text color class for the full level word (Detail screen "Rendah"). */
export function crowdTextClass(level: CrowdLevel): string {
  return TEXT_CLASS[level]
}

/** Tag tone for a crowd level. */
export function crowdTone(level: CrowdLevel): CrowdTone {
  return TONE[level]
}

/** Maps a share of capacity (1 = full) to a level (used by QueueChart bars). */
export function crowdLevelFromValue(value: number): CrowdLevel {
  return levelFromShare(value)
}
