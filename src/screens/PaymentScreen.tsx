import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { Button, Card, Header, InfoNote, Screen } from '../components'
import { useAppState, useOrder, usePlace } from '../state/AppState'
import type { Order, Place } from '../state/types'
import { formatRupiah } from '../lib/format'
import { ROUTES } from '../routes'
import { ORDER_TYPE_LABEL, itemsSummary, orderCode } from './order/orderText'
import { PaymentMethods, type PayMethod } from './order/PaymentMethods'
import { NotFoundScreen } from './parts/ui'

/** Fake "verifying with the payment provider" delay. */
const VERIFY_MS = 1200

function orderSummary(order: Order, place: Place | undefined): string {
  const placeName = place?.name ?? 'Tempat'
  if (order.type === 'joki') {
    return `${ORDER_TYPE_LABEL.joki} · ${placeName}${order.queueNumber ? ` · antrean ${order.queueNumber}` : ''}`
  }
  return `${itemsSummary(order)} · ${placeName}`
}

/** Pembayaran (no Figma frame): fake QRIS / e-wallet, then escrow → Lacak Pesanan. */
export function PaymentScreen() {
  const { orderId } = useParams()
  const order = useOrder(orderId)
  if (!order) {
    return <NotFoundScreen title="Pembayaran" message="Pesanan ini tidak ditemukan. Mungkin data demo sudah di-reset." />
  }
  return <PaymentView key={order.id} order={order} />
}

function PaymentView({ order }: { order: Order }) {
  const navigate = useNavigate()
  const { actions } = useAppState()
  const place = usePlace(order.placeId)
  const [method, setMethod] = useState<PayMethod>('qris')
  const [verifying, setVerifying] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  if (order.status !== 'menunggu_bayar' && !verifying) {
    return <Navigate to={ROUTES.track(order.id)} replace />
  }

  const pay = () => {
    if (verifying) return
    setVerifying(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      actions.payOrder(order.id)
      navigate(ROUTES.track(order.id), { replace: true })
    }, VERIFY_MS)
  }

  const releaseMoment = order.type === 'joki' ? 'kamu konfirmasi sudah dapat giliran' : 'kamu konfirmasi pesanan diterima'

  const footer = (
    <Button
      fullWidth
      aria-busy={verifying}
      aria-disabled={verifying}
      onClick={pay}
      icon={verifying ? <LoaderCircle size={18} strokeWidth={2.4} className="animate-spin" /> : undefined}
    >
      {verifying ? 'Memverifikasi pembayaran…' : 'Saya sudah bayar'}
    </Button>
  )

  return (
    <Screen footer={footer}>
      <Header title="Pembayaran" subtitle={`${orderCode(order)} · ${ORDER_TYPE_LABEL[order.type]}`} />

      <Card padding="none" className="p-4">
        <p className="text-[12.5px] leading-[15px] text-muted">Total pembayaran</p>
        <p className="mt-1 text-[30px] leading-[36px] font-extrabold tracking-[-0.02em] text-ink tabular-nums">
          {formatRupiah(order.total)}
        </p>
        <p className="mt-1.5 text-[13px] leading-[1.35] text-ink/80">{orderSummary(order, place)}</p>
        <dl className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          {order.fees.map((fee) => (
            <div key={fee.label} className="flex justify-between gap-3 text-[12.5px] text-muted">
              <dt>{fee.label}</dt>
              <dd className="tabular-nums">{formatRupiah(fee.amount)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-3.5">
        <PaymentMethods method={method} onChange={setMethod} orderId={order.id} disabled={verifying} />
      </div>

      <InfoNote className="mt-3.5">
        Uangmu ditahan InLine (escrow) dan baru diteruskan ke buddy setelah {releaseMoment}.
      </InfoNote>
    </Screen>
  )
}
