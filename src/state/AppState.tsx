import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { BUDDIES } from '../data/buddies'
import { DEFAULT_MEETING_POINT, defaultSpot } from '../data/campus'
import { getPlace } from '../data/places'
import { BUDDY_EARN_JOKI, BUDDY_EARN_TITIP, DEMO_STEP_MS, MAX_ORDERS_PER_BUDDY, buildFees } from '../data/pricing'
import { lastAutoStep, lastStep } from '../lib/orderSteps'
import type {
  ActiveQueue,
  AppState,
  Buddy,
  BuddyRequest,
  Campus,
  Category,
  Order,
  OrderLine,
  OrderType,
  Place,
} from './types'
import { isValidAppState } from './validate'

// ——— Constants & seed ———

const STORAGE_KEY = 'inline-demo-v1'
const FIRST_ORDER_NUMBER = 128 // first order is #QB-0128 (as in 7 · Lacak)
const REQUEST_REFILL_MS = 5000
/** Max 'baru' (incoming) requests shown at once; accepted ones don't count, so a 4th accept can be refused. */
const MAX_NEW_REQUESTS = 2
const MIN_PER_PERSON = 3

const SEED_QUEUE: ActiveQueue = {
  placeId: 'kopi-tepi',
  number: 'A028',
  serving: 'A024',
  ahead: 3,
  etaMin: 12,
  createdAt: '10:32',
  servingAt: '10:45',
  turnAt: '10:57',
}

const SEED_REQUESTS: readonly BuddyRequest[] = [
  {
    id: 'req-seed-1',
    type: 'titip',
    placeId: 'kopi-tepi',
    title: 'Kopi Tepi → Anggrek lobby lt. 1',
    detail: '2 item · Es Kopi Susu, Croissant Cokelat',
    earn: BUDDY_EARN_TITIP,
    etaMin: 15,
    status: 'baru',
  },
  {
    id: 'req-seed-2',
    type: 'joki',
    placeId: 'kedai-senja',
    title: 'Kedai Senja · antre untuk 1 orang',
    detail: 'Titik temu: Syahdan, lobby utama',
    earn: BUDDY_EARN_JOKI,
    etaMin: 25,
    status: 'baru',
  },
]

type RequestTemplate = Omit<BuddyRequest, 'id' | 'status'>

/** Fictional incoming orders that keep the Mode Buddy demo from running empty. */
const REQUEST_POOL: readonly RequestTemplate[] = [
  { type: 'titip', placeId: 'kopi-kaca', title: 'Kopi Kaca → Anggrek ruang kelas 712', detail: '1 item · Caffe Latte', earn: BUDDY_EARN_TITIP, etaMin: 12 },
  { type: 'joki', placeId: 'dapur-mahasiswa', title: 'Dapur Mahasiswa · antre untuk 1 orang', detail: 'Titik temu: Binus Square, food court', earn: BUDDY_EARN_JOKI, etaMin: 20 },
  { type: 'titip', placeId: 'roti-sudut', title: 'Roti Sudut → Binus Square ruang belajar bersama', detail: '2 item · Croissant Cokelat, Roti Sosis', earn: BUDDY_EARN_TITIP, etaMin: 15 },
  { type: 'joki', placeId: 'seduh-studio', title: 'Seduh Studio · antre untuk 1 orang', detail: 'Titik temu: Syahdan, lobby utama', earn: BUDDY_EARN_JOKI, etaMin: 18 },
  { type: 'titip', placeId: 'teras-teh', title: 'Teras Teh → Syahdan perpustakaan', detail: '2 item · Es Teh Leci, Teh Susu Boba', earn: BUDDY_EARN_TITIP, etaMin: 14 },
]

