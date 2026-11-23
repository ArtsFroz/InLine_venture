import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Heart } from 'lucide-react'
import { Button, IconButton, PlaceImage, PromoBanner, Screen, Tag, showToast } from '../components'
import { useAppState, usePlace } from '../state/AppState'
import type { Place } from '../state/types'
import { formatDistance, formatPriceRange } from '../lib/format'
import { cx } from '../lib/cx'
import { ROUTES } from '../routes'
import { QueuePredictionCard } from './detail/QueuePredictionCard'
import { NotFoundScreen } from './parts/ui'
import { useGoBack } from './parts/useGoBack'
import { areaLabel, opensAt } from './parts/placeText'
import { usePlaceCrowd } from './parts/usePlaceCrowd'
import { useNow } from '../lib/clock'
import { isOpenAt } from '../lib/crowdModel'

const SOURCE_NOTE: Readonly<Record<Place['source'], string>> = {
  tim: 'Menu, harga, dan jam buka masih perkiraan tim InLine.',
  mahasiswa: 'Diusulkan mahasiswa dan disetujui admin InLine. Menu dan harga dari pengusul.',
}

interface DetailFooterProps {
  place: Place
}

/** Pinned CTA bar: Joki (primary), Titip (outline). Disabled while the place is closed. */
function DetailFooter({ place }: DetailFooterProps) {
  const navigate = useNavigate()
  const { closed } = usePlaceCrowd(place)
  return (
    <div className="flex flex-col gap-2">
      {closed && (
        <p className="text-center text-[12.5px] leading-[1.35] text-muted">
          {place.name} sedang tutup. Joki &amp; titip bisa dipesan mulai {opensAt(place)}.
        </p>
      )}
      <Button fullWidth disabled={closed} onClick={() => navigate(ROUTES.joki(place.id))}>
        Pakai Joki Antre
      </Button>
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
  const now = useNow()

  if (!place) {
    return <NotFoundScreen title="Tempat tidak ditemukan" message="Tempat ini tidak ada di InLine. Coba cari lagi dari Home." />
  }

  const saved = state.savedPlaceIds.includes(place.id)
  const toggleSaved = () => {
    actions.toggleSaved(place.id)
    showToast(saved ? 'Dihapus dari Disimpan' : 'Disimpan')
  }

  const meta = `${place.type} · ${areaLabel(place)} · ${formatDistance(place.distanceM)} · ${formatPriceRange(place.priceMin, place.priceMax)}`

  return (
    <Screen bleed footer={<DetailFooter place={place} />} footerStyle="bar">
      <div className="relative h-[200px] w-full">
        <PlaceImage category={place.category} alt={place.category} width={390} height={200} fill rounded="" />
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
        {isOpenAt(place, now.minute) ? (
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
        {place.locationNote && <p className="mt-2.5 text-[13.5px] leading-[1.4] text-ink">Patokan: {place.locationNote}</p>}
        <p className="mt-2.5 text-[12.5px] leading-[1.4] text-muted">{SOURCE_NOTE[place.source]}</p>
        {place.promo && <PromoBanner text={place.promo} className="mt-2.5" />}
        <div className="mt-2.5">
          <QueuePredictionCard place={place} />
        </div>
      </div>
    </Screen>
  )
}
