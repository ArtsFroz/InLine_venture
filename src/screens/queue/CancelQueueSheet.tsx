import { TriangleAlert } from 'lucide-react'
import { BottomSheet, Button } from '../../components'
import type { ActiveQueue } from '../../state/types'

interface CancelQueueSheetProps {
  open: boolean
  queue: ActiveQueue
  onClose: () => void
  onConfirm: () => void
}

/** 4b · Konfirmasi batal: keeping the queue is the primary (safe) action. */
export function CancelQueueSheet({ open, queue, onClose, onConfirm }: CancelQueueSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      icon={<TriangleAlert size={26} strokeWidth={2} />}
      iconTone="danger"
      title={`Batalkan antrean ${queue.number}?`}
    >
      <p className="text-center text-[13.5px] leading-[1.4] text-muted">
        Nomor antreanmu akan hilang dan kamu harus ambil antrean baru dari awal. Saat ini tinggal {queue.ahead} orang lagi
        (±{queue.etaMin} menit).
      </p>
      <div className="mt-5 flex flex-col gap-3.5">
        <Button fullWidth onClick={onClose}>
          Tidak, tetap antre
        </Button>
        <Button variant="danger" fullWidth onClick={onConfirm}>
          Ya, batalkan antrean
        </Button>
      </div>
    </BottomSheet>
  )
}
