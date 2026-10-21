import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { FeeLine } from '../state/types'
import { formatRupiah } from '../lib/format'
import { Card } from './Card'
import { cx } from '../lib/cx'

interface CostSummaryProps {
  lines: FeeLine[]
  total: number
  /** Optional green escrow note under the total (05b "Uangmu ditahan sistem…"). */
  note?: ReactNode
  /** Render without the white card wrapper. */
  bare?: boolean
  className?: string
}

/** Fee rows + hairline + bold Total (05 / 05b). */
export function CostSummary({ lines, total, note, bare = false, className }: CostSummaryProps) {
  const body = (
    <>
      <dl className="flex flex-col gap-2">
        {lines.map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-4 text-[13.5px] leading-[1.2]">
            <dt className="text-ink/85">{line.label}</dt>
            <dd className="tabular-nums text-ink/85">{formatRupiah(line.amount)}</dd>
          </div>
        ))}
      </dl>
      <div aria-hidden className="my-2.5 h-px bg-line" />
      <div className="flex items-baseline justify-between gap-4 text-[14px] font-extrabold text-ink">
        <span>Total</span>
        <span className="tabular-nums">{formatRupiah(total)}</span>
      </div>
      {note && (
        <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-[1.35] text-primary-dark">
          <ShieldCheck size={16} strokeWidth={2.2} className="mt-px shrink-0 text-primary" aria-hidden />
          <span>{note}</span>
        </p>
      )}
    </>
  )

  if (bare) return <div className={className}>{body}</div>
  return (
    <Card padding="none" className={cx('px-3.5 py-3.5', className)}>
      {body}
    </Card>
  )
}
