import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'

type IconButtonTone = 'light' | 'dark' | 'ghost'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode
  /** Accessible name (required: the button has no visible text). */
  label: string
  size?: 44 | 48
  tone?: IconButtonTone
}

const TONE_CLASS: Record<IconButtonTone, string> = {
  light: 'bg-surface text-ink shadow-soft hover:bg-primary-light hover:text-primary-dark',
  dark: 'bg-buddy-card text-buddy-text hover:bg-white/15',
  ghost: 'bg-transparent text-current hover:bg-black/5',
}

/** Round icon-only button (white with soft shadow by default). */
export function IconButton({
  icon,
  label,
  size = 44,
  tone = 'light',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.94]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:active:scale-100',
        size === 48 ? 'size-12' : 'size-11',
        TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
}
