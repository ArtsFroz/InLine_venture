import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { openDemoControls } from './demoEvents'
import { cx } from '../lib/cx'

const LONG_PRESS_MS = 700
const MOVE_TOLERANCE_PX = 10

interface LogoProps {
  /** Hide the tagline (compact usage). */
  compact?: boolean
  className?: string
}

interface LogoGlyphProps {
  size?: number
}

/** The InLine queue-ticket glyph on a 24×24 grid (uses currentColor). */
function LogoGlyph({ size = 24 }: LogoGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="4" width="17" height="16" rx="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 9.25h17" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="14.6" r="2.1" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

/**
 * Brand lock-up (tile + "InLine" + tagline). Also the hidden demo trigger:
 * a ~700ms long-press dispatches DEMO_CONTROLS_EVENT.
 */
export function Logo({ compact = false, className }: LogoProps) {
  const timer = useRef<number | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const [pressing, setPressing] = useState(false)

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  const cancel = () => {
    clearTimer()
    origin.current = null
    setPressing(false)
  }

  useEffect(() => clearTimer, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    clearTimer()
    origin.current = { x: e.clientX, y: e.clientY }
    setPressing(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      origin.current = null
      setPressing(false)
      if (typeof navigator.vibrate === 'function') navigator.vibrate(12)
      openDemoControls()
    }, LONG_PRESS_MS)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = origin.current
    if (!start) return
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel()
  }

  return (
    <div
      role="img"
      aria-label="InLine — Antre lebih cerdas di BINUS"
      className={cx('no-select flex touch-manipulation items-center gap-3', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={cx(
          'flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white shadow-[0_6px_14px_rgba(21,128,61,0.25)]',
          'transition-transform duration-700 ease-out',
          pressing ? 'scale-[0.92]' : 'scale-100',
        )}
      >
        <LogoGlyph />
      </div>
      <div className="min-w-0">
        <p className="text-[21px] leading-[25px] font-extrabold tracking-[-0.02em]">
          <span className="text-ink">In</span>
          <span className="text-primary">Line</span>
        </p>
        {!compact && <p className="mt-0.5 text-[12px] leading-[15px] text-muted">Antre lebih cerdas di BINUS</p>}
      </div>
    </div>
  )
}
