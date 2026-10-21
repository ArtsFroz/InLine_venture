import { useId, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, ShieldCheck } from 'lucide-react'
import { Button, Chip, Screen, StarRating, showToast } from '../components'
import { useAppState, useBuddy, useOrder } from '../state/AppState'
import type { Order } from '../state/types'
import { formatRupiah } from '../lib/format'
import { ROUTES } from '../routes'
import { NotFoundScreen } from './parts/ui'

const REVIEW_TAGS: readonly string[] = ['Cepat', 'Ramah', 'Pesanan sesuai', 'Komunikatif']
const DEFAULT_STARS = 4
const DEFAULT_TAGS: readonly string[] = ['Cepat', 'Ramah']
const MAX_COMMENT = 280

/** 8 · Pesanan Selesai: escrow released + rate the buddy. */
export function OrderDoneScreen() {
  const { orderId } = useParams()
  const order = useOrder(orderId)
  if (!order) {
    return <NotFoundScreen title="Pesanan Selesai" message="Pesanan ini tidak ditemukan. Mungkin data demo sudah di-reset." />
  }
  if (order.status !== 'selesai') return <Navigate to={ROUTES.track(order.id)} replace />
  return <DoneView key={order.id} order={order} />
}

function DoneView({ order }: { order: Order }) {
  const navigate = useNavigate()
  const { actions } = useAppState()
  const buddy = useBuddy(order.buddyId)
  const commentId = useId()
  const [stars, setStars] = useState(order.review?.stars ?? DEFAULT_STARS)
  const [tags, setTags] = useState<string[]>(() => [...(order.review?.tags ?? DEFAULT_TAGS)])
  const [comment, setComment] = useState(order.review?.comment ?? '')

  const goHome = () => navigate(ROUTES.home, { replace: true })

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const submit = () => {
    actions.reviewOrder(order.id, { stars, tags, comment: comment.trim() })
    showToast('Terima kasih atas penilaianmu!')
    goHome()
  }

  const footer = (
    <Button fullWidth disabled={stars === 0} onClick={submit}>
      Kirim Penilaian
    </Button>
  )

  return (
    <Screen footer={footer} className="relative flex min-h-full flex-col">
      <button
        type="button"
        onClick={goHome}
        className="absolute top-3 right-3 flex h-11 items-center rounded-full px-3 text-[13px] font-medium text-muted/80 transition-colors hover:bg-black/5 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
      >
        Lewati
      </button>

      <div className="my-auto w-full py-6">
        <div className="flex flex-col items-center text-center">
          <div
            aria-hidden
            className="flex size-20 animate-pop items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_28px_rgba(21,128,61,0.32)]"
          >
            <Check size={40} strokeWidth={2} />
          </div>
          <h1 className="mt-3.5 text-[26px] leading-[30px] font-extrabold tracking-[-0.02em] text-ink">Pesanan selesai!</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] leading-[1.35] font-medium text-primary-dark/85">
            <ShieldCheck size={14} strokeWidth={2.2} className="shrink-0 text-primary" aria-hidden />
            {formatRupiah(order.total)} sudah diteruskan ke {buddy?.name ?? 'buddy'}
          </p>
          <h2 className="mt-3.5 text-[14.5px] leading-[18px] font-medium text-muted">Bagaimana layanan buddy kamu?</h2>
          <StarRating value={stars} onChange={setStars} size={34} className="mt-3.5" />

          <div role="group" aria-label="Yang kamu suka" className="mt-3.5 flex flex-wrap justify-center gap-2">
            {REVIEW_TAGS.map((tag) => (
              <Chip key={tag} label={tag} size="sm" selected={tags.includes(tag)} onClick={() => toggleTag(tag)} />
            ))}
          </div>
        </div>

        <label htmlFor={commentId} className="sr-only">
          Komentar untuk buddy
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={3}
          placeholder="Tulis komentar (opsional)"
          className="mt-3.5 block h-[88px] w-full resize-none rounded-tile bg-surface px-3.5 py-3.5 text-[16px] leading-[1.35] text-ink shadow-card placeholder:text-[14px] placeholder:text-muted/80 focus:ring-[3px] focus:ring-primary/20 focus:outline-none sm:text-[14px]"
        />
      </div>
    </Screen>
  )
}
