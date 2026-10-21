import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, Sparkles } from 'lucide-react'
import { InfoNote, Screen } from '../components'
import {
  SORT_LABELS,
  buildResultsSearch,
  describeParsed,
  resolveResultsSearch,
  searchPlaces,
  type ResultsSearchInput,
} from '../lib/aiSearch'
import { ROUTES } from '../routes'
import { ResultCard, ResultCardSkeleton } from './results/ResultCard'
import { FilterSheet, SortSheet } from './results/ResultsSheets'
import { SearchBar } from './results/SearchBar'
import { useFakeAnalysis } from './results/useFakeAnalysis'

const SKELETON_COUNT = 3

/** 2 · Hasil AI (also the "Radar" tab: no params = every place, sorted Paling sepi). */
export function ResultsScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { q, filters, category, sort, parsed } = useMemo(() => resolveResultsSearch(params), [params])
  const { results, relaxed, dropped } = useMemo(() => searchPlaces(parsed, sort), [parsed, sort])

  const analysisKey = `${q}|${filters.join(',')}|${category ?? ''}`
  const analyzing = useFakeAnalysis(analysisKey, analysisKey !== '||')

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSession, setFilterSession] = useState(0)
  const [sortOpen, setSortOpen] = useState(false)

  const go = (next: ResultsSearchInput, replace: boolean) =>
    navigate(`${ROUTES.results}${buildResultsSearch({ q, filters, category, sort, ...next })}`, { replace })

  const openFilters = () => {
    setFilterSession((n) => n + 1)
    setFilterOpen(true)
  }

  const activeFilterCount = filters.length + (category ? 1 : 0)
  const countLabel = analyzing ? 'Hasil untukmu' : `Hasil untukmu · ${results.length} tempat`

  return (
    <Screen nav>
      <SearchBar
        key={q}
        query={q}
        activeFilterCount={activeFilterCount}
        onSubmit={(nextQ) => go({ q: nextQ }, false)}
        onOpenFilters={openFilters}
      />

      <p
        role="status"
        className="flex min-h-[54px] items-center gap-2 rounded-tile bg-primary-light px-3.5 py-3 text-[13px] leading-[1.35] font-semibold text-primary-dark"
      >
        {analyzing ? (
          <>
            <Sparkles size={16} strokeWidth={2.2} className="shrink-0 animate-pulse text-primary" aria-hidden />
            <span className="animate-pulse">AI sedang menganalisis…</span>
          </>
        ) : (
          <span className="animate-screen-in">
            <span className="font-extrabold">AI memahami:</span> {describeParsed(parsed)}
          </span>
        )}
      </p>

      <div className="mt-3.5 mb-3 flex items-center justify-between gap-2.5">
        <h1 className="min-w-0 text-[16px] leading-[19px] font-bold text-balance text-ink">{countLabel}</h1>
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="relative inline-flex h-[31px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-[12.5px] whitespace-nowrap font-medium text-ink transition-colors duration-150 after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:border-[#c9d3cc] active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <ArrowUpDown size={13} strokeWidth={2.2} className="text-muted" aria-hidden />
          Urut: {SORT_LABELS[sort]}
        </button>
      </div>

      {relaxed && !analyzing && (
        <InfoNote tone="amber" className="mb-3">
          Belum ada tempat yang cocok persis
          {dropped.length > 0 ? ` (tanpa filter ${dropped.join(', ')})` : ''}. Ini alternatif terdekat untukmu.
        </InfoNote>
      )}

      <ul aria-busy={analyzing} className="flex flex-col gap-2.5">
        {analyzing
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <li key={i}>
                <ResultCardSkeleton />
              </li>
            ))
          : results.map((place) => (
              <li key={place.id} className="animate-screen-in">
                <ResultCard place={place} />
              </li>
            ))}
      </ul>

      <p className="mt-3.5 text-[12px] leading-[15px] text-muted">
        Label keramaian dihitung AI dari data antrean real-time &amp; pola historis.
      </p>

      <FilterSheet
        key={filterSession}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        category={category}
        onApply={(nextFilters, nextCategory) => {
          setFilterOpen(false)
          go({ filters: nextFilters, category: nextCategory }, true)
        }}
      />
      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        sort={sort}
        onSelect={(nextSort) => {
          setSortOpen(false)
          go({ sort: nextSort }, true)
        }}
      />
    </Screen>
  )
}