/** Fresh seed state (also what resetDemo() restores). */
export function createSeedState(): AppState {
  return {
    savedPlaceIds: ['kopi-tepi', 'kopi-kaca'],
    activeQueue: { ...SEED_QUEUE },
    orders: [],
    buddy: {
      online: false, // Profil shows "Aktifkan Mode Buddy" first, as in Figma
      earningsToday: 34000,
      completedToday: 5,
      requests: SEED_REQUESTS.map((request) => ({ ...request })),
    },
    demoAutoAdvance: true,
  }
}

// ——— Pure helpers ———

function formatOrderId(n: number): string {
  return `QB-${String(n).padStart(4, '0')}`
}

function nextOrderNumber(orders: readonly Order[]): number {
  const numbers = orders.map((order) => Number.parseInt(order.id.replace(/\D/g, ''), 10)).filter(Number.isFinite)
  return numbers.length > 0 ? Math.max(...numbers) + 1 : FIRST_ORDER_NUMBER
}

/** Live load of a buddy: their seed load + the user's paid, unfinished orders with them. */
export function getBuddyLoad(orders: readonly Order[], buddyId: string, excludeOrderId?: string): number {
  const base = BUDDIES.find((buddy) => buddy.id === buddyId)?.activeOrders ?? 0
  const mine = orders.filter((o) => o.buddyId === buddyId && o.status === 'aktif' && o.id !== excludeOrderId).length
  return base + mine
}

/** First buddy under MAX_ORDERS_PER_BUDDY; if everyone is full, the least-loaded one. */
function pickBuddyId(orders: readonly Order[], excludeOrderId?: string): string {
  const loads = BUDDIES.map((buddy) => ({ id: buddy.id, load: getBuddyLoad(orders, buddy.id, excludeOrderId) }))
  const free = loads.find((entry) => entry.load < MAX_ORDERS_PER_BUDDY)
  if (free) return free.id
  return loads.reduce((least, entry) => (entry.load < least.load ? entry : least)).id
}

function isOpenOrder(order: Order): boolean {
  return order.status === 'aktif' || order.status === 'menunggu_bayar'
}

