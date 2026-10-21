import type { ReactNode } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { cx } from '../lib/cx'

interface InfoNoteProps {
  children: ReactNode
  /** Defaults: ShieldCheck (green) / AlertTriangle (amber). */
  icon?: ReactNode
  tone?: 'green' | 'amber'
  className?: string
}

const TONE_CLASS = {
  green: 'bg-primary-light text-primary-dark',
  amber: 'bg-crowd-mid-bg text-[#7a4f08]',
} as const

/** Tinted note box with an icon (05 "Buddy terverifikasi NIM…"). */
export function InfoNote({ children, icon, tone = 'green', className }: InfoNoteProps) {
  const fallback =
    tone === 'green' ? <ShieldCheck size={18} strokeWidth={2.2} /> : <AlertTriangle size={18} strokeWidth={2.2} />
  return (
    <div className={cx('flex items-start gap-2.5 rounded-tile px-3.5 py-3', TONE_CLASS[tone], className)}>
      <span className={cx('mt-px inline-flex shrink-0', tone === 'green' ? 'text-primary' : 'text-crowd-mid')} aria-hidden>
        {icon ?? fallback}
      </span>
      <div className="min-w-0 text-[12.5px] leading-[1.4]">{children}</div>
    </div>
  )
}
