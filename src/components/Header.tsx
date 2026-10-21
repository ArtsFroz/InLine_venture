import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from './IconButton'
import { ROUTES } from '../routes'
import { cx } from '../lib/cx'
import type { Tone } from './Screen'

interface HeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Custom back action. Default: history back, or Home when there is no history. */
  onBack?: () => void
  /** Show the back button (default true). */
  back?: boolean
  /** Right-side slot (IconButton, Toggle, …). */
  right?: ReactNode
  tone?: Tone
  /** Remove the default 14px bottom margin. */
  flush?: boolean
  className?: string
}

/** react-router stores the history index in history.state.idx. */
function hasInAppHistory(): boolean {
  const state: unknown = window.history.state
  if (state && typeof state === 'object' && 'idx' in state) {
    const idx: unknown = state.idx
    return typeof idx === 'number' && idx > 0
  }
  return false
}

/** Screen header: 44px back circle + 20px bold title (+ subtitle) + optional right slot. */
export function Header({
  title,
  subtitle,
  onBack,
  back = true,
  right,
  tone = 'light',
  flush = false,
  className,
}: HeaderProps) {
  const navigate = useNavigate()
  const dark = tone === 'dark'

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (hasInAppHistory()) navigate(-1)
    else navigate(ROUTES.home, { replace: true })
  }

  return (
    <header className={cx('flex min-h-11 items-center gap-3', !flush && 'mb-3.5', className)}>
      {back && (
        <IconButton
          icon={<ChevronLeft size={22} strokeWidth={2.2} aria-hidden />}
          label="Kembali"
          tone={dark ? 'dark' : 'light'}
          onClick={handleBack}
        />
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={cx(
            'truncate text-[20px] leading-[1.2] font-extrabold tracking-[-0.01em]',
            dark ? 'text-white' : 'text-ink',
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={cx('mt-0.5 truncate text-[12.5px] leading-[1.25]', dark ? 'text-buddy-muted' : 'text-muted')}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  )
}
