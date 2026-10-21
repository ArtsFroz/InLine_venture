// Tracking steps + the "Estimasi" headline for 7 · Lacak (titip) and 7a · Lacak (joki).
import type { Order, Place } from '../state/types'

const JOKI_STEPS: readonly string[] = [
  'Pesanan dibuat',
  'Buddy ditemukan',
  'Buddy sedang mengantre',
  'Giliranmu! Datang ke kasir',
  'Selesai',
]

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/** "Anggrek" + "Lobby lt. 1" → "Anggrek lobby lt. 1" (as in the Figma step). */
export function deliveryLabel(order: Order): string {
  return order.deliverTo ? `${order.deliverTo.campus} ${lowerFirst(order.deliverTo.detail)}` : 'lokasimu'
}

export function getTrackingSteps(order: Order): string[] {
  if (order.type === 'joki') return [...JOKI_STEPS]
  return [
    'Pesanan dibuat',
    'Buddy ditemukan',
    'Buddy sedang antre & membeli',
    `Diantar ke ${deliveryLabel(order)}`,
    'Pesanan diterima',
  ]
}

/** Last step the demo timer may reach; the final step only happens when the user confirms. */
export function lastAutoStep(order: Order): number {
  return getTrackingSteps(order).length - 2
}

export function lastStep(order: Order): number {
  return getTrackingSteps(order).length - 1
}

export interface TrackingHeadline {
  label: 'Estimasi'
  title: string
  body: string
}

function headline(title: string, body: string): TrackingHeadline {
  return { label: 'Estimasi', title, body }
}

export function getTrackingHeadline(order: Order, place?: Place): TrackingHeadline {
  const placeName = place?.name ?? 'tempat tujuan'
  if (order.status === 'dibatalkan') {
    return headline('Dibatalkan', 'Pesanan dibatalkan. Dana dikembalikan ke saldomu.')
  }
  if (order.status === 'menunggu_bayar') {
    return headline('Menunggu pembayaran', 'Selesaikan pembayaran QRIS / e-wallet agar buddy bisa mulai.')
  }
  const step = Math.min(order.step, lastStep(order))

  if (order.type === 'joki') {
    const meet = order.meetingPoint ?? 'titik temu'
    switch (step) {
      case 0:
      case 1:
        return headline('Giliran ±15 menit', `Buddy terverifikasi NIM sudah ditemukan dan menuju antrean di ${placeName}.`)
      case 2:
        return headline('Giliran ±12 menit', 'Buddy mengantre untukmu. Kami kabari saat giliranmu tinggal 2 orang.')
      case 3:
        return headline('Giliranmu sekarang!', `Datang ke kasir ${placeName} — buddy menunggumu (titik temu: ${meet}).`)
      default:
        return headline('Selesai', 'Giliranmu sudah dipakai. Dana diteruskan ke buddy.')
    }
  }

  switch (step) {
    case 0:
    case 1:
      return headline('±20 menit', `Buddy terverifikasi NIM sudah ditemukan dan menuju ${placeName}.`)
    case 2:
      return headline('±15 menit', `Buddy sedang antre di ${placeName} untuk membelikan pesananmu.`)
    case 3:
      return headline('±5 menit', `Pesananmu sedang diantar ke ${deliveryLabel(order)}.`)
    default:
      return headline('Pesanan diterima', 'Terima kasih! Dana sudah diteruskan ke buddy.')
  }
}
