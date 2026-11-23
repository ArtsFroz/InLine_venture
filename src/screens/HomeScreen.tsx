import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Chip, IconButton, Logo, Screen, SectionTitle, showToast } from '../components'
import { RECOMMENDED_PLACE_IDS } from '../data/places'
import { usePlaces } from '../state/AppState'
import { FILTER_KEYS, FILTER_LABELS, buildResultsSearch, type FilterKey } from '../lib/aiSearch'
import type { Category, Place } from '../state/types'
import { ROUTES } from '../routes'
import { useNow, type Now } from '../lib/clock'
import { placeCrowd } from '../lib/crowdModel'
import { AiSearchCard } from './home/AiSearchCard'
import { CategoryTiles } from './home/CategoryTiles'
import { PlaceMiniCard } from './parts/PlaceMiniCard'

const MAX_RECOMMENDED = 6

const CHIP_PHRASES: Readonly<Record<FilterKey, string>> = {
  'antre-singkat': 'tidak ramai',
  'buka-sekarang': 'buka sekarang',
  budget: 'budget 25 ribu',
  sepi: 'yang sepi',
  terdekat: 'yang terdekat',
}

/** The team's picks first (BICASA Coffee, Bakmi Effata), then the other open places that are quietest right now. */
function recommendedPlaces(places: readonly Place[], now: Now): Place[] {
  const picked = places.filter((p) => RECOMMENDED_PLACE_IDS.includes(p.id))
  const extra = places.filter((p) => !RECOMMENDED_PLACE_IDS.includes(p.id))
    .map((p) => ({ p, crowd: placeCrowd(p, now.day, now.minute) }))
    .filter(({ crowd }) => !crowd.closed && crowd.level !== 'Tinggi' && crowd.level !== 'Penuh')
    .sort((a, b) => a.crowd.share - b.crowd.share)
    .map(({ p }) => p)
  return [...picked, ...extra].slice(0, MAX_RECOMMENDED)
}

export function HomeScreen() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterKey[]>([])
  const now = useNow()
  const recommended = recommendedPlaces(usePlaces(), now)

  const toggleFilter = (key: FilterKey) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  // Selected quick-filter chips travel with the question as plain words the AI (and the keyword parser) understand.
  const askAi = (q: string) => {
    const message = [q, ...filters.map((key) => CHIP_PHRASES[key])].join(', ')
    navigate(`${ROUTES.chat}?${new URLSearchParams({ q: message })}`)
  }

  const openCategory = (category: Category | null) =>
    navigate(category ? `${ROUTES.results}${buildResultsSearch({ category })}` : ROUTES.results)

  return (
    <Screen nav>
      <header className="mb-3.5 flex items-center justify-between gap-3">
        <Logo />
        <IconButton
          icon={<Bell size={20} strokeWidth={2} aria-hidden />}
          label="Notifikasi"
          onClick={() => showToast('Belum ada notifikasi baru')}
        />
      </header>

      <AiSearchCard onSubmit={askAi} />

      <div role="group" aria-label="Filter cepat" className="mt-3.5 flex flex-wrap gap-2">
        {FILTER_KEYS.map((key) => (
          <Chip
            key={key}
            label={FILTER_LABELS[key]}
            selected={filters.includes(key)}
            onClick={() => toggleFilter(key)}
          />
        ))}
      </div>

      <div className="mt-3.5">
        <CategoryTiles onSelect={openCategory} />
      </div>

      <section aria-label="Rekomendasi untukmu" className="mt-3.5">
        <SectionTitle title="Rekomendasi untukmu" action={{ label: 'Lihat semua', to: ROUTES.results }} />
        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-0.5 pb-3">
          {recommended.map((place) => (
            <li key={place.id} className="flex">
              <PlaceMiniCard place={place} />
            </li>
          ))}
        </ul>
      </section>
    </Screen>
  )
}
