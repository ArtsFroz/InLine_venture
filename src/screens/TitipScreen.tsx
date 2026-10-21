import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CostSummary, Header, InfoNote, QuantityStepper, Screen } from '../components'
import { defaultSpot } from '../data/campus'
import { buildFees } from '../data/pricing'
import { useAppState, usePlace } from '../state/AppState'
import type { Campus, OrderLine, Place } from '../state/types'
import { formatRupiah } from '../lib/format'
import { ROUTES } from '../routes'
import { DeliverToCard } from './order/DeliverToCard'
import { opensAt } from './parts/placeText'
import { LABEL_CLASS, NotFoundScreen } from './parts/ui'

/** Figma (Kopi Tepi): the first two menu items start at 1, the rest at 0. */
const PRESELECTED_ITEMS = 2

function initialQuantities(place: Place): Record<string, number> {
  return Object.fromEntries(place.menu.map((item, index) => [item.id, index < PRESELECTED_ITEMS ? 1 : 0]))
}

/** 5b · Titip Beli & Antar: a buddy buys the menu and delivers it inside the campus. */
export function TitipScreen() {
  const { placeId } = useParams()
  const place = usePlace(placeId)
  if (!place) {
    return <NotFoundScreen title="Titip Beli & Antar" message="Tempat untuk titip beli tidak ditemukan. Pilih tempat dari Home." />
  }
  return <TitipForm key={place.id} place={place} />
}

function TitipForm({ place }: { place: Place }) {
  const navigate = useNavigate()
  const { actions } = useAppState()
  const [quantities, setQuantities] = useState(() => initialQuantities(place))
  const [campus, setCampus] = useState<Campus>(place.campus)
  const [spot, setSpot] = useState(() => defaultSpot(place.campus))
  const [spotEdited, setSpotEdited] = useState(false)

  const items = useMemo<OrderLine[]>(
    () =>
      place.menu
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({ menuId: item.id, name: item.name, price: item.price, qty: quantities[item.id] ?? 0 })),
    [place.menu, quantities],
  )
  const { fees, total } = buildFees('titip', items)
  const canOrder = place.isOpen && items.length > 0 && spot.trim().length > 0

  const changeCampus = (next: Campus) => {
    setCampus(next)
    if (!spotEdited) setSpot(defaultSpot(next))
  }

  const changeSpot = (next: string) => {
    setSpot(next)
    setSpotEdited(true)
  }

  const order = () => {
    if (!canOrder) return
    const created = actions.createOrder({ type: 'titip', placeId: place.id, items, deliverTo: { campus, detail: spot.trim() } })
    navigate(ROUTES.pay(created.id))
  }

  const footer = (
    <Button fullWidth disabled={!canOrder} onClick={order}>
      Pesan &amp; Bayar (QRIS / e-wallet)
    </Button>
  )

  return (
    <Screen footer={footer}>
      <Header title="Titip Beli & Antar" subtitle="Diantar ke lokasimu di dalam BINUS" />

      <Card padding="none" className="p-3.5">
        <p className={LABEL_CLASS}>Beli dari</p>
        <p className="mt-2 text-[16px] leading-[19px] font-bold text-ink">
          {place.name} · estimasi antre ±{place.waitMin} mnt
        </p>
      </Card>

      <Card as="section" padding="none" className="mt-3.5 p-3.5" ariaLabel="Pilih menu">
        <h2 className="text-[15px] leading-[18px] font-bold text-ink">Pilih menu</h2>
        <ul className="mt-2 flex flex-col">
          {place.menu.map((item) => (
            <li key={item.id} className="flex min-h-[47px] items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14.5px] leading-[18px] font-medium text-ink">{item.name}</p>
                <p className="text-[12.5px] leading-[15px] text-muted">{formatRupiah(item.price)}</p>
              </div>
              <QuantityStepper
                label={item.name}
                value={quantities[item.id] ?? 0}
                onChange={(qty) => setQuantities((prev) => ({ ...prev, [item.id]: qty }))}
              />
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="mt-1 text-[12px] text-danger-dark">Pilih minimal 1 menu.</p>}
      </Card>

      <div className="mt-3.5">
        <DeliverToCard campus={campus} spot={spot} onCampusChange={changeCampus} onSpotChange={changeSpot} />
      </div>

      {!place.isOpen && (
        <InfoNote tone="amber" className="mt-3.5">
          {place.name} sedang tutup. Titip beli bisa dipesan mulai {opensAt(place)}.
        </InfoNote>
      )}

      <CostSummary
        lines={fees}
        total={total}
        className="mt-3.5"
        note="Uangmu ditahan sistem dan baru diteruskan ke buddy setelah pesanan diterima."
      />
    </Screen>
  )
}
