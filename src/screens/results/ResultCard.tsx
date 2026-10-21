import { Card, CrowdBadge, PlaceImage, Tag } from '../../components'
import type { Place } from '../../state/types'
import { formatDistance, formatPriceRange } from '../../lib/format'
import { ROUTES } from '../../routes'
import { opensAt } from '../parts/placeText'

interface ResultCardProps {
  place: Place
}

/** Hasil AI list card: square photo, name, meta, facilities, crowd + wait pills (02-hasil-ai). */
export function ResultCard({ place }: ResultCardProps) {
  const meta = `${place.rating.toFixed(1)} (${place.reviews}) · ${formatDistance(place.distanceM)} · ${formatPriceRange(place.priceMin, place.priceMax)}`
  return (
    <Card to={ROUTES.place(place.id)} padding="none" className="p-2.5">
      <span className="flex gap-3">
        <span className="block size-[92px] shrink-0">
          <PlaceImage src={place.image} alt={`Foto ${place.name}`} width={92} height={92} fill rounded="rounded-[12px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col pt-px">
          <span className="truncate text-[16px] leading-[19px] font-bold text-ink">{place.name}</span>
          <span className="mt-1 truncate text-[12.5px] leading-[15px] text-muted">{meta}</span>
          <span className="mt-1 truncate text-[12.5px] leading-[15px] text-muted">{place.facilities.join(' · ')}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <CrowdBadge level={place.crowd} />
            <Tag tone="gray">{place.isOpen ? `Antre ${place.waitRange}` : `Tutup · buka ${opensAt(place)}`}</Tag>
          </span>
        </span>
      </span>
    </Card>
  )
}

/** Placeholder card shown while the fake AI is "analysing" (same box as ResultCard: no layout shift). */
export function ResultCardSkeleton() {
  return (
    <div aria-hidden className="flex gap-3 rounded-card bg-surface p-2.5 shadow-card">
      <span className="size-[92px] shrink-0 animate-pulse rounded-[12px] bg-soft" />
      <span className="flex flex-1 flex-col gap-2 pt-1">
        <span className="h-4 w-2/5 animate-pulse rounded-full bg-soft" />
        <span className="h-3 w-4/5 animate-pulse rounded-full bg-soft" />
        <span className="h-3 w-3/5 animate-pulse rounded-full bg-soft" />
        <span className="mt-1 flex gap-1.5">
          <span className="h-[25px] w-12 animate-pulse rounded-full bg-primary-light" />
          <span className="h-[25px] w-24 animate-pulse rounded-full bg-soft" />
        </span>
      </span>
    </div>
  )
}
