import { useState } from 'react'
import { Coffee } from 'lucide-react'
import { cx } from '../lib/cx'

interface PlaceImageProps {
  src: string
  alt: string
  /** Intrinsic size: sets the width/height attributes and the aspect ratio (default 400×300). */
  width?: number
  height?: number
  /** Load eagerly with high priority (hero images only). */
  eager?: boolean
  /** Fill the parent box (parent sets the size) instead of using the aspect ratio. */
  fill?: boolean
  /** Corner radius classes (default rounded-tile). Pass '' for none. */
  rounded?: string
  className?: string
}

/** object-cover image with a light-green Coffee fallback on error. */
export function PlaceImage({
  src,
  alt,
  width = 400,
  height = 300,
  eager = false,
  fill = false,
  rounded = 'rounded-tile',
  className,
}: PlaceImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  const box = cx('relative block overflow-hidden bg-primary-light', fill ? 'h-full w-full' : 'w-full', rounded, className)
  const style = fill ? undefined : { aspectRatio: `${width} / ${height}` }

  if (failed) {
    return (
      <span role="img" aria-label={alt} className={cx(box, 'flex items-center justify-center')} style={style}>
        <Coffee size={28} strokeWidth={1.8} className="text-primary/55" aria-hidden />
      </span>
    )
  }

  return (
    <span className={box} style={style}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        onError={() => setFailedSrc(src)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </span>
  )
}
