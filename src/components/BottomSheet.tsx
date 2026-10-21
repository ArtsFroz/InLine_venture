import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../lib/cx'

const EXIT_MS = 280
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Centered 20px bold title (also the dialog's accessible name). */
  title?: ReactNode
  /** Accessible name when there is no visible title. */
  ariaLabel?: string
  /** Optional 56px round badge above the title (e.g. <AlertTriangle /> for 04b). */
  icon?: ReactNode
  iconTone?: 'danger' | 'green' | 'amber'
  children: ReactNode
  className?: string
}

function getPortalTarget(): HTMLElement {
  return document.getElementById('app-frame') ?? document.body
}

const ICON_TONE_CLASS: Record<NonNullable<BottomSheetProps['iconTone']>, string> = {
  danger: 'bg-danger-light text-danger',
  green: 'bg-primary-light text-primary',
  amber: 'bg-crowd-mid-bg text-crowd-mid',
}

/**
 * Modal bottom sheet portaled into #app-frame (stays inside the phone).
 * Scrim click / Escape close it; focus moves in and is restored on close.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  icon,
  iconTone = 'danger',
  children,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Mount → next frame show (enter animation); hide → unmount after exit animation.
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true))
      })
      return () => window.cancelAnimationFrame(raf)
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [open])

  // Focus management + Escape.
  useEffect(() => {
    if (!open || !mounted) return
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const sheet = sheetRef.current
    const first = sheet?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? sheet)?.focus({ preventScroll: true })

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restoreFocus.current?.focus({ preventScroll: true })
    }
  }, [open, mounted])

  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !sheetRef.current) return
    const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!mounted) return null

  const target = getPortalTarget()
  const position = target === document.body ? 'fixed' : 'absolute'

  return createPortal(
    <div className={cx(position, 'inset-0 z-[60]')}>
      <div
        aria-hidden
        onClick={onClose}
        className={cx(
          'absolute inset-0 bg-[#0d1712]/45 transition-opacity duration-300 ease-out',
          visible ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={cx(
          'no-scrollbar absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-sheet bg-surface shadow-sheet outline-none',
          'px-6 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]',
          'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-60',
          className,
        )}
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d5dbd7]" />
        {icon && (
          <div
            aria-hidden
            className={cx('mx-auto mb-3.5 flex size-14 items-center justify-center rounded-full', ICON_TONE_CLASS[iconTone])}
          >
            {icon}
          </div>
        )}
        {title && (
          <h2 id={titleId} className="mb-2 text-center text-[20px] leading-[1.25] font-extrabold tracking-[-0.01em] text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    target,
  )
}
