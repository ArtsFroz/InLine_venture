import { useEffect, useState, type ReactNode } from 'react'
import { ToastHost } from './Toast'
import { openDemoControls } from './demoEvents'

const FRAME_WIDTH = 390
const FRAME_HEIGHT = 844
const DESKTOP_MIN_WIDTH = 500
/** Vertical breathing room around the frame on desktop. */
const FRAME_MARGIN = 36

interface Viewport {
  isDesktop: boolean
  scale: number
}

function readViewport(): Viewport {
  if (typeof window === 'undefined') return { isDesktop: false, scale: 1 }
  const w = window.innerWidth
  const h = window.innerHeight
  const isDesktop = w >= DESKTOP_MIN_WIDTH
  const fitH = (h - FRAME_MARGIN) / FRAME_HEIGHT
  const fitW = (w - FRAME_MARGIN) / FRAME_WIDTH
  const scale = Math.max(0.5, Math.min(1, fitH, fitW))
  return { isDesktop, scale }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(readViewport)
  useEffect(() => {
    const onResize = () => setViewport(readViewport())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])
  return viewport
}

function useDemoShortcut(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.code !== 'KeyD' && e.key !== 'D') return
      if (isTypingTarget(e.target)) return
      e.preventDefault()
      openDemoControls()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

interface PhoneFrameProps {
  children: ReactNode
}

/**
 * Wraps the app. Mobile: full screen (100dvh). Desktop: a 390×844 phone, scaled
 * down to fit short windows. Overlays portal into #app-frame (position: relative).
 */
export function PhoneFrame({ children }: PhoneFrameProps) {
  const { isDesktop, scale } = useViewport()
  useDemoShortcut()

  const frame = (
    <div id="app-frame" className="relative isolate h-full w-full overflow-hidden bg-bg text-ink">
      {children}
      <ToastHost />
    </div>
  )

  if (!isDesktop) {
    return <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-bg">{frame}</div>
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-desk bg-[radial-gradient(ellipse_at_top,rgba(21,128,61,0.10),transparent_60%)]">
      <div
        className="shrink-0 overflow-hidden rounded-[44px] bg-bg shadow-frame ring-1 ring-black/5"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {frame}
      </div>
    </div>
  )
}
