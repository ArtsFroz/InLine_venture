import { Link } from 'react-router-dom'
import { CrowdBadge, PlaceImage } from '../../components'
import type { Place } from '../../state/types'
import { ROUTES } from '../../routes'
import { areaDistance, crowdDetail } from './placeText'
import { usePlaceCrowd } from './usePlaceCrowd'

interface PlaceMiniCardProps {
  place: Place
}

/** 160px photo card for the Home "Rekomendasi untukmu" carousel. */
export function PlaceMiniCard({ place }: PlaceMiniCardProps) {
  const crowd = usePlaceCrowd(place)
  return (
    <Link
      to={ROUTES.place(place.id)}
      className="block w-40 shrink-0 snap-start overflow-hidden rounded-card bg-surface shadow-card transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.985] focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
    >
      <PlaceImage category={place.category} alt={place.category} width={160} height={88} rounded="" />
      <div className="p-2.5">
        <p className="truncate text-[15px] leading-[18px] font-bold text-ink">{place.name}</p>
        <p className="mt-1 text-[12px] leading-[15px] text-muted">{areaDistance(place)}</p>
        <CrowdBadge level={crowd.level} detail={crowdDetail(crowd)} className="mt-1.5" />
      </div>
    </Link>
  )
}
