import { useState } from 'react'
import { Check } from 'lucide-react'
import { BottomSheet, Button, Chip } from '../../components'
import {
  CATEGORIES,
  FILTER_KEYS,
  FILTER_LABELS,
  SORT_KEYS,
  SORT_LABELS,
  type FilterKey,
  type SortKey,
} from '../../lib/aiSearch'
import type { Category } from '../../state/types'
import { cx } from '../../lib/cx'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  filters: readonly FilterKey[]
  category?: Category
  onApply: (filters: FilterKey[], category: Category | undefined) => void
}

/**
 * Filter + category chips with "Terapkan". The draft is initialised from props on mount,
 * so the parent remounts it (key) every time it opens.
 */
export function FilterSheet({ open, onClose, filters, category, onApply }: FilterSheetProps) {
  const [draftFilters, setDraftFilters] = useState<FilterKey[]>([...filters])
  const [draftCategory, setDraftCategory] = useState<Category | undefined>(category)

  const toggle = (key: FilterKey) =>
    setDraftFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  const reset = () => {
    setDraftFilters([])
    setDraftCategory(undefined)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Filter pencarian">
      <h3 className="mt-3 mb-2 text-[13px] font-bold text-muted">Kondisi</h3>
      <div className="flex flex-wrap gap-2">
        {FILTER_KEYS.map((key) => (
          <Chip key={key} label={FILTER_LABELS[key]} selected={draftFilters.includes(key)} onClick={() => toggle(key)} />
        ))}
      </div>
      <h3 className="mt-5 mb-2 text-[13px] font-bold text-muted">Kategori</h3>
      <div className="flex flex-wrap gap-2">
        <Chip label="Semua" selected={!draftCategory} onClick={() => setDraftCategory(undefined)} />
        {CATEGORIES.map((cat) => (
          <Chip key={cat} label={cat} selected={draftCategory === cat} onClick={() => setDraftCategory(cat)} />
        ))}
      </div>
      <div className="mt-6 flex gap-2.5">
        <Button variant="outline" onClick={reset} className="shrink-0">
          Reset
        </Button>
        <Button fullWidth className="flex-1" onClick={() => onApply(draftFilters, draftCategory)}>
          Terapkan
        </Button>
      </div>
    </BottomSheet>
  )
}

interface SortSheetProps {
  open: boolean
  onClose: () => void
  sort: SortKey
  onSelect: (sort: SortKey) => void
}

/** Single-choice sort list ("Urut: Paling sepi"). */
export function SortSheet({ open, onClose, sort, onSelect }: SortSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Urutkan hasil">
      <div role="radiogroup" aria-label="Urutan hasil" className="mt-3 flex flex-col gap-1">
        {SORT_KEYS.map((key) => {
          const selected = key === sort
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(key)}
              className={cx(
                'flex min-h-12 items-center justify-between rounded-tile px-4 text-left text-[15px] transition-colors duration-150',
                'focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none',
                selected ? 'bg-primary-light font-bold text-primary-dark' : 'font-medium text-ink hover:bg-soft',
              )}
            >
              {SORT_LABELS[key]}
              {selected && <Check size={18} strokeWidth={2.6} className="text-primary" aria-hidden />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
