import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { cx } from '../lib/cx'

export type Tone = 'light' | 'dark'

interface ScreenProps {
  children: ReactNode
  /** Sticky CTA area pinned above the nav (or the bottom edge when nav is off). */
  footer?: ReactNode
  /** 'plain' = buttons float on the page bg (05/07); 'bar' = white bar with hairline (03-detail). */
  footerStyle?: 'plain' | 'bar'
  /** Show the bottom tab bar. */
  nav?: boolean
  /** 'dark' = Mode Buddy colors. */
  tone?: Tone
  /** Remove the 20px side/top padding so content can go edge-to-edge (hero images). */
  bleed?: boolean
  /** Extra classes on the scrolling content wrapper. */
  className?: string
}

/**
 * Standard screen layout: fills the frame, only the middle scrolls,
 * footer + nav stay pinned. Scroll resets to top on route change.
 */
export function Screen({
  children,
  footer,
  footerStyle = 'plain',
  nav = false,
  tone = 'light',
  bleed = false,
  className,
}: ScreenProps) {
  const scrollRef = useRef<HTMLElement>(null)
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname, search])

  const dark = tone === 'dark'

  return (
    <div
      className={cx(
        'flex h-full flex-col pt-[env(safe-area-inset-top)]',
        dark ? 'bg-buddy-bg text-buddy-text' : 'bg-bg text-ink',
      )}
    >
      <main
        ref={scrollRef}
        className="no-scrollbar relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div
          className={cx(
            'animate-screen-in',
            !bleed && 'px-5 pt-5',
            footer ? 'pb-4' : nav ? 'pb-6' : 'pb-[max(24px,env(safe-area-inset-bottom))]',
            className,
          )}
        >
          {children}
        </div>
      </main>

      {footer && (
        <div
          className={cx(
            'relative z-10 shrink-0 px-5 pt-3',
            nav ? 'pb-3' : 'pb-[max(20px,env(safe-area-inset-bottom))]',
            footerStyle === 'bar' &&
              (dark ? 'border-t border-white/10 bg-buddy-card' : 'border-t border-line bg-surface shadow-nav'),
          )}
        >
          {footer}
        </div>
      )}

      {nav && <BottomNav />}
    </div>
  )
}
