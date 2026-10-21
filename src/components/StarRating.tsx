import { useRef, type KeyboardEvent } from 'react'
import { Star } from 'lucide-react'
import { cx } from '../lib/cx'

const MAX_STARS = 5

interface StarRatingProps {
  /** 0..5 (0 = nothing selected). */
  value: number
  /** Omit for a read-only display. */
  onChange?: (next: number) => void
  /** Star size in px (default 36 for the review screen). */
  size?: number
  className?: string
}

function StarGlyph({ filled, size }: { filled: boolean; size: number }) {
  return (
    <Star
      size={size}
      strokeWidth={1.6}
      aria-hidden
      className={cx(
        'transition-[color,fill] duration-150',
        filled ? 'fill-star text-star' : 'fill-transparent text-[#c5ccc7]',
      )}
    />
  )
}

/** 5 tappable stars (radiogroup, arrow keys supported). Read-only when onChange is absent. */
export function StarRating({ value, onChange, size = 36, className }: StarRatingProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const stars = Array.from({ length: MAX_STARS }, (_, i) => i + 1)

  if (!onChange) {
    return (
      <div role="img" aria-label={`${value} dari ${MAX_STARS} bintang`} className={cx('flex items-center gap-1', className)}>
        {stars.map((n) => (
          <StarGlyph key={n} filled={n <= value} size={size} />
        ))}
      </div>
    )
  }

  const select = (n: number) => {
    const next = Math.min(MAX_STARS, Math.max(1, n))
    onChange(next)
    refs.current[next - 1]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = value || 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') select(current + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') select(current - 1)
    else if (e.key === 'Home') select(1)
    else if (e.key === 'End') select(MAX_STARS)
    else return
    e.preventDefault()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Penilaian bintang"
      onKeyDown={onKeyDown}
      className={cx('flex items-center gap-1.5', className)}
    >
      {stars.map((n) => {
        const checked = n === value
        const tabbable = checked || (value === 0 && n === 1)
        return (
          <button
            key={n}
            ref={(el) => {
              refs.current[n - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${n} bintang`}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(n)}
            className={cx(
              'flex items-center justify-center rounded-full p-1 transition-transform duration-150 ease-out',
              'hover:scale-110 active:scale-90',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-star/50',
            )}
          >
            <span key={n <= value ? 'on' : 'off'} className={cx('inline-flex', n <= value && 'animate-pop')}>
              <StarGlyph filled={n <= value} size={size} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