function cancelled(order: Order): Order {
  return { ...order, status: 'dibatalkan', escrow: 'dikembalikan' }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function clockPlus(base: Date, minutes: number): string {
  const d = new Date(base.getTime() + minutes * 60_000)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const QUEUE_LETTER: Readonly<Record<Category, string>> = { Kopi: 'A', Kantin: 'B', Minuman: 'C', Snack: 'D' }

function queueNumber(letter: string, n: number): string {
  return `${letter}${String(n).padStart(3, '0')}`
}

function buildQueue(place: Place, now: Date): ActiveQueue {
  // Kopi Tepi reproduces the Figma numbers (4 · Antrean Saya).
  if (place.id === SEED_QUEUE.placeId) return { ...SEED_QUEUE }
  const letter = QUEUE_LETTER[place.category]
  const charSum = [...place.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const serving = 10 + (charSum % 30)
  const ahead = Math.max(1, place.queueCount)
  const etaMin = Math.max(place.waitMin, ahead * MIN_PER_PERSON)
  return {
    placeId: place.id,
    number: queueNumber(letter, serving + ahead + 1),
    serving: queueNumber(letter, serving),
    ahead,
    etaMin,
    createdAt: clockPlus(now, 0),
    servingAt: clockPlus(now, 2),
    turnAt: clockPlus(now, etaMin),
  }
}

export interface CreateOrderInput {
  type: OrderType
  placeId: string
  items?: OrderLine[]
  deliverTo?: { campus: Campus; detail: string }
  meetingPoint?: string
  queueNumber?: string
}

function buildOrder(state: AppState, input: CreateOrderInput, id: string, createdAt: number): Order {
  const place = getPlace(input.placeId)
  const items = input.type === 'titip' ? (input.items ?? []).filter((line) => line.qty > 0).map((line) => ({ ...line })) : []
  const { fees, total } = buildFees(input.type, items)
  const base: Order = {
    id,
    type: input.type,
    placeId: input.placeId,
    createdAt,
    items,
    fees,
    total,
    status: 'menunggu_bayar',
    step: 0,
    buddyId: pickBuddyId(state.orders),
    escrow: 'ditahan',
  }
  if (input.type === 'joki') {
    const sameQueue = state.activeQueue?.placeId === input.placeId ? state.activeQueue.number : undefined
    const queue = input.queueNumber ?? sameQueue
    return {
      ...base,
      meetingPoint: input.meetingPoint?.trim() || DEFAULT_MEETING_POINT,
      ...(queue ? { queueNumber: queue } : {}),
    }
  }
  const campus = input.deliverTo?.campus ?? place?.campus ?? 'Anggrek'
  const detail = input.deliverTo?.detail.trim() || defaultSpot(campus)
  return { ...base, deliverTo: { campus, detail } }
}

function demoOrderInput(type: OrderType): CreateOrderInput {
  if (type === 'joki') return { type, placeId: 'kopi-tepi', queueNumber: SEED_QUEUE.number, meetingPoint: DEFAULT_MEETING_POINT }
  const place = getPlace('kopi-tepi')
  const pick = (name: string): OrderLine[] => {
    const item = place?.menu.find((m) => m.name === name)
    return item ? [{ menuId: item.id, name: item.name, price: item.price, qty: 1 }] : []
  }
  return {
    type,
    placeId: 'kopi-tepi',
    items: [...pick('Es Kopi Susu'), ...pick('Croissant Cokelat')],
    deliverTo: { campus: 'Anggrek', detail: 'Lobby lt. 1' },
  }
}

// ——— Reducer ———

type Action =
  | { type: 'toggleSaved'; placeId: string }
  | { type: 'setQueue'; queue: ActiveQueue | null }
  | { type: 'addOrder'; order: Order }
  | { type: 'payOrder'; orderId: string; queue?: ActiveQueue }
  | { type: 'cancelQueue' }
  | { type: 'clearOpenOrders' }
  | { type: 'advanceOrder'; orderId: string }
  | { type: 'autoAdvance' }
  | { type: 'completeOrder'; orderId: string }
  | { type: 'reviewOrder'; orderId: string; review: NonNullable<Order['review']> }
  | { type: 'setBuddyOnline'; online: boolean }
  | { type: 'acceptRequest'; id: string }
  | { type: 'declineRequest'; id: string }
  | { type: 'completeRequest'; id: string }
  | { type: 'addRequest'; request: BuddyRequest }
  | { type: 'setDemoAutoAdvance'; on: boolean }
  | { type: 'reset' }

function updateOrder(state: AppState, orderId: string, update: (order: Order) => Order): AppState {
  if (!state.orders.some((order) => order.id === orderId)) return state
  return { ...state, orders: state.orders.map((order) => (order.id === orderId ? update(order) : order)) }
}

function canAutoAdvance(order: Order): boolean {
  return order.status === 'aktif' && order.step < lastAutoStep(order)
}

function acceptedCount(state: AppState): number {
  return state.buddy.requests.filter((request) => request.status === 'diterima').length
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'toggleSaved': {
      const saved = state.savedPlaceIds.includes(action.placeId)
      return {
        ...state,
        savedPlaceIds: saved
          ? state.savedPlaceIds.filter((id) => id !== action.placeId)
          : [...state.savedPlaceIds, action.placeId],
      }
    }
    case 'setQueue':
      return { ...state, activeQueue: action.queue }
    case 'addOrder':
      return { ...state, orders: [...state.orders, action.order] }
    case 'payOrder': {
      const target = state.orders.find((o) => o.id === action.orderId)
      if (!target || target.status !== 'menunggu_bayar') return state
      // Joki: the queue number is taken at payment time (backing out of QRIS leaves no queue).
      const queue = target.type === 'joki' ? (action.queue ?? state.activeQueue) : state.activeQueue
      const queueHere = queue && queue.placeId === target.placeId ? queue : null
      const paid = updateOrder(state, target.id, (order) => {
        const buddyFull = getBuddyLoad(state.orders, order.buddyId, order.id) >= MAX_ORDERS_PER_BUDDY
        return {
          ...order,
          status: 'aktif',
          escrow: 'ditahan',
          step: 1,
          buddyId: buddyFull ? pickBuddyId(state.orders, order.id) : order.buddyId,
          ...(order.type === 'joki' && queueHere ? { queueNumber: queueHere.number } : {}),
        }
      })
      return target.type === 'joki' && action.queue ? { ...paid, activeQueue: action.queue } : paid
    }
    case 'cancelQueue': {
      const placeId = state.activeQueue?.placeId
      return {
        ...state,
        activeQueue: null,
        orders: state.orders.map((order) =>
          order.type === 'joki' && order.placeId === placeId && isOpenOrder(order) ? cancelled(order) : order,
        ),
      }
    }
    case 'clearOpenOrders':
      if (!state.orders.some(isOpenOrder)) return state
      return { ...state, orders: state.orders.map((order) => (isOpenOrder(order) ? cancelled(order) : order)) }
    case 'advanceOrder':
      return updateOrder(state, action.orderId, (order) =>
        canAutoAdvance(order) ? { ...order, step: order.step + 1 } : order,
      )
    case 'autoAdvance':
      if (!state.orders.some(canAutoAdvance)) return state
      return {
        ...state,
        orders: state.orders.map((order) => (canAutoAdvance(order) ? { ...order, step: order.step + 1 } : order)),
      }
    case 'completeOrder': {
      const order = state.orders.find((o) => o.id === action.orderId)
      if (!order || order.status !== 'aktif') return state
      const next = updateOrder(state, order.id, (o) => ({ ...o, status: 'selesai', step: lastStep(o), escrow: 'diteruskan' }))
      const clearsQueue = order.type === 'joki' && state.activeQueue?.placeId === order.placeId
      return clearsQueue ? { ...next, activeQueue: null } : next
    }
    case 'reviewOrder':
      return updateOrder(state, action.orderId, (order) => ({ ...order, review: { ...action.review, tags: [...action.review.tags] } }))
    case 'setBuddyOnline':
      return { ...state, buddy: { ...state.buddy, online: action.online } }
    case 'acceptRequest': {
      const target = state.buddy.requests.find((r) => r.id === action.id)
      if (!target || target.status !== 'baru' || acceptedCount(state) >= MAX_ORDERS_PER_BUDDY) return state
      return {
        ...state,
        buddy: {
          ...state.buddy,
          requests: state.buddy.requests.map((r) => (r.id === action.id ? { ...r, status: 'diterima' } : r)),
        },
      }
    }
    case 'declineRequest':
      return {
        ...state,
        buddy: { ...state.buddy, requests: state.buddy.requests.filter((r) => r.id !== action.id) },
      }
    case 'completeRequest': {
      const target = state.buddy.requests.find((r) => r.id === action.id)
      if (!target) return state
      return {
        ...state,
        buddy: {
          ...state.buddy,
          earningsToday: state.buddy.earningsToday + target.earn,
          completedToday: state.buddy.completedToday + 1,
          requests: state.buddy.requests.filter((r) => r.id !== action.id),
        },
      }
    }
    case 'addRequest':
      if (!state.buddy.online || state.buddy.requests.filter((r) => r.status === 'baru').length >= MAX_NEW_REQUESTS) return state
      return { ...state, buddy: { ...state.buddy, requests: [...state.buddy.requests, action.request] } }
    case 'setDemoAutoAdvance':
      return { ...state, demoAutoAdvance: action.on }
    case 'reset':
      return createSeedState()
  }
}

// ——— Persistence ———

function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidAppState(parsed)) return createSeedState()
    // Drop anything that points at a place that no longer exists.
    return {
      ...parsed,
      savedPlaceIds: parsed.savedPlaceIds.filter((id) => getPlace(id) !== undefined),
      activeQueue: parsed.activeQueue && getPlace(parsed.activeQueue.placeId) ? parsed.activeQueue : null,
      orders: parsed.orders.filter((order) => getPlace(order.placeId) !== undefined),
    }
  } catch {
    // Storage blocked (private mode) or corrupted JSON: the demo runs from the seed.
    return createSeedState()
  }
}

