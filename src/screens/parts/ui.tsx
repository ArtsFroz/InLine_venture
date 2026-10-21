// Small screen-level building blocks shared by several user-flow screens.
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { Button, Header, Screen } from '../../components'
import { ROUTES } from '../../routes'
import { cx } from '../../lib/cx'

/**
 * Text input look (44px, hairline border, green focus ring).
 * 16px text on phones so iOS Safari does not zoom in on focus; 14.5px on the desktop frame.
 */
export const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] text-ink sm:text-[14.5px] ' +
  'placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 hover:border-[#c9d3cc] ' +
  'focus:border-primary focus:ring-[3px] focus:ring-primary/15 focus:outline-none'

/** Dark-green brand gradient of the AI Rekomendasi and Jadi Buddy cards. */
export const BRAND_GRADIENT_CLASS = 'bg-[linear-gradient(150deg,#1c6b3b_0%,#11512c_48%,#0b3a20_100%)]'

/** Small gray field label (12.5px). */
export const LABEL_CLASS = 'text-[12.5px] leading-[15px] text-muted'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

/** Centered icon + title + explanation + optional action (empty lists, not-found). */
export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center px-4 py-10 text-center', className)}>
      <div aria-hidden className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon}
      </div>
      <h2 className="text-[18px] leading-[1.25] font-extrabold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[290px] text-[13.5px] leading-[1.45] text-muted">{children}</p>
      {action && <div className="mt-5 w-full max-w-[260px]">{action}</div>}
    </div>
  )
}

interface NotFoundScreenProps {
  title: string
  message: string
}

/** Friendly dead end for unknown place / order ids, with a way home. */
export function NotFoundScreen({ title, message }: NotFoundScreenProps) {
  const navigate = useNavigate()
  return (
    <Screen>
      <Header title={title} />
      <EmptyState
        icon={<SearchX size={28} strokeWidth={2} />}
        title="Ups, tidak ketemu"
        action={
          <Button fullWidth onClick={() => navigate(ROUTES.home, { replace: true })}>
            Kembali ke Home
          </Button>
        }
      >
        {message}
      </EmptyState>
    </Screen>
  )
}
