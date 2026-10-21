import { Link } from 'react-router-dom'
import { CrowdBadge, PlaceImage } from '../../components'
import type { Place } from '../../state/types'
import { ROUTES } from '../../routes'
import { crowdDetail, ratingDistance } from './placeText'

interface PlaceMiniCardProps {
  place: Place
}

/** 160px photo card for the Home "Rekomendasi untukmu" carousel. */
export function PlaceMiniCard({ place }: PlaceMiniCardProps) {
  return (
    <Link
      to={ROUTES.place(place.id)}
      className="block w-40 shrink-0 snap-start overflow-hidden rounded-card bg-surface shadow-card transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.985] focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
    >
      <PlaceImage src={place.image} alt={`Foto ${place.name}`} width={160} height={88} rounded="" />
      <div className="p-2.5">
        <p className="truncate text-[15px] leading-[18px] font-bold text-ink">{place.name}</p>
        <p className="mt-1 text-[12px] leading-[15px] text-muted">{ratingDistance(place)}</p>
        <CrowdBadge level={place.crowd} detail={crowdDetail(place)} className="mt-1.5" />
      </div>
    </Link>
  )
}
