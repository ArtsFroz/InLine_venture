import { useState, type FormEvent } from 'react'
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react'
import { IconButton } from '../../components'
import { useGoBack } from '../parts/useGoBack'

interface SearchBarProps {
  /** Current query from the URL (the parent remounts this bar with key={query} when it changes). */
  query: string
  activeFilterCount: number
  onSubmit: (query: string) => void
  onOpenFilters: () => void
}

/** Back button + editable search pill + filter button (02-hasil-ai header). */
export function SearchBar({ query, activeFilterCount, onSubmit, onOpenFilters }: SearchBarProps) {
  const goBack = useGoBack()
  const [draft, setDraft] = useState(query)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = e.currentTarget.querySelector('input')
    input?.blur()
    onSubmit(draft.trim())
  }

  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <IconButton icon={<ChevronLeft size={22} strokeWidth={2.2} aria-hidden />} label="Kembali" onClick={goBack} />
      <form role="search" onSubmit={handleSubmit} className="relative min-w-0 flex-1">
        <label htmlFor="results-query" className="sr-only">
          Cari tempat dengan AI
        </label>
        <input
          id="results-query"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Cari tempat, menu, atau suasana…"
          enterKeyHint="search"
          autoComplete="off"
          className="h-11 w-full rounded-full border border-line bg-surface pr-10 pl-4 text-[16px] text-ink shadow-soft placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 hover:border-[#c9d3cc] focus:border-primary focus:ring-[3px] focus:ring-primary/15 focus:outline-none sm:text-[14px] [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label="Cari"
          className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
        >
          <Search size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </form>
      <span className="relative shrink-0">
        <IconButton
          icon={<SlidersHorizontal size={20} strokeWidth={2} aria-hidden />}
          label={activeFilterCount > 0 ? `Filter (${activeFilterCount} aktif)` : 'Filter'}
          onClick={onOpenFilters}
        />
        {activeFilterCount > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10.5px] font-bold text-white ring-2 ring-bg"
          >
            {activeFilterCount}
          </span>
        )}
      </span>
    </div>
  )
}
