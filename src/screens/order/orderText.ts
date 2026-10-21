// Display strings for orders, shared by Payment / Lacak / Selesai / Antrean Saya.
import type { Order, OrderType } from '../../state/types'
import { getTrackingSteps, lastStep } from '../../lib/orderSteps'

export const ORDER_TYPE_LABEL: Readonly<Record<OrderType, string>> = {
  joki: 'Joki Antre',
  titip: 'Titip Beli & Antar',
}

/** "#QB-0128" */
export function orderCode(order: Order): string {
  return `#${order.id}`
}

/** Label of the step that is currently in progress (or the last one when finished). */
export function currentStepLabel(order: Order): string {
  const steps = getTrackingSteps(order)
  return steps[Math.min(order.step, lastStep(order))] ?? steps[0]
}

/** "2 item · Es Kopi Susu, Croissant Cokelat" */
export function itemsSummary(order: Order): string {
  const count = order.items.reduce((sum, line) => sum + line.qty, 0)
  return `${count} item · ${order.items.map((line) => line.name).join(', ')}`
}
