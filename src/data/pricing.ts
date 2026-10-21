import type { FeeLine, OrderLine, OrderType } from '../state/types'

// All prices in Rupiah.
export const JOKI_FEE = 5000
export const SERVICE_FEE = 1000
export const DELIVERY_FEE = 7000
export const BUDDY_EARN_TITIP = 6000
export const BUDDY_EARN_JOKI = 4000
export const MAX_ORDERS_PER_BUDDY = 3
/** How often a tracking step advances by itself in demo mode. */
export const DEMO_STEP_MS = 4000

export const FEE_LABELS = {
  joki: 'Biaya joki',
  service: 'Biaya layanan',
  subtotal: 'Subtotal menu',
  delivery: 'Ongkos antar',
} as const

export function menuSubtotal(items: readonly OrderLine[]): number {
  return items.reduce((sum, line) => sum + line.price * line.qty, 0)
}

/**
 * Fee lines + total for an order. Joki: Rp5.000 + Rp1.000 = Rp6.000.
 * Titip: menu subtotal + Rp7.000 ongkos antar.
 */
export function buildFees(type: OrderType, items: readonly OrderLine[] = []): { fees: FeeLine[]; total: number } {
  const fees: FeeLine[] =
    type === 'joki'
      ? [
          { label: FEE_LABELS.joki, amount: JOKI_FEE },
          { label: FEE_LABELS.service, amount: SERVICE_FEE },
        ]
      : [
          { label: FEE_LABELS.subtotal, amount: menuSubtotal(items) },
          { label: FEE_LABELS.delivery, amount: DELIVERY_FEE },
        ]
  return { fees, total: fees.reduce((sum, fee) => sum + fee.amount, 0) }
}

export function buddyEarning(type: OrderType): number {
  return type === 'joki' ? BUDDY_EARN_JOKI : BUDDY_EARN_TITIP
}
