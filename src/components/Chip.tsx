import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

interface ChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  /** md = 36px (filter chips), sm = 32px (compact pickers / review tags). */
  size?: 'sm' | 'md'
  /** Light (default) or dark (Mode Buddy). */
  tone?: 'light' | 'dark'
  className?: string
}

/** Selectable pill (aria-pressed). Hit area is extended to ~44px vertically. */
export function Chip({ label, selected = false, onClick, icon, size = 'md', tone = 'light', className }: ChipProps) {
  const dark = tone === 'dark'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'relative inline-flex shrink-0 items-center gap-1.5 rounded-full border whitespace-nowrap',
        'after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""]',
        'transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        size === 'md' ? 'h-9 px-[15px] text-[14px]' : 'h-8 px-3 text-[13px]',
        selected
          ? dark
            ? 'border-accent bg-accent/15 font-bold text-accent'
            : 'border-primary bg-primary-light font-bold text-primary-dark'
          : dark
            ? 'border-white/15 bg-buddy-card font-medium text-buddy-text hover:border-white/30'
            : 'border-line bg-surface font-medium text-ink hover:border-[#c9d3cc] hover:bg-[#fbfcfb]',
        className,
      )}
    >
      {icon && (
        <span className="inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      {label}
    </button>
  )
}
