import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Button, Card, CrowdBadge, IconButton, Screen, showToast } from '../components'
import { getPlace } from '../data/places'
import { useAppState } from '../state/AppState'
import type { Place } from '../state/types'
import { ROUTES } from '../routes'
import { crowdDetail, ratingDistance } from './parts/placeText'
import { EmptyState } from './parts/ui'

interface SavedCardProps {
  place: Place
  onUnsave: () => void
}

/** Saved place row: the left part opens the detail, the red heart unsaves (09-disimpan). */
function SavedCard({ place, onUnsave }: SavedCardProps) {
  return (
    <Card padding="none" className="flex items-center">
      <Link
        to={ROUTES.place(place.id)}
        className="min-w-0 flex-1 rounded-l-card py-3 pl-3 transition-colors duration-150 hover:bg-black/[0.015] focus-visible:ring-[3px] focus-visible:ring-primary/45 focus-visible:outline-none"
      >
        <span className="block truncate text-[16px] leading-[19px] font-bold text-ink">{place.name}</span>
        <span className="mt-0.5 block text-[12.5px] leading-[15px] text-muted">{ratingDistance(place)}</span>
        <CrowdBadge level={place.crowd} detail={crowdDetail(place)} className="mt-1.5" />
      </Link>
      <IconButton
        tone="ghost"
        icon={<Heart size={20} strokeWidth={2.2} className="text-danger" aria-hidden />}
        label={`Hapus ${place.name} dari Disimpan`}
        onClick={onUnsave}
        className="mr-2 text-danger"
      />
    </Card>
  )
}

/** 9 · Disimpan. */
export function SavedScreen() {
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const places = state.savedPlaceIds.map(getPlace).filter((p): p is Place => p !== undefined)

  const unsave = (place: Place) => {
    actions.toggleSaved(place.id)
    showToast(`${place.name} dihapus dari Disimpan`)
  }

  return (
    <Screen nav>
      <h1 className="text-[24px] leading-[28px] font-extrabold tracking-[-0.015em] text-ink">Disimpan</h1>
      <p className="mt-3.5 text-[13.5px] leading-4 text-muted">Tempat favoritmu di sekitar BINUS</p>

      {places.length === 0 ? (
        <EmptyState
          icon={<Heart size={28} strokeWidth={2} />}
          title="Belum ada tempat disimpan"
          action={
            <Button fullWidth onClick={() => navigate(ROUTES.results)}>
              Buka Radar
            </Button>
          }
        >
          Ketuk ikon hati di halaman tempat untuk menyimpannya di sini.
        </EmptyState>
      ) : (
        <ul className="mt-3.5 flex flex-col gap-3.5">
          {places.map((place) => (
            <li key={place.id} className="animate-screen-in">
              <SavedCard place={place} onUnsave={() => unsave(place)} />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
