// Shape checks for state restored from localStorage (never trust stored data).
import { CAMPUSES, type ActiveQueue, type AppState, type BuddyRequest, type Order } from './types'

type Rec = Record<string, unknown>

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const oneOf =
  <T extends string>(values: readonly T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (values as readonly string[]).includes(v)

const isOrderType = oneOf(['joki', 'titip'] as const)
const isOrderStatus = oneOf(['menunggu_bayar', 'aktif', 'selesai', 'dibatalkan'] as const)
const isEscrow = oneOf(['ditahan', 'diteruskan', 'dikembalikan'] as const)
const isRequestStatus = oneOf(['baru', 'diterima', 'ditolak', 'selesai'] as const)
const isCampus = oneOf(CAMPUSES)

function isQueue(v: unknown): v is ActiveQueue {
  return (
    isRecord(v) &&
    isString(v.placeId) &&
    isString(v.number) &&
    isString(v.serving) &&
    isNumber(v.ahead) &&
    isNumber(v.etaMin) &&
    isString(v.createdAt) &&
    isString(v.servingAt) &&
    isString(v.turnAt)
  )
}

function isOrderLine(v: unknown): boolean {
  return isRecord(v) && isString(v.menuId) && isString(v.name) && isNumber(v.price) && isNumber(v.qty)
}

function isFeeLine(v: unknown): boolean {
  return isRecord(v) && isString(v.label) && isNumber(v.amount)
}

function isOrder(v: unknown): v is Order {
  if (!isRecord(v)) return false
  const deliverOk =
    v.deliverTo === undefined || (isRecord(v.deliverTo) && isCampus(v.deliverTo.campus) && isString(v.deliverTo.detail))
  const reviewOk =
    v.review === undefined ||
    (isRecord(v.review) &&
      isNumber(v.review.stars) &&
      Array.isArray(v.review.tags) &&
      v.review.tags.every(isString) &&
      isString(v.review.comment))
  return (
    isString(v.id) &&
    isOrderType(v.type) &&
    isString(v.placeId) &&
    isNumber(v.createdAt) &&
    (v.queueNumber === undefined || isString(v.queueNumber)) &&
    (v.meetingPoint === undefined || isString(v.meetingPoint)) &&
    Array.isArray(v.items) &&
    v.items.every(isOrderLine) &&
    deliverOk &&
    Array.isArray(v.fees) &&
    v.fees.every(isFeeLine) &&
    isNumber(v.total) &&
    isOrderStatus(v.status) &&
    isNumber(v.step) &&
    isString(v.buddyId) &&
    isEscrow(v.escrow) &&
    reviewOk
  )
}

function isRequest(v: unknown): v is BuddyRequest {
  return (
    isRecord(v) &&
    isString(v.id) &&
    isOrderType(v.type) &&
    isString(v.placeId) &&
    isString(v.title) &&
    isString(v.detail) &&
    isNumber(v.earn) &&
    isNumber(v.etaMin) &&
    isRequestStatus(v.status)
  )
}

export function isValidAppState(v: unknown): v is AppState {
  if (!isRecord(v) || !isRecord(v.buddy)) return false
  const b = v.buddy
  return (
    Array.isArray(v.savedPlaceIds) &&
    v.savedPlaceIds.every(isString) &&
    (v.activeQueue === null || isQueue(v.activeQueue)) &&
    Array.isArray(v.orders) &&
    v.orders.every(isOrder) &&
    isBool(b.online) &&
    isNumber(b.earningsToday) &&
    isNumber(b.completedToday) &&
    Array.isArray(b.requests) &&
    b.requests.every(isRequest) &&
    isBool(v.demoAutoAdvance)
  )
}
