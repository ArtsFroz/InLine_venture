import { useId } from 'react'
import { QrCode, Wallet } from 'lucide-react'
import { Card } from '../../components'
import { cx } from '../../lib/cx'
import { FakeQr } from './FakeQr'

export type PayMethod = 'qris' | 'ewallet'

const METHODS: ReadonlyArray<{ key: PayMethod; label: string }> = [
  { key: 'qris', label: 'QRIS' },
  { key: 'ewallet', label: 'E-wallet' },
]

interface PaymentMethodsProps {
  method: PayMethod
  onChange: (method: PayMethod) => void
  orderId: string
  disabled?: boolean
}

/** Segmented QRIS / E-wallet switch + the selected panel (generic, no real brands). */
export function PaymentMethods({ method, onChange, orderId, disabled = false }: PaymentMethodsProps) {
  const baseId = useId()
  return (
    <section aria-label="Metode pembayaran">
      <div role="tablist" aria-label="Metode pembayaran" className="flex rounded-full bg-[#e6ebe7] p-1">
        {METHODS.map(({ key, label }) => {
          const selected = key === method
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`${baseId}-${key}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${key}-panel`}
              disabled={disabled}
              onClick={() => onChange(key)}
              className={cx(
                'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px] transition-[background-color,color,box-shadow] duration-150',
                'focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none',
                selected ? 'bg-surface font-bold text-primary-dark shadow-soft' : 'font-medium text-muted hover:text-ink',
              )}
            >
              {key === 'qris' ? <QrCode size={16} aria-hidden /> : <Wallet size={16} aria-hidden />}
              {label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-${method}-panel`}
        aria-labelledby={`${baseId}-${method}-tab`}
        className="mt-3"
      >
        {method === 'qris' ? (
          <Card padding="none" className="flex flex-col items-center px-4 pt-5 pb-4 text-center">
            <div className="rounded-tile border border-line p-2.5">
              <FakeQr seed={orderId} />
            </div>
            <p className="mt-3 text-[13.5px] leading-[1.35] font-semibold text-ink">Pindai dengan aplikasi bank / e-wallet</p>
            <p className="mt-2 inline-flex rounded-full bg-crowd-mid-bg px-3 py-1 text-[11.5px] font-bold text-[#7a4f08]">
              QRIS demo — tidak ada pembayaran sungguhan
            </p>
          </Card>
        ) : (
          <Card padding="none" className="flex items-center gap-3 p-4">
            <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-tile bg-primary-light text-primary">
              <Wallet size={24} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] leading-[18px] font-bold text-ink">Bayar dengan e-wallet</p>
              <p className="mt-1 text-[12.5px] leading-[1.35] text-muted">
                Konfirmasi di aplikasi e-wallet pilihanmu, lalu kembali ke sini. Demo — tidak ada pembayaran sungguhan.
              </p>
            </div>
          </Card>
        )}
      </div>
    </section>
  )
}
