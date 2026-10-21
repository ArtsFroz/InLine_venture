import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

export type TagTone = 'green' | 'amber' | 'red' | 'gray' | 'outline' | 'dark'

interface TagProps {
  children: ReactNode
  /** green = crowd-low/"Live", gray = "Antre 2–3 mnt", outline = facility chips, dark = Mode Buddy. */
  tone?: TagTone
  /** sm = 25px (card pills), md = 27px (detail facility chips). */
  size?: 'sm' | 'md'
  icon?: ReactNode
  className?: string
}

const TONE_CLASS: Record<TagTone, string> = {
  green: 'bg-crowd-low-bg text-primary-dark font-semibold',
  amber: 'bg-crowd-mid-bg text-[#8a5a0b] font-semibold',
  red: 'bg-crowd-high-bg text-danger-dark font-semibold',
  gray: 'bg-soft text-ink/80 font-medium',
  outline: 'border border-line bg-surface text-ink font-medium',
  dark: 'bg-white/10 text-buddy-text font-semibold',
}

/** Static, non-interactive pill label. */
export function Tag({ children, tone = 'green', size = 'sm', icon, className }: TagProps) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full whitespace-nowrap',
        size === 'sm' ? 'h-[25px] px-2.5 text-[12px]' : 'h-[27px] px-[11px] text-[12.5px]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon && (
        <span className="inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