function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: the demo keeps working in memory only.
  }
}

// ——— Context ———

export interface AppActions {
  toggleSaved(placeId: string): void
  /** Takes a queue number at a place (replaces any current queue). Returns the new queue, or null for an unknown place. */
  takeQueue(placeId: string): ActiveQueue | null
  /** Also cancels open joki orders for that place (escrow 'dikembalikan'). */
  cancelQueue(): void
  /** Creates an unpaid order ('menunggu_bayar') and returns it synchronously. */
  createOrder(input: CreateOrderInput): Order
  /** Joki: takes a queue at the place first when there is none (sets order.queueNumber). */
  payOrder(orderId: string): void
  /** Cancels every 'aktif'/'menunggu_bayar' order (escrow refunded, buddy load released). */
  clearOpenOrders(): void
  advanceOrder(orderId: string): void
  completeOrder(orderId: string): void
  reviewOrder(orderId: string, review: NonNullable<Order['review']>): void
  setBuddyOnline(online: boolean): void
  /** false when 3 requests are already accepted (max 3 orders per buddy per queue). */
  acceptRequest(id: string): boolean
  declineRequest(id: string): void
  completeRequest(id: string): void
  setDemoAutoAdvance(on: boolean): void
  resetDemo(): void
  /** Creates an already-paid Kopi Tepi order at `step` (last step = finished). For the demo controls. */
  seedDemoOrder(type: OrderType, step: number): Order
}

