import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button, Card, InfoNote, Tag, showToast } from '../../components'
import { firestoreErrorMessage } from '../../lib/buddyApplication'
import { cx } from '../../lib/cx'
import { formatDistance, formatRupiah } from '../../lib/format'
import { reviewSuggestion, similarPlaces, suggestionToPlace, watchPendingSuggestions, type PlaceSuggestion } from '../../lib/placeSuggestions'
import { useAuth } from '../../state/Auth'
import { usePlaces } from '../../state/AppState'
import { areaLabel } from '../parts/placeText'
import { INPUT_CLASS } from '../parts/ui'

const CHECKLIST = [
  'Tempatnya benar-benar ada dan menjual makanan atau minuman',
  'Belum ada di InLine (cek nama yang mirip)',
  'Nama, menu, dan harga wajar, tanpa kata kasar atau iklan',
] as const

/** Admin: pending "Usulkan tempat" submissions, oldest first. */
export function SuggestionReviewList() {
  const [list, setList] = useState<PlaceSuggestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      watchPendingSuggestions(
        (next) => {
          setList(next)
          setError(null)
        },
        (err) => setError(firestoreErrorMessage(err)),
      ),
    [],
  )

  if (error) return <InfoNote tone="amber">{error}</InfoNote>
  if (!list) return <p role="status" className="text-[13px] text-muted">Memuat…</p>
  if (list.length === 0) return <InfoNote>Tidak ada usulan tempat yang menunggu review.</InfoNote>
  return (
    <ul className="flex flex-col gap-3.5">
      {list.map((suggestion) => (
        <li key={suggestion.id}>
          <SuggestionCard suggestion={suggestion} />
        </li>
      ))}
    </ul>
  )
}

function SuggestionCard({ suggestion }: { suggestion: PlaceSuggestion }) {
  const { user } = useAuth()
  const places = usePlaces()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const place = suggestionToPlace(suggestion)
  const similar = similarPlaces(suggestion.name, places).filter((p) => p.id !== place.id)
  // "Kampus Syahdan" and "Sekitar Anggrek" already name the campus; the Anggrek canteen areas do not.
  const where = place.area === 'Kampus' || place.area === 'Sekitar kampus' ? areaLabel(place) : `${areaLabel(place)}, Anggrek`
  const submitted = suggestion.submittedAt?.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!user) return
    if (decision === 'rejected' && !note.trim()) {
      showToast('Tulis alasan penolakan dulu')
      return
    }
    const question = decision === 'approved' ? `Tampilkan "${suggestion.name}" untuk semua pengguna?` : `Tolak usulan "${suggestion.name}"?`
    if (!window.confirm(question)) return
    setBusy(true)
    try {
      await reviewSuggestion(suggestion.id, decision, note, user.uid)
      showToast(decision === 'approved' ? 'Tempat ditambahkan' : 'Usulan ditolak')
    } catch (err) {
      showToast(firestoreErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-extrabold text-ink">{suggestion.name}</p>
          <p className="text-[12.5px] text-muted">{submitted ?? 'baru saja'}</p>
        </div>
        <Tag tone="gray">{place.type}</Tag>
      </div>

      <p className="mt-2 text-[13px] leading-snug text-ink">
        {where} · {formatDistance(suggestion.distanceM)} · jam {suggestion.openHours}
      </p>
      {suggestion.locationNote && <p className="mt-1 text-[13px] leading-snug text-ink">Patokan: {suggestion.locationNote}</p>}
      <ul className="mt-2 text-[13px] text-ink">
        {suggestion.menu.map((item, index) => (
          <li key={index} className="flex justify-between gap-3">
            <span className="truncate">{item.name}</span>
            <span className="shrink-0 font-semibold">{formatRupiah(item.price)}</span>
          </li>
        ))}
      </ul>
      {similar.length > 0 && (
        <InfoNote tone="amber" className="mt-2.5">
          Mirip dengan: {similar.map((p) => p.name).join(', ')}
        </InfoNote>
      )}

      <ul className="mt-3 list-disc pl-5 text-[12.5px] leading-snug text-muted">
        {CHECKLIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <label htmlFor={`snote-${suggestion.id}`} className="mt-3 block text-[13px] font-bold text-ink">
        Catatan (wajib kalau ditolak)
      </label>
      <input
        id={`snote-${suggestion.id}`}
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        placeholder="mis. Sudah ada sebagai Bakmi Effata"
        className={cx(INPUT_CLASS, 'mt-1.5')}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="danger" size="sm" disabled={busy} icon={<X size={16} aria-hidden />} onClick={() => void decide('rejected')}>
          Tolak
        </Button>
        <Button size="sm" disabled={busy} icon={<Check size={16} aria-hidden />} onClick={() => void decide('approved')}>
          Tampilkan
        </Button>
      </div>
    </Card>
  )
}
