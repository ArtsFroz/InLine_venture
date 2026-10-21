import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart, Navigation } from 'lucide-react'
import { Button, IconButton, PlaceImage, PromoBanner, Screen, Tag, showToast } from '../components'
import { useAppState, usePlace } from '../state/AppState'
import type { Place } from '../state/types'
import { formatDistance, formatPriceRange } from '../lib/format'
import { cx } from '../lib/cx'
import { ROUTES } from '../routes'
import { QueuePredictionCard } from './detail/QueuePredictionCard'
import { NotFoundScreen } from './parts/ui'
import { useGoBack } from './parts/useGoBack'
import { opensAt } from './parts/placeText'

interface DetailFooterProps {
  place: Place
}

/** Pinned CTA bar: Joki (primary) + route icon, Titip (outline). Disabled while the place is closed. */
function DetailFooter({ place }: DetailFooterProps) {
  const navigate = useNavigate()
  const closed = !place.isOpen
  return (
    <div className="flex flex-col gap-2">
      {closed && (
        <p className="text-center text-[12.5px] leading-[1.35] text-muted">
          {place.name} sedang tutup. Joki &amp; titip bisa dipesan mulai {opensAt(place)}.
        </p>
      )}
      <div className="flex gap-2">
        <Button fullWidth className="flex-1" disabled={closed} onClick={() => navigate(ROUTES.joki(place.id))}>
          Pakai Joki Antre
        </Button>
        <IconButton
          size={48}
          icon={<Navigation size={20} strokeWidth={2} aria-hidden />}
          label={`Rute ke ${place.name}`}
          onClick={() => showToast(`Rute ke ${place.name} dibuka (demo)`)}
        />
      </div>
      <Button variant="outline" size="sm" fullWidth disabled={closed} onClick={() => navigate(ROUTES.titip(place.id))}>
        Titip Beli &amp; Antar ke Kelas
      </Button>
    </div>
  )
}

/** 3 · Detail tempat. */
export function PlaceDetailScreen() {
  const { id } = useParams()
  const place = usePlace(id)
  const { state, actions } = useAppState()
  const goBack = useGoBack()

  if (!place) {
    return <NotFoundScreen title="Tempat tidak ditemukan" message="Tempat ini tidak ada di data demo. Coba cari lagi dari Home." />
  }

  const saved = state.savedPlaceIds.includes(place.id)
  const toggleSaved = () => {
    actions.toggleSaved(place.id)
    showToast(saved ? 'Dihapus dari Disimpan' : 'Disimpan')
  }

  const meta = `${place.rating.toFixed(1)} (${place.reviews} ulasan) · ${place.type} · ${formatDistance(place.distanceM)} · ${formatPriceRange(place.priceMin, place.priceMax)}`

  return (
    <Screen bleed footer={<DetailFooter place={place} />} footerStyle="bar">
      <div className="relative h-[200px] w-full">
        <PlaceImage src={place.image} alt={`Foto ${place.name}`} width={390} height={200} eager fill rounded="" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <IconButton icon={<ChevronLeft size={22} strokeWidth={2.2} aria-hidden />} label="Kembali" onClick={goBack} />
          <IconButton
            icon={
              <Heart
                size={20}
                strokeWidth={2.2}
                aria-hidden
                className={cx('transition-colors', saved && 'fill-danger text-danger')}
              />
            }
            label={saved ? 'Hapus dari Disimpan' : 'Simpan tempat'}
            aria-pressed={saved}
            onClick={toggleSaved}
          />
        </div>
      </div>

      <div className="px-5 pt-[18px]">
        <h1 className="text-[24px] leading-[28px] font-extrabold tracking-[-0.015em] text-ink">{place.name}</h1>
        <p className="mt-2.5 text-[13.5px] leading-4 text-muted">{meta}</p>
        {place.isOpen ? (
          <p className="mt-2.5 text-[13.5px] leading-4 font-bold text-primary">Buka sekarang · {place.openHours}</p>
        ) : (
          <p className="mt-2.5 text-[13.5px] leading-4 font-semibold text-muted">Tutup · buka {opensAt(place)}</p>
        )}
        <ul aria-label="Fasilitas" className="mt-2.5 flex flex-wrap gap-1.5">
          {place.tags.map((tag) => (
            <li key={tag}>
              <Tag tone="outline" size="md">
                {tag}
              </Tag>
            </li>
          ))}
        </ul>
        {place.promo && <PromoBanner text={place.promo} className="mt-2.5" />}
        <div className="mt-2.5">
          <QueuePredictionCard place={place} />
        </div>
      </div>
    </Screen>
  )
}
