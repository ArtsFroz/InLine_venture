import { MessageSquare, ShieldCheck } from 'lucide-react'
import { Avatar, BottomSheet, Button, Card, IconButton, showToast } from '../../components'
import type { Buddy, Order } from '../../state/types'
import type { TrackingHeadline } from '../../lib/orderSteps'
import { formatRupiah } from '../../lib/format'

/** Green "Estimasi" card; the title re-animates whenever the step changes. */
export function HeadlineCard({ headline }: { headline: TrackingHeadline }) {
  return (
    <section
      aria-live="polite"
      className="rounded-card bg-primary px-[18px] pt-[18px] pb-5 text-white shadow-cta"
    >
      <p className="text-[12.5px] leading-[15px] text-white/85">{headline.label}</p>
      <div key={headline.title} className="animate-screen-in">
        <h2 className="mt-1.5 text-[28px] leading-[34px] font-extrabold tracking-[-0.02em]">{headline.title}</h2>
        <p className="mt-1.5 text-[13.5px] leading-[1.35] text-white/90">{headline.body}</p>
      </div>
    </section>
  )
}

/** Assigned buddy: avatar, name, NIM-verified + rating, chat (demo toast). */
export function BuddyCard({ buddy }: { buddy: Buddy }) {
  return (
    <Card padding="none" className="flex items-center gap-3 p-3.5">
      <Avatar name={buddy.name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] leading-[19px] font-bold text-ink">{buddy.name}</p>
        <p className="mt-0.5 text-[12.5px] leading-[15px] text-muted">Terverifikasi NIM · ★ {buddy.rating.toFixed(1)}</p>
      </div>
      <IconButton
        icon={<MessageSquare size={20} strokeWidth={2} aria-hidden />}
        label={`Chat dengan ${buddy.name}`}
        onClick={() => showToast('Chat dengan buddy (demo)')}
      />
    </Card>
  )
}

/** One-line escrow status under the buddy card. */
export function EscrowLine({ order, buddyName }: { order: Order; buddyName: string }) {
  const released = order.escrow === 'diteruskan'
  return (
    <p className="mt-3 flex items-start gap-2 px-1 text-[12.5px] leading-[1.4] text-primary-dark">
      <ShieldCheck size={16} strokeWidth={2.2} className="mt-px shrink-0 text-primary" aria-hidden />
      <span>
        {released
          ? `${formatRupiah(order.total)} sudah diteruskan ke buddy (${buddyName}).`
          : `${formatRupiah(order.total)} ditahan sistem (escrow) sampai pesanan diterima.`}
      </span>
    </p>
  )
}

interface ConfirmReleaseSheetProps {
  open: boolean
  order: Order
  buddyName: string
  onClose: () => void
  onConfirm: () => void
}

/** Confirming the order releases the held money to the buddy. */
export function ConfirmReleaseSheet({ open, order, buddyName, onClose, onConfirm }: ConfirmReleaseSheetProps) {
  const isJoki = order.type === 'joki'
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      icon={<ShieldCheck size={26} strokeWidth={2} />}
      iconTone="green"
      title={isJoki ? 'Sudah dapat giliran?' : 'Pesanan sudah diterima?'}
    >
      <p className="text-center text-[13.5px] leading-[1.4] text-muted">
        {isJoki ? 'Pastikan kamu sudah dilayani di kasir.' : 'Pastikan pesananmu sudah sampai dan sesuai.'} Setelah
        dikonfirmasi, <strong className="font-bold text-ink">{formatRupiah(order.total)}</strong> yang ditahan sistem
        diteruskan ke buddy ({buddyName}).
      </p>
      <div className="mt-5 flex flex-col gap-3.5">
        <Button fullWidth onClick={onConfirm}>
          Ya, teruskan ke buddy
        </Button>
        <Button variant="outline" fullWidth onClick={onClose}>
          Belum
        </Button>
      </div>
    </BottomSheet>
  )
}
