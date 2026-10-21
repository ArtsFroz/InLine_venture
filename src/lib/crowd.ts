import type { CrowdLevel } from '../state/types'

export type CrowdTone = 'green' | 'amber' | 'red'

const SHORT_LABEL: Record<CrowdLevel, string> = {
  Rendah: 'Sepi',
  Sedang: 'Sedang',
  Tinggi: 'Ramai',
}

const TEXT_CLASS: Record<CrowdLevel, string> = {
  Rendah: 'text-crowd-low',
  Sedang: 'text-crowd-mid',
  Tinggi: 'text-crowd-high',
}

const TONE: Record<CrowdLevel, CrowdTone> = {
  Rendah: 'green',
  Sedang: 'amber',
  Tinggi: 'red',
}

/** Card pill wording: Rendah → "Sepi", Sedang → "Sedang", Tinggi → "Ramai". */
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

/** Maps a relative hourly crowd value (0..1) to a level (used by QueueChart bars). */
export function crowdLevelFromValue(value: number): CrowdLevel {
  if (value >= 0.75) return 'Tinggi'
  if (value >= 0.5) return 'Sedang'
  return 'Rendah'
}
