import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'
import type { Tone } from './Screen'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'
type CardElement = 'div' | 'section' | 'article' | 'li'

interface CardProps {
  children: ReactNode
  /** none = 0, sm = 12px, md = 16px (default), lg = 20px. */
  padding?: CardPadding
  tone?: Tone
  /** Renders a react-router <Link>. */
  to?: string
  /** Renders a <button>. */
  onClick?: () => void
  /** Static element tag when not interactive (default div). */
  as?: CardElement
  /** Accessible name for interactive cards whose content is not a good label. */
  ariaLabel?: string
  className?: string
}

const PADDING_CLASS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

const INTERACTIVE_CLASS =
  'block w-full text-left cursor-pointer transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.985] ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

/** White rounded (20px) surface with a soft shadow. Use `to` or `onClick` to make it interactive. */
export function Card({
  children,
  padding = 'md',
  tone = 'light',
  to,
  onClick,
  as: Element = 'div',
  ariaLabel,
  className,
}: CardProps) {
  const base = cx(
    'rounded-card',
    tone === 'dark' ? 'bg-buddy-card text-buddy-text' : 'bg-surface text-ink shadow-card',
    PADDING_CLASS[padding],
    className,
  )

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={cx(base, INTERACTIVE_CLASS)}>
        {children}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={cx(base, INTERACTIVE_CLASS)}>
        {children}
      </button>
    )
  }

  return (
    <Element aria-label={ariaLabel} className={base}>
      {children}
    </Element>
  )
}
