import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'
import type { Tone } from './Screen'

interface SectionTitleAction {
  label: string
  to?: string
  onClick?: () => void
}

interface SectionTitleProps {
  title: string
  action?: SectionTitleAction
  tone?: Tone
  className?: string
}

const ACTION_CLASS =
  'relative -mr-1 rounded-lg px-1 py-1 text-[13px] font-bold text-primary transition-colors hover:text-primary-dark ' +
  'after:absolute after:-inset-2 after:content-[""] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'

/** Section heading with an optional right-aligned link ("Rekomendasi untukmu · Lihat semua"). */
export function SectionTitle({ title, action, tone = 'light', className }: SectionTitleProps) {
  return (
    <div className={cx('mb-3 flex items-center justify-between gap-3', className)}>
      <h2
        className={cx(
          'text-[17px] leading-[1.2] font-bold tracking-[-0.01em]',
          tone === 'dark' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      {action?.to && (
        <Link to={action.to} className={ACTION_CLASS}>
          {action.label}
        </Link>
      )}
      {action && !action.to && action.onClick && (
        <button type="button" onClick={action.onClick} className={ACTION_CLASS}>
          {action.label}
        </button>
      )}
    </div>
  )
}
