import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cx } from '../lib/cx'

const TOAST_DURATION_MS = 2200
const TOAST_EXIT_MS = 220

interface ToastMessage {
  id: number
  message: string
}

type ToastListener = (toast: ToastMessage) => void

const listeners = new Set<ToastListener>()
let nextId = 1

/** Shows a short toast at the bottom of the phone frame (auto-hides after 2.2s). */
export function showToast(message: string): void {
  const toast: ToastMessage = { id: nextId++, message }
  listeners.forEach((listener) => listener(toast))
}

/** Renders toasts. Mounted once inside PhoneFrame (#app-frame). */
export function ToastHost() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const listener: ToastListener = (next) => {
      setToast(next)
      setVisible(true)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const hide = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS)
    const clear = window.setTimeout(() => setToast(null), TOAST_DURATION_MS + TOAST_EXIT_MS)
    return () => {
      window.clearTimeout(hide)
      window.clearTimeout(clear)
    }
  }, [toast])

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[70] flex justify-center px-6"
    >
      {toast && (
        <div
          key={toast.id}
          className={cx(
            'flex max-w-full items-center gap-2 rounded-[18px] bg-ink/92 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(20,32,26,0.25)] backdrop-blur',
            'transition-[opacity,transform] duration-200 ease-out',
            visible ? 'animate-screen-in opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          <CheckCircle2 size={16} className="shrink-0 text-accent" aria-hidden />
          <span className="line-clamp-2 min-w-0 leading-snug break-words">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
