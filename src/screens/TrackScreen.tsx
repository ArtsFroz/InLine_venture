import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Header, Screen, StepTracker } from '../components'
import { useAppState, useBuddy, useOrder, usePlace } from '../state/AppState'
import type { Order } from '../state/types'
import { getTrackingHeadline, getTrackingSteps } from '../lib/orderSteps'
import { ROUTES } from '../routes'
import { ORDER_TYPE_LABEL, orderCode } from './order/orderText'
import { BuddyCard, ConfirmReleaseSheet, EscrowLine, HeadlineCard } from './order/TrackParts'
import { NotFoundScreen } from './parts/ui'

/** 7 · Lacak (titip) / 7a · Lacak (joki). Steps auto-advance via the global demo timer. */
export function TrackScreen() {
  const { orderId } = useParams()
  const order = useOrder(orderId)
  if (!order) {
    return <NotFoundScreen title="Lacak Pesanan" message="Pesanan ini tidak ditemukan. Mungkin data demo sudah di-reset." />
  }
  if (order.status === 'menunggu_bayar') return <Navigate to={ROUTES.pay(order.id)} replace />
  return <TrackView order={order} />
}

function TrackView({ order }: { order: Order }) {
  const navigate = useNavigate()
  const { actions } = useAppState()
  const place = usePlace(order.placeId)
  const buddy = useBuddy(order.buddyId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const steps = getTrackingSteps(order)
  const finished = order.status === 'selesai'
  const buddyName = buddy?.name ?? 'buddy'

  const confirm = () => {
    setConfirmOpen(false)
    actions.completeOrder(order.id)
    navigate(ROUTES.done(order.id), { replace: true })
  }

  let footer: ReactNode
  if (finished) {
    footer = (
      <Button fullWidth onClick={() => navigate(ROUTES.done(order.id))}>
        Beri penilaian buddy
      </Button>
    )
  } else if (order.status === 'aktif') {
    footer = (
      <Button fullWidth onClick={() => setConfirmOpen(true)}>
        {order.type === 'joki' ? 'Saya sudah dapat giliran' : 'Pesanan Sudah Diterima'}
      </Button>
    )
  } else {
    footer = (
      <Button variant="outline" fullWidth onClick={() => navigate(ROUTES.home, { replace: true })}>
        Kembali ke Home
      </Button>
    )
  }

  return (
    <Screen footer={footer}>
      <Header
        title="Lacak Pesanan"
        subtitle={`${orderCode(order)} · ${ORDER_TYPE_LABEL[order.type]}`}
        onBack={() => navigate(ROUTES.queue, { replace: true })}
      />

      <HeadlineCard headline={getTrackingHeadline(order, place)} />

      <Card padding="none" className="mt-3.5 px-3.5 py-2.5">
        <StepTracker steps={steps} current={finished ? steps.length : order.step} />
      </Card>

      {buddy && (
        <div className="mt-3.5">
          <BuddyCard buddy={buddy} />
        </div>
      )}
      {order.status !== 'dibatalkan' && <EscrowLine order={order} buddyName={buddyName} />}

      <ConfirmReleaseSheet
        open={confirmOpen && order.status === 'aktif'}
        order={order}
        buddyName={buddyName}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirm}
      />
    </Screen>
  )
}
