import { cx } from '../lib/cx'

interface AvatarProps {
  name: string
  /** Diameter in px (default 48). */
  size?: number
  className?: string
}

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0] ?? ''
  const second = words.length > 1 ? (words[words.length - 1][0] ?? '') : ''
  return (first + second).toUpperCase()
}

/** Light-gray circle with initials ("Raka A." → "RA"). */
export function Avatar({ name, size = 48, className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-avatar font-bold text-muted select-none',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      <span aria-hidden>{initials(name)}</span>
    </span>
  )
}
