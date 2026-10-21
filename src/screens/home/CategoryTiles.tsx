import { Coffee, CupSoda, Hamburger, LayoutGrid, Soup, type LucideIcon } from 'lucide-react'
import type { Category } from '../../state/types'
import { cx } from '../../lib/cx'

interface Tile {
  key: Category | 'Lainnya'
  icon: LucideIcon
  tile: string
}

/** Tile colors follow the Figma category row (peach / blue / pink / lavender / gray). */
const TILES: readonly Tile[] = [
  { key: 'Kopi', icon: Coffee, tile: 'bg-[#fde9dd] text-[#c2551c]' },
  { key: 'Kantin', icon: Soup, tile: 'bg-[#e1ecfb] text-[#2f63c4]' },
  { key: 'Minuman', icon: CupSoda, tile: 'bg-[#fbe3ec] text-[#c0306a]' },
  { key: 'Snack', icon: Hamburger, tile: 'bg-[#ebe5fb] text-[#6b3fc8]' },
  { key: 'Lainnya', icon: LayoutGrid, tile: 'bg-[#e6ebe8] text-ink/80' },
]

interface CategoryTilesProps {
  onSelect: (category: Category | null) => void
}

/** Kopi / Kantin / Minuman / Snack / Lainnya shortcuts (null = all places). */
export function CategoryTiles({ onSelect }: CategoryTilesProps) {
  return (
    <nav aria-label="Kategori" className="flex justify-between">
      {TILES.map(({ key, icon: Icon, tile }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key === 'Lainnya' ? null : key)}
          className="group flex w-14 flex-col items-center gap-1.5 rounded-tile focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={cx(
              'flex size-14 items-center justify-center rounded-tile transition-transform duration-150 ease-out',
              'group-hover:-translate-y-0.5 group-active:scale-[0.94]',
              tile,
            )}
          >
            <Icon size={22} strokeWidth={2} />
          </span>
          <span className="text-[12.5px] leading-[15px] font-medium text-ink">{key}</span>
        </button>
      ))}
    </nav>
  )
}
