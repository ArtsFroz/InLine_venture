import { useId } from 'react'
import { MapPin } from 'lucide-react'
import { Card, Chip } from '../../components'
import { CAMPUS_CHIPS } from '../../data/campus'
import type { Campus } from '../../state/types'
import { INPUT_CLASS } from '../parts/ui'

interface DeliverToCardProps {
  campus: Campus
  spot: string
  onCampusChange: (campus: Campus) => void
  onSpotChange: (spot: string) => void
}

/** "Antar ke": campus chips + location inside the campus (05b). */
export function DeliverToCard({ campus, spot, onCampusChange, onSpotChange }: DeliverToCardProps) {
  const inputId = useId()
  const blank = spot.trim().length === 0
  return (
    <Card as="section" padding="none" className="p-3.5" ariaLabel="Antar ke">
      <h2 className="text-[15px] leading-[18px] font-bold text-ink">Antar ke</h2>
      <div role="group" aria-label="Kampus" className="mt-2.5 flex flex-wrap gap-2">
        {CAMPUS_CHIPS.map((c) => (
          <Chip key={c} label={c} selected={c === campus} onClick={() => onCampusChange(c)} />
        ))}
      </div>
      <label htmlFor={inputId} className="sr-only">
        Lokasi antar di {campus}
      </label>
      <div className="relative mt-2.5">
        <MapPin
          size={18}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id={inputId}
          type="text"
          value={spot}
          onChange={(e) => onSpotChange(e.target.value)}
          placeholder="Contoh: Lobby lt. 1 / ruang kelas 712"
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={blank}
          className={`${INPUT_CLASS} pl-10`}
        />
      </div>
      {blank && <p className="mt-1.5 text-[12px] text-danger-dark">Isi lokasi antar supaya buddy tahu tujuannya.</p>}
    </Card>
  )
}
