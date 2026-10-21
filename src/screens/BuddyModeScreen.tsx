import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Moon, Wallet } from 'lucide-react'
import { Button, Card, Header, Screen, Tag, Toggle, showToast } from '../components'
import { MAX_ORDERS_PER_BUDDY } from '../data/pricing'
import { formatRupiah } from '../lib/format'
import { cx } from '../lib/cx'
import { ROUTES } from '../routes'
import { useAppState } from '../state/AppState'
import type { BuddyRequest, OrderType } from '../state/types'

const COUNT_UP_MS = 700
const RUPIAH_STEP = 100

const TYPE_LABEL: Record<OrderType, string> = {
  titip: 'Titip Beli & Antar',
  joki: 'Joki Antre',
}

function hasInAppHistory(): boolean {
  const state: unknown = window.history.state
  if (state && typeof state === 'object' && 'idx' in state) {
    const idx: unknown = state.idx
    return typeof idx === 'number' && idx > 0
  }
  return false
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Animates a number from its previous value to `value` (ease-out cubic). */
function useCountUp(value: number): number {
  const [display, setDisplay] = useState(value)
  const currentRef = useRef(value)

  useEffect(() => {
    const from = currentRef.current
    if (from === value) return undefined
    if (prefersReducedMotion()) {
      currentRef.current = value
      setDisplay(value)
      return undefined
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS)
      const eased = 1 - (1 - t) ** 3
      const next = t < 1 ? Math.round((from + (value - from) * eased) / RUPIAH_STEP) * RUPIAH_STEP : value
      currentRef.current = next
      setDisplay(next)
      if (t < 1) raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [value])

  return display
}

function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card tone="dark" padding="md" className="min-w-0">
      <p className="text-[12.5px] leading-tight text-buddy-muted">{label}</p>
      <div className="mt-1.5 truncate text-[24px] leading-none font-extrabold tracking-[-0.01em]">{children}</div>
    </Card>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mt-6 mb-3 text-[16px] font-bold text-white">{children}</h2>
}

interface ExpandedRequestProps {
  request: BuddyRequest
  onDecline: () => void
  onAccept: () => void
  /** At MAX_ORDERS_PER_BUDDY accepted: "Terima Order" is disabled with a short reason. */
  atLimit: boolean
}

function ExpandedRequest({ request, onDecline, onAccept, atLimit }: ExpandedRequestProps) {
  return (
    <Card as="article" padding="md" className="animate-screen-in" ariaLabel={`Order masuk: ${request.title}`}>
      <div className="flex items-center justify-between gap-3">
        <Tag tone="green">{TYPE_LABEL[request.type]}</Tag>
        <span className="text-[13px] font-bold text-ink">±{request.etaMin} mnt</span>
      </div>
      <h3 className="mt-3 text-[16px] leading-snug font-bold text-ink">{request.title}</h3>
      {request.detail && <p className="mt-1 text-[13px] leading-snug text-muted">{request.detail}</p>}
      <div className="mt-3 flex items-center justify-between rounded-tile bg-soft px-3.5 py-3">
        <span className="text-[13px] text-muted">Kamu dapat</span>
        <span className="text-[16px] font-extrabold text-primary-dark">{formatRupiah(request.earn)}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Button variant="danger" onClick={onDecline}>
          Tolak
        </Button>
        <Button variant="primary" onClick={onAccept} disabled={atLimit}>
          Terima Order
        </Button>
      </div>
      {atLimit && (
        <p className="mt-2.5 text-center text-[12.5px] leading-snug text-muted">
          Batas {MAX_ORDERS_PER_BUDDY} order tercapai — selesaikan order dulu
        </p>
      )}
    </Card>
  )
}

function CollapsedRequest({ request, onExpand }: { request: BuddyRequest; onExpand: () => void }) {
  return (
    <Card tone="dark" padding="md" onClick={onExpand} ariaLabel={`Lihat order: ${request.title}`}>
      <Tag tone="dark">{TYPE_LABEL[request.type]}</Tag>
      <p className="mt-2.5 text-[15px] leading-snug font-bold text-white">{request.title}</p>
      <p className="mt-1 text-[12.5px] text-buddy-muted">
        Kamu dapat {formatRupiah(request.earn)} · ±{request.etaMin} mnt
      </p>
    </Card>
  )
}

function WaitingState() {
  return (
    <Card tone="dark" padding="lg" className="flex items-center gap-3.5">
      <span className="relative flex size-3 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-3 rounded-full bg-accent" />
      </span>
      <div>
        <p className="text-[14.5px] font-bold text-white">Menunggu order masuk…</p>
        <p className="mt-0.5 text-[12.5px] text-buddy-muted">Order dari mahasiswa di sekitarmu akan muncul di sini.</p>
      </div>
    </Card>
  )
}

function OfflineState({ onActivate }: { onActivate: () => void }) {
  return (
    <Card tone="dark" padding="lg" className="mt-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10 text-buddy-muted" aria-hidden>
        <Moon size={22} />
      </span>
      <p className="mt-3 text-[16px] font-bold text-white">Kamu sedang offline</p>
      <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-snug text-buddy-muted">
        Order masuk disembunyikan. Aktifkan lagi saat kamu siap bantu antre &amp; antar di sela kuliah.
      </p>
      <Button variant="accent" className="mt-4" onClick={onActivate}>
        Aktifkan
      </Button>
    </Card>
  )
}

function ActiveRequest({ request, onComplete }: { request: BuddyRequest; onComplete: () => void }) {
  return (
    <Card tone="dark" padding="md" as="li" className="ring-1 ring-accent/25">
      <div className="flex items-center justify-between gap-3">
        <Tag tone="dark" icon={<Clock size={13} />}>
          {TYPE_LABEL[request.type]}
        </Tag>
        <span className="text-[13px] font-bold text-accent">{formatRupiah(request.earn)}</span>
      </div>
      <p className="mt-2.5 text-[15px] leading-snug font-bold text-white">{request.title}</p>
      {request.detail && <p className="mt-1 text-[12.5px] text-buddy-muted">{request.detail}</p>}
      <Button
        variant="accent"
        size="sm"
        fullWidth
        className="mt-3"
        icon={<CheckCircle2 size={18} />}
        onClick={onComplete}
      >
        Tandai selesai
      </Button>
    </Card>
  )
}

export function BuddyModeScreen() {
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const { online, earningsToday, completedToday, requests } = state.buddy
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const earnings = useCountUp(earningsToday)

  const incoming = requests.filter((r) => r.status === 'baru')
  const accepted = requests.filter((r) => r.status === 'diterima')
  const expanded = incoming.find((r) => r.id === expandedId) ?? incoming[0]
  const collapsed = incoming.filter((r) => r !== expanded)

  const handleBack = () => {
    if (hasInAppHistory()) navigate(-1)
    else navigate(ROUTES.profile, { replace: true })
  }

  const setOnline = (next: boolean) => {
    actions.setBuddyOnline(next)
    showToast(next ? 'Kamu online — siap terima order' : 'Kamu offline')
  }

  const decline = (request: BuddyRequest) => {
    actions.declineRequest(request.id)
    setExpandedId(null)
    showToast('Order ditolak')
  }

  const accept = (request: BuddyRequest) => {
    if (!actions.acceptRequest(request.id)) {
      showToast(`Maksimal ${MAX_ORDERS_PER_BUDDY} order per antrean — selesaikan order dulu`)
      return
    }
    setExpandedId(null)
    showToast('Order diterima — semangat!')
  }

  const complete = (request: BuddyRequest) => {
    actions.completeRequest(request.id)
    showToast(`+${formatRupiah(request.earn)} masuk ke saldo`)
  }

  return (
    <Screen tone="dark">
      <Header
        tone="dark"
        title="Mode Buddy"
        subtitle={
          <span className={cx('font-semibold', online ? 'text-accent' : 'text-buddy-muted')}>
            {online ? 'Kamu sedang online' : 'Kamu sedang offline'}
          </span>
        }
        onBack={handleBack}
        right={<Toggle tone="dark" checked={online} onChange={setOnline} label="Mode Buddy online" />}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Penghasilan hari ini">
          <span className="text-accent tabular-nums">{formatRupiah(earnings)}</span>
        </StatCard>
        <StatCard label="Order selesai">
          <span key={completedToday} className="inline-block animate-pop tabular-nums motion-reduce:animate-none">
            {completedToday}
          </span>
        </StatCard>
      </div>

      {online ? (
        <section aria-label="Order masuk">
          <SectionLabel>Order masuk</SectionLabel>
          {expanded ? (
            <div className="space-y-3">
              <ExpandedRequest
                key={expanded.id}
                request={expanded}
                onDecline={() => decline(expanded)}
                onAccept={() => accept(expanded)}
                atLimit={accepted.length >= MAX_ORDERS_PER_BUDDY}
              />
              {collapsed.map((request) => (
                <CollapsedRequest key={request.id} request={request} onExpand={() => setExpandedId(request.id)} />
              ))}
            </div>
          ) : (
            <WaitingState />
          )}
        </section>
      ) : (
        <OfflineState onActivate={() => setOnline(true)} />
      )}

      {accepted.length > 0 && (
        <section aria-label="Sedang dikerjakan">
          <SectionLabel>
            <span className="inline-flex items-center gap-2">
              <Wallet size={17} className="text-accent" aria-hidden />
              Sedang dikerjakan ({accepted.length}/{MAX_ORDERS_PER_BUDDY})
            </span>
          </SectionLabel>
          <ul className="space-y-3">
            {accepted.map((request) => (
              <ActiveRequest key={request.id} request={request} onComplete={() => complete(request)} />
            ))}
          </ul>
          <p className="mt-2.5 text-[12px] leading-snug text-buddy-muted">
            Dana ditahan sistem dan diteruskan ke saldomu setelah pemesan mengonfirmasi.
          </p>
        </section>
      )}

      <p className="mt-8 text-center text-[12px] leading-snug text-buddy-muted">
        Maks. {MAX_ORDERS_PER_BUDDY} order per antrean agar adil untuk pengantre lain.
      </p>
    </Screen>
  )
}