interface AppStateContextValue {
  state: AppState
  actions: AppActions
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadState)
  const [state, dispatch] = useReducer(reducer, initial)
  // Mirror of the reducer state, updated eagerly so actions can return values synchronously.
  const stateRef = useRef(initial)
  const orderSeqRef = useRef(nextOrderNumber(initial.orders))
  const poolIndexRef = useRef(0)

  const send = useMemo(
    () => (action: Action) => {
      stateRef.current = reducer(stateRef.current, action)
      dispatch(action)
    },
    [],
  )

  const actions = useMemo<AppActions>(() => {
    const allocateOrderId = (): string => {
      const seq = Math.max(orderSeqRef.current, nextOrderNumber(stateRef.current.orders))
      orderSeqRef.current = seq + 1
      return formatOrderId(seq)
    }
    return {
      toggleSaved: (placeId) => send({ type: 'toggleSaved', placeId }),
      takeQueue: (placeId) => {
        const place = getPlace(placeId)
        if (!place) return null
        const queue = buildQueue(place, new Date())
        send({ type: 'setQueue', queue })
        return queue
      },
      cancelQueue: () => send({ type: 'cancelQueue' }),
      clearOpenOrders: () => send({ type: 'clearOpenOrders' }),
      createOrder: (input) => {
        const order = buildOrder(stateRef.current, input, allocateOrderId(), Date.now())
        send({ type: 'addOrder', order })
        return order
      },
      payOrder: (orderId) => {
        const s = stateRef.current
        const order = s.orders.find((o) => o.id === orderId)
        const place = order ? getPlace(order.placeId) : undefined
        const needsQueue = order?.type === 'joki' && place !== undefined && s.activeQueue?.placeId !== order.placeId
        send(needsQueue && place ? { type: 'payOrder', orderId, queue: buildQueue(place, new Date()) } : { type: 'payOrder', orderId })
      },
      advanceOrder: (orderId) => send({ type: 'advanceOrder', orderId }),
      completeOrder: (orderId) => send({ type: 'completeOrder', orderId }),
      reviewOrder: (orderId, review) => send({ type: 'reviewOrder', orderId, review }),
      setBuddyOnline: (online) => send({ type: 'setBuddyOnline', online }),
      acceptRequest: (id) => {
        const before = stateRef.current
        send({ type: 'acceptRequest', id })
        return stateRef.current !== before
      },
      declineRequest: (id) => send({ type: 'declineRequest', id }),
      completeRequest: (id) => send({ type: 'completeRequest', id }),
      setDemoAutoAdvance: (on) => send({ type: 'setDemoAutoAdvance', on }),
      resetDemo: () => {
        orderSeqRef.current = FIRST_ORDER_NUMBER
        poolIndexRef.current = 0
        send({ type: 'reset' })
      },
      seedDemoOrder: (type, step) => {
        const draft = buildOrder(stateRef.current, demoOrderInput(type), allocateOrderId(), Date.now())
        const last = lastStep(draft)
        const target = Math.min(Math.max(Math.round(step), 1), last)
        const done = target >= last
        const order: Order = {
          ...draft,
          status: done ? 'selesai' : 'aktif',
          step: target,
          escrow: done ? 'diteruskan' : 'ditahan',
        }
        send({ type: 'addOrder', order })
        return order
      },
    }
  }, [send])

  useEffect(() => saveState(state), [state])

  // Demo timer: one global timer advances every active order one step per DEMO_STEP_MS
  // (re-armed whenever any advanceable order changes step).
  const advanceKey = state.demoAutoAdvance
    ? state.orders
        .filter(canAutoAdvance)
        .map((order) => `${order.id}:${order.step}`)
        .join('|')
    : ''
  useEffect(() => {
    if (!advanceKey) return undefined
    const timer = window.setTimeout(() => send({ type: 'autoAdvance' }), DEMO_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [advanceKey, send])

  // Mode Buddy never runs empty: while online, add a new request ~5s after the last 'baru' one is handled
  // (max MAX_NEW_REQUESTS 'baru' at once; accepted requests don't count).
  const newRequests = state.buddy.requests.filter((request) => request.status === 'baru').length
  const needsRequest = state.buddy.online && newRequests < 1
  useEffect(() => {
    if (!needsRequest) return undefined
    const timer = window.setTimeout(() => {
      const template = REQUEST_POOL[poolIndexRef.current % REQUEST_POOL.length]
      poolIndexRef.current += 1
      send({ type: 'addRequest', request: { ...template, id: `req-${Date.now().toString(36)}`, status: 'baru' } })
    }, REQUEST_REFILL_MS)
    return () => window.clearTimeout(timer)
  }, [needsRequest, send])

  const value = useMemo(() => ({ state, actions }), [state, actions])
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

// ——— Hooks ———

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>')
  return ctx
}

export function usePlace(id: string | undefined): Place | undefined {
  return useMemo(() => (id ? getPlace(id) : undefined), [id])
}

export function useOrder(id: string | undefined): Order | undefined {
  const { state } = useAppState()
  return useMemo(() => (id ? state.orders.find((order) => order.id === id) : undefined), [state.orders, id])
}

/** Paid, unfinished orders (status 'aktif'), newest first. */
export function useActiveOrders(): Order[] {
  const { state } = useAppState()
  return useMemo(
    () => state.orders.filter((order) => order.status === 'aktif').sort((a, b) => b.createdAt - a.createdAt),
    [state.orders],
  )
}

/** A buddy with live `activeOrders` (seed load + the user's active orders with them). */
export function useBuddy(id: string | undefined): Buddy | undefined {
  const { state } = useAppState()
  return useMemo(() => {
    const buddy = BUDDIES.find((b) => b.id === id)
    return buddy ? { ...buddy, activeOrders: getBuddyLoad(state.orders, buddy.id) } : undefined
  }, [state.orders, id])
}
