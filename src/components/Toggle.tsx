import { cx } from '../lib/cx'
import type { Tone } from './Screen'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Accessible name, e.g. "Mode Buddy online". */
  label: string
  tone?: Tone
  disabled?: boolean
  className?: string
}

/** On/off switch (role="switch"). Dark tone uses the bright accent green (11-mode-buddy). */
export function Toggle({ checked, onChange, label, tone = 'light', disabled = false, className }: ToggleProps) {
  const dark = tone === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px]',
        'after:absolute after:-inset-1.5 after:content-[""]',
        'transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2',
        dark ? 'focus-visible:ring-offset-buddy-bg' : 'focus-visible:ring-offset-bg',
        'disabled:opacity-50',
        checked ? (dark ? 'bg-accent' : 'bg-primary') : dark ? 'bg-white/20' : 'bg-[#c9d2cc]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'size-[26px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)]',
          'transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
