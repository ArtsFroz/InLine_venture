import { cx } from '../../lib/cx'

interface ModeOptionProps {
  title: string
  description: string
  selected: boolean
  onClick: () => void
}

/** Service mode card on 5 · Joki Antre ("Joki Antre" / "Antar ke Kampus"). */
export function ModeOption({ title, description, selected, onClick }: ModeOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        'flex flex-col self-start rounded-tile p-4 text-left transition-[transform,background-color,border-color] duration-150 ease-out',
        'focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none',
        selected
          ? 'border-[1.5px] border-primary bg-primary-light'
          : 'border border-line bg-surface hover:border-[#c9d3cc] active:scale-[0.98]',
      )}
    >
      <span className={cx('text-[15px] leading-[18px] font-bold', selected ? 'text-primary-dark' : 'text-ink')}>
        {title}
      </span>
      <span className={cx('mt-1.5 text-[12.5px] leading-[15px]', selected ? 'text-primary-dark/85' : 'text-muted')}>
        {description}
      </span>
    </button>
  )
}
