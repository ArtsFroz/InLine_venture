import { cx } from '../lib/cx'

interface PromoBannerProps {
  text: string
  className?: string
}

/** The ONLY way promotions are shown: always carries the "PROMOSI" label. */
export function PromoBanner({ text, className }: PromoBannerProps) {
  return (
    <aside
      aria-label="Promosi"
      className={cx('flex min-h-[45px] items-center gap-2 rounded-xl bg-promo-bg px-3 py-2.5', className)}
    >
      <span className="inline-flex h-[25px] shrink-0 items-center rounded-full border border-promo/70 px-[10px] text-[10.5px] font-extrabold tracking-[0.06em] text-promo">
        PROMOSI
      </span>
      <p className="min-w-0 text-[13px] leading-[1.3] font-medium text-[#4a3a12]">{text}</p>
    </aside>
  )
}
