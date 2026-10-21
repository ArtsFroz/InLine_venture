import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FastForward, RotateCcw, Wrench, X } from 'lucide-react'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Toggle } from './Toggle'
import { showToast } from './Toast'
import { DEMO_CONTROLS_EVENT } from './demoEvents'
import { getPlace } from '../data/places'
import { buildResultsSearch } from '../lib/aiSearch'
import { ROUTES } from '../routes'
import { useAppState } from '../state/AppState'
import type { OrderLine, OrderType } from '../state/types'

const DEMO_PLACE_ID = 'kopi-tepi'
const SAMPLE_QUERY = 'Kopi susu dekat Anggrek, antre singkat, budget 25 ribu.'
const DEMO_ITEMS = ['Es Kopi Susu', 'Croissant Cokelat']

interface Jump {
  tag: string
  label: string
  run: () => void
}

function getPortalTarget(): HTMLElement {
  return document.getElementById('app-frame') ?? document.body
}

function demoTitipItems(): OrderLine[] {
  const menu = getPlace(DEMO_PLACE_ID)?.menu ?? []
  return menu
    .filter((item) => DEMO_ITEMS.includes(item.name))
    .map((item) => ({ menuId: item.id, name: item.name, price: item.price, qty: 1 }))
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="mt-5 mb-2 text-[11.5px] font-bold tracking-[0.06em] text-muted uppercase">{children}</h3>
}

/**
 * Hidden presenter panel: opened by DEMO_CONTROLS_EVENT (long-press the logo on Home, or Shift+D).
 * Resets the demo, drives order tracking and jumps straight to any screen.
 */
export function DemoControls() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(DEMO_CONTROLS_EVENT, onOpen)
    return () => window.removeEventListener(DEMO_CONTROLS_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null

  const close = () => setOpen(false)

  /** Runs a demo action without ever letting an error escape into the app. */
  const safely = (action: () => void, closeFirst = true) => {
    if (closeFirst) close()
    try {
      action()
    } catch {
      showToast('Aksi demo gagal — coba lagi')
    }
  }

  const ensureQueue = () => {
    if (!state.activeQueue) actions.takeQueue(DEMO_PLACE_ID)
  }

  /** Cancels leftover open orders so jumps don't pile them up, then seeds one. Returns its id. */
  const freshDemoOrder = (type: OrderType, step: number): string => {
    actions.clearOpenOrders()
    return actions.seedDemoOrder(type, step).id
  }

  const activeOrders = state.orders.filter((order) => order.status === 'aktif')

  const advanceAll = () =>
    safely(() => {
      if (activeOrders.length === 0) {
        showToast('Belum ada pesanan aktif')
        return
      }
      activeOrders.forEach((order) => actions.advanceOrder(order.id))
      showToast('Langkah pelacakan dimajukan')
    }, false)

  const reset = () =>
    safely(() => {
      actions.resetDemo()
      navigate(ROUTES.home)
      showToast('Demo direset')
    })

  const jumps: Jump[] = [
    { tag: '1', label: 'Home', run: () => navigate(ROUTES.home) },
    { tag: '2', label: 'Hasil AI', run: () => navigate(ROUTES.results + buildResultsSearch({ q: SAMPLE_QUERY })) },
    { tag: '3', label: 'Detail Kopi Tepi', run: () => navigate(ROUTES.place(DEMO_PLACE_ID)) },
    {
      tag: '4',
      label: 'Antrean Saya',
      run: () => {
        ensureQueue()
        navigate(ROUTES.queue)
      },
    },
    {
      tag: '4b',
      label: 'Konfirmasi batal',
      run: () => {
        ensureQueue()
        navigate(`${ROUTES.queue}?batal=1`)
      },
    },
    { tag: '5', label: 'Joki Antre', run: () => navigate(ROUTES.joki(DEMO_PLACE_ID)) },
    { tag: '5b', label: 'Titip Beli', run: () => navigate(ROUTES.titip(DEMO_PLACE_ID)) },
    {
      tag: '6',
      label: 'Pembayaran QRIS',
      run: () => {
        actions.clearOpenOrders()
        const order = actions.createOrder({
          type: 'titip',
          placeId: DEMO_PLACE_ID,
          items: demoTitipItems(),
          deliverTo: { campus: 'Anggrek', detail: 'Lobby lt. 1' },
        })
        navigate(ROUTES.pay(order.id))
      },
    },
    { tag: '7', label: 'Lacak Titip', run: () => navigate(ROUTES.track(freshDemoOrder('titip', 2))) },
    { tag: '7a', label: 'Lacak Joki', run: () => navigate(ROUTES.track(freshDemoOrder('joki', 2))) },
    { tag: '8', label: 'Pesanan Selesai', run: () => navigate(ROUTES.done(freshDemoOrder('titip', 4))) },
    { tag: '9', label: 'Disimpan', run: () => navigate(ROUTES.saved) },
    { tag: '10', label: 'Profil', run: () => navigate(ROUTES.profile) },
    {
      tag: '11',
      label: 'Mode Buddy',
      run: () => {
        actions.setBuddyOnline(true) // Figma 11 shows the buddy online
        navigate(ROUTES.buddy)
      },
    },
  ]

  const target = getPortalTarget()
  const position = target === document.body ? 'fixed' : 'absolute'

  return createPortal(
    <div className={`${position} inset-0 z-[65]`}>
      <div aria-hidden onClick={close} className="absolute inset-0 bg-[#0d1712]/55" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="no-scrollbar animate-screen-in absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-sheet bg-surface px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] text-ink shadow-sheet"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white" aria-hidden>
            <Wrench size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[18px] leading-tight font-extrabold">
              Demo controls
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">Hanya untuk presenter · Shift+D</p>
          </div>
          <IconButton icon={<X size={20} aria-hidden />} label="Tutup demo controls" onClick={close} />
        </div>

        <SectionTitle>Demo</SectionTitle>
        <Button variant="danger" size="sm" fullWidth icon={<RotateCcw size={17} />} onClick={reset}>
          Reset demo
        </Button>

        <SectionTitle>Pelacakan pesanan</SectionTitle>
        <div className="flex items-center justify-between gap-3 rounded-tile bg-soft px-3.5 py-3">
          <span className="text-[13.5px] font-semibold">Lacak otomatis maju (4 dtk)</span>
          <Toggle
            checked={state.demoAutoAdvance}
            onChange={(on) => safely(() => actions.setDemoAutoAdvance(on), false)}
            label="Lacak otomatis maju"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          className="mt-2.5"
          icon={<FastForward size={17} />}
          onClick={advanceAll}
        >
          Majukan langkah pelacakan
        </Button>
        <p className="mt-1.5 text-[11.5px] text-muted">
          {activeOrders.length > 0 ? `${activeOrders.length} pesanan aktif` : 'Belum ada pesanan aktif'}
        </p>

        <SectionTitle>Lompat ke layar</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {jumps.map((jump) => (
            <button
              key={jump.tag}
              type="button"
              onClick={() => safely(jump.run)}
              className="flex min-h-11 items-center gap-2 rounded-[12px] border border-line bg-surface px-2.5 py-2 text-left text-[13px] font-semibold transition-colors duration-150 hover:bg-primary-light active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45"
            >
              <span className="min-w-[26px] shrink-0 rounded-md bg-soft px-1 py-0.5 text-center text-[11px] font-bold text-muted">
                {jump.tag}
              </span>
              <span className="min-w-0 leading-tight">{jump.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    target,
  )
}
