import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'dark' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** sm = 44px, md = 48px (default), lg = 52px. */
  size?: ButtonSize
  fullWidth?: boolean
  /** Optional leading icon (e.g. a lucide icon at size 18). */
  icon?: ReactNode
  children: ReactNode
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-cta hover:bg-[#127436] disabled:shadow-none',
  outline: 'border-[1.5px] border-primary bg-surface text-primary-dark hover:bg-primary-light',
  danger: 'border-[1.5px] border-danger bg-surface text-danger-dark hover:bg-danger-light',
  dark: 'bg-buddy-card text-buddy-text ring-1 ring-white/10 hover:bg-[#25392f]',
  accent: 'bg-accent text-primary-dark shadow-[0_8px_20px_rgba(74,222,128,0.28)] hover:bg-[#5ce58f]',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-[14px]',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-[52px] px-6 text-[15px]',
}

/** Primary action button. Defaults to type="button". */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-button font-bold tracking-[-0.005em] whitespace-nowrap select-none',
        'transition-[transform,background-color,color,opacity] duration-150 ease-out active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-45 disabled:active:scale-100',
        fullWidth && 'w-full',
        SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="-ml-0.5 inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  )
}
