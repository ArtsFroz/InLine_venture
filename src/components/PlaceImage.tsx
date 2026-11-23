import { Coffee, Cookie, CupSoda, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Category } from '../state/types'
import { cx } from '../lib/cx'

interface PlaceImageProps {
  category: Category
  alt: string
  /** Intrinsic size: sets the aspect ratio (default 400×300). */
  width?: number
  height?: number
  /** Fill the parent box (parent sets the size) instead of using the aspect ratio. */
  fill?: boolean
  /** Corner radius classes (default rounded-tile). Pass '' for none. */
  rounded?: string
  className?: string
}

const ICON: Readonly<Record<Category, LucideIcon>> = {
  Kopi: Coffee,
  Kantin: UtensilsCrossed,
  Minuman: CupSoda,
  Snack: Cookie,
}

/** Category tile in place of a photo (there are no real photos of the tenants yet). */
export function PlaceImage({ category, alt, width = 400, height = 300, fill = false, rounded = 'rounded-tile', className }: PlaceImageProps) {
  const Icon = ICON[category]
  return (
    <span
      role="img"
      aria-label={alt}
      className={cx('flex items-center justify-center bg-primary-light', fill ? 'h-full w-full' : 'w-full', rounded, className)}
      style={fill ? undefined : { aspectRatio: `${width} / ${height}` }}
    >
      <Icon size={fill && width < 100 ? 24 : 30} strokeWidth={1.8} className="text-primary/60" aria-hidden />
    </span>
  )
}
