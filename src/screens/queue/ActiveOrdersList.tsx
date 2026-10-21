import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingBag, UserRound } from 'lucide-react'
import { SectionTitle } from '../../components'
import { getPlace } from '../../data/places'
import type { Order } from '../../state/types'
import { ROUTES } from '../../routes'
import { ORDER_TYPE_LABEL, currentStepLabel } from '../order/orderText'

interface ActiveOrdersListProps {
  orders: readonly Order[]
  className?: string
}

/** "Pesanan berjalan": one compact row per paid, unfinished order → back to Lacak Pesanan. */
export function ActiveOrdersList({ orders, className }: ActiveOrdersListProps) {
  if (orders.length === 0) return null
  return (
    <section aria-label="Pesanan berjalan" className={className}>
      <SectionTitle title="Pesanan berjalan" />
      <ul className="flex flex-col gap-2.5">
        {orders.map((order) => {
          const Icon = order.type === 'joki' ? UserRound : ShoppingBag
          const placeName = getPlace(order.placeId)?.name ?? 'Tempat'
          return (
            <li key={order.id}>
              <Link
                to={ROUTES.track(order.id)}
                className="flex items-center gap-3 rounded-card bg-surface p-3.5 shadow-card transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.985] focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
              >
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Icon size={20} strokeWidth={2.1} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] leading-[18px] font-bold text-ink">
                    {ORDER_TYPE_LABEL[order.type]} · {placeName}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] leading-[15px] font-semibold text-primary">
                    {currentStepLabel(order)}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={2.2} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
