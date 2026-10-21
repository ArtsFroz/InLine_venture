import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Chip, IconButton, Logo, Screen, SectionTitle, showToast } from '../components'
import { PLACES, RECOMMENDED_PLACE_IDS, getPlace } from '../data/places'
import { FILTER_KEYS, FILTER_LABELS, buildResultsSearch, type FilterKey } from '../lib/aiSearch'
import type { Category, Place } from '../state/types'
import { ROUTES } from '../routes'
import { AiSearchCard } from './home/AiSearchCard'
import { CategoryTiles } from './home/CategoryTiles'
import { PlaceMiniCard } from './parts/PlaceMiniCard'

const MAX_RECOMMENDED = 6

/** Figma picks first (Kopi Tepi, Kopi Kaca), then other open, quiet places with the shortest wait. */
function recommendedPlaces(): Place[] {
  const picked = RECOMMENDED_PLACE_IDS.map(getPlace).filter((p): p is Place => p !== undefined)
  const extra = PLACES.filter((p) => p.isOpen && p.crowd === 'Rendah' && !RECOMMENDED_PLACE_IDS.includes(p.id))
    .slice()
    .sort((a, b) => a.waitMin - b.waitMin)
  return [...picked, ...extra].slice(0, MAX_RECOMMENDED)
}

const RECOMMENDED = recommendedPlaces()

export function HomeScreen() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterKey[]>([])

  const toggleFilter = (key: FilterKey) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const search = (q: string) => navigate(`${ROUTES.results}${buildResultsSearch({ q, filters })}`)

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

      <AiSearchCard onSubmit={search} />

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
          {RECOMMENDED.map((place) => (
            <li key={place.id} className="flex">
              <PlaceMiniCard place={place} />
            </li>
          ))}
        </ul>
      </section>
    </Screen>
  )
}
