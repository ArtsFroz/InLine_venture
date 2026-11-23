import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { Button, Header, Screen, showToast } from '../components'
import { useActiveOrders, useAppState, usePlace } from '../state/AppState'
import { ROUTES } from '../routes'
import { ActiveOrdersList } from './queue/ActiveOrdersList'
import { CancelQueueSheet } from './queue/CancelQueueSheet'
import { QueueNumberCard, QueueSuccessBanner, QueueTimelineCard } from './queue/QueueCards'
import { EmptyState } from './parts/ui'

/** 4 · Antrean Saya (+ 4b cancel sheet; `?batal=1` opens it on load). */
export function QueueScreen() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { state, actions } = useAppState()
  const queue = state.activeQueue
  const place = usePlace(queue?.placeId)
  const activeOrders = useActiveOrders()
  const [sheetOpen, setSheetOpen] = useState(false)

  const batalParam = params.get('batal') === '1'
  const cancelOpen = Boolean(queue) && (sheetOpen || batalParam)

  const closeSheet = () => {
    setSheetOpen(false)
    if (batalParam) {
      const next = new URLSearchParams(params)
      next.delete('batal')
      setParams(next, { replace: true })
    }
  }

  const confirmCancel = () => {
    const number = queue?.number
    closeSheet()
    actions.cancelQueue()
    showToast(number ? `Antrean ${number} dibatalkan` : 'Antrean dibatalkan')
  }

  if (!queue) {
    return (
      <Screen nav>
        <Header title="Antrean Saya" />
        <EmptyState
          icon={<Ticket size={28} strokeWidth={2} />}
          title="Belum ada antrean aktif"
          action={
            <Button fullWidth onClick={() => navigate(ROUTES.results)}>
              Cari tempat
            </Button>
          }
        >
          Cari tempat yang sepi lewat AI Radar, lalu pakai Joki Antre supaya buddy yang mengantre untukmu.
        </EmptyState>
        <ActiveOrdersList orders={activeOrders} className="mt-2" />
      </Screen>
    )
  }

  const footer = (
    <div className="flex flex-col gap-3.5">
      <Button fullWidth onClick={() => navigate(ROUTES.joki(queue.placeId))}>
        Titipkan ke Joki Antre
      </Button>
      <Button variant="danger" fullWidth onClick={() => setSheetOpen(true)}>
        Batalkan Antrean
      </Button>
    </div>
  )

  return (
    <Screen nav footer={footer}>
      <Header title="Antrean Saya" />
      <QueueSuccessBanner />
      <div className="mt-3.5 flex flex-col gap-3.5">
        <QueueNumberCard queue={queue} place={place} />
        <QueueTimelineCard queue={queue} />
      </div>
      <ActiveOrdersList orders={activeOrders} className="mt-5" />
      <CancelQueueSheet open={cancelOpen} queue={queue} onClose={closeSheet} onConfirm={confirmCancel} />
    </Screen>
  )
}
