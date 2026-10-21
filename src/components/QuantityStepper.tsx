import { Minus, Plus } from 'lucide-react'
import { cx } from '../lib/cx'

interface QuantityStepperProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  /** Item name for screen readers, e.g. "Es Kopi Susu". */
  label: string
  className?: string
}

const ROUND_BUTTON =
  'relative flex size-9 items-center justify-center rounded-full after:absolute after:-inset-1 after:content-[""] ' +
  'transition-[transform,background-color,color] duration-150 ease-out active:scale-90 ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 ' +
  'disabled:opacity-40 disabled:active:scale-100'

/** − value + stepper (05b). The + turns solid green once value > 0. */
export function QuantityStepper({ value, onChange, min = 0, max = 9, label, className }: QuantityStepperProps) {
  const canDec = value > min
  const canInc = value < max
  const active = value > 0

  return (
    <div role="group" aria-label={`Jumlah ${label}`} className={cx('flex items-center gap-2', className)}>
      <button
        type="button"
        aria-label={`Kurangi ${label}`}
        disabled={!canDec}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cx(ROUND_BUTTON, 'bg-soft text-ink hover:bg-[#e2e7e3]')}
      >
        <Minus size={18} strokeWidth={2.4} aria-hidden />
      </button>
      <span aria-live="polite" className="w-5 text-center text-[15px] font-bold tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tambah ${label}`}
        disabled={!canInc}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cx(
          ROUND_BUTTON,
          active ? 'bg-primary text-white hover:bg-[#127436]' : 'bg-soft text-ink hover:bg-[#e2e7e3]',
        )}
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  )
}
