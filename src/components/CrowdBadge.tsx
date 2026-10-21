import type { CrowdLevel } from '../state/types'
import { crowdShortLabel, crowdTone } from '../lib/crowd'
import { Tag } from './Tag'

interface CrowdBadgeProps {
  level: CrowdLevel
  /** Optional suffix in the same pill, e.g. "±5 mnt" → "Sepi · ±5 mnt" (Home / Disimpan cards). */
  detail?: string
  className?: string
}

/** Crowd pill: Rendah → "Sepi" (green), Sedang → "Sedang" (amber), Tinggi → "Ramai" (red). */
export function CrowdBadge({ level, detail, className }: CrowdBadgeProps) {
  const label = crowdShortLabel(level)
  return (
    <Tag tone={crowdTone(level)} className={className}>
      <span className="sr-only">Keramaian: </span>
      {detail ? `${label} · ${detail}` : label}
    </Tag>
  )
}
