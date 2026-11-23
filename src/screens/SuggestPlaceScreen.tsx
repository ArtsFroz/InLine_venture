import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Card, Chip, Header, InfoNote, Screen, Tag, showToast } from '../components'
import { firestoreErrorMessage } from '../lib/buddyApplication'
import { cx } from '../lib/cx'
import {
  MAX_MENU_ITEMS,
  SLOTS,
  deleteSuggestion,
  freeSlotId,
  similarPlaces,
  submitSuggestion,
  validateSuggestion,
  watchMySuggestions,
  type PlaceSuggestion,
  type SuggestionForm,
} from '../lib/placeSuggestions'
import { COMMUNITY_ID_PREFIX } from '../data/places'
import { ROUTES } from '../routes'
import { useAuth } from '../state/Auth'
import { usePlaces } from '../state/AppState'
import { CAMPUSES, type Area, type Campus, type Category } from '../state/types'
import { EmailVerifyNote } from './parts/EmailVerifyNote'
import { INPUT_CLASS } from './parts/ui'

const CATEGORIES: readonly Category[] = ['Kantin', 'Kopi', 'Minuman', 'Snack']
const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
  Kantin: 'Makan berat',
  Kopi: 'Kopi',
  Minuman: 'Minuman',
  Snack: 'Jajanan',
}

/** Anggrek canteen areas with a rough walking distance from the lobby. */
const ANGGREK_AREAS: readonly { area: Area; label: string; distanceM: number }[] = [
  { area: 'Basement', label: 'FOODPARK Basement', distanceM: 60 },
  { area: 'Outdoor', label: 'Kantin Outdoor', distanceM: 120 },
  { area: 'Lantai 1', label: 'Lantai 1', distanceM: 30 },
  { area: 'Lantai 5', label: 'Lantai 5', distanceM: 90 },
  { area: 'Kampus', label: 'Area lain', distanceM: 100 },
]
const OUTSIDE_DISTANCES: readonly { label: string; distanceM: number }[] = [
  { label: '< 300 m', distanceM: 200 },
  { label: '300–700 m', distanceM: 500 },
  { label: '> 700 m', distanceM: 1000 },
]
const INSIDE_DISTANCE_M = 100

const STATUS: Readonly<Record<PlaceSuggestion['status'], { label: string; tone: 'amber' | 'green' | 'red' }>> = {
  pending: { label: 'Menunggu review', tone: 'amber' },
  approved: { label: 'Sudah tampil', tone: 'green' },
  rejected: { label: 'Ditolak', tone: 'red' },
}

function emptyForm(): SuggestionForm {
  return {
    name: '',
    category: 'Kantin',
    campus: 'Anggrek',
    area: 'Sekitar kampus',
    distanceM: OUTSIDE_DISTANCES[0].distanceM,
    locationNote: '',
    opens: '',
    closes: '',
    menu: Array.from({ length: MAX_MENU_ITEMS }, () => ({ name: '', price: '' })),
  }
}

/** Usulkan tempat: a student adds a missing food or drink place; an admin checks it before it is shown. */
export function SuggestPlaceScreen() {
  const { user } = useAuth()
  const [mine, setMine] = useState<PlaceSuggestion[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return undefined
    return watchMySuggestions(user.uid, setMine, (err) => setLoadError(firestoreErrorMessage(err)))
  }, [user])

  return (
    <Screen>
      <Header title="Usulkan tempat" subtitle="Tempat makan atau minum yang belum ada di InLine" />
      <InfoNote>
        Usulanmu dicek admin InLine dulu, lalu tampil untuk semua mahasiswa dengan label "Usulan mahasiswa". Maksimal {SLOTS}{' '}
        usulan per akun.
      </InfoNote>
      <EmailVerifyNote className="mt-3.5" />
      {loadError && (
        <InfoNote tone="amber" className="mt-3.5">
          {loadError}
        </InfoNote>
      )}
      {user && mine && <SuggestForm uid={user.uid} slotId={freeSlotId(user.uid, mine)} />}
      {mine && mine.length > 0 && <MySuggestions list={mine} />}
    </Screen>
  )
}

function SuggestForm({ uid, slotId }: { uid: string; slotId: string | null }) {
  const places = usePlaces()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const similar = similarPlaces(form.name, places)
  const outside = form.area === 'Sekitar kampus'

  const set = <K extends keyof SuggestionForm>(key: K, value: SuggestionForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setMenu = (index: number, key: 'name' | 'price', value: string) =>
    setForm((f) => ({ ...f, menu: f.menu.map((item, i) => (i === index ? { ...item, [key]: value } : item)) }))
  const setInside = (inside: boolean) =>
    setForm((f) =>
      inside
        ? { ...f, area: f.campus === 'Anggrek' ? 'Basement' : 'Kampus', distanceM: f.campus === 'Anggrek' ? ANGGREK_AREAS[0].distanceM : INSIDE_DISTANCE_M }
        : { ...f, area: 'Sekitar kampus', distanceM: OUTSIDE_DISTANCES[0].distanceM },
    )
  const setCampus = (campus: Campus) =>
    setForm((f) =>
      f.area === 'Sekitar kampus'
        ? { ...f, campus }
        : { ...f, campus, area: campus === 'Anggrek' ? 'Basement' : 'Kampus', distanceM: campus === 'Anggrek' ? ANGGREK_AREAS[0].distanceM : INSIDE_DISTANCE_M },
    )

  if (!slotId) {
    return (
      <InfoNote tone="amber" className="mt-3.5">
        Kamu sudah memakai {SLOTS} slot usulan. Hapus usulan yang ditolak atau masih menunggu untuk mengusulkan tempat lain.
      </InfoNote>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validateSuggestion(form)
    setError(problem)
    if (problem) return
    setBusy(true)
    try {
      await submitSuggestion(slotId, uid, form)
      setForm(emptyForm())
      showToast('Usulan terkirim, tunggu review admin')
    } catch (err) {
      setError(firestoreErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={(e) => void submit(e)}>
      <Section title="Tempatnya">
        <label htmlFor="s-name" className={FIELD_LABEL}>
          Nama tempat
        </label>
        <input
          id="s-name"
          value={form.name}
          maxLength={60}
          onChange={(e) => set('name', e.target.value)}
          placeholder="mis. Warung Bu Sri"
          className={cx(INPUT_CLASS, 'mt-1.5')}
        />
        {similar.length > 0 && (
          <p className="mt-1.5 text-[12.5px] leading-snug text-muted">
            Sudah ada di InLine:{' '}
            {similar.slice(0, 3).map((place, i) => (
              <span key={place.id}>
                {i > 0 && ', '}
                <Link to={ROUTES.place(place.id)} className="font-bold text-primary-dark underline underline-offset-2">
                  {place.name}
                </Link>
              </span>
            ))}
            . Kalau itu tempat yang sama, tidak perlu diusulkan.
          </p>
        )}

        <p className={cx(FIELD_LABEL, 'mt-3.5')}>Jenis</p>
        <ChipRow>
          {CATEGORIES.map((c) => (
            <Chip key={c} size="sm" label={CATEGORY_LABEL[c]} selected={form.category === c} onClick={() => set('category', c)} />
          ))}
        </ChipRow>
      </Section>

      <Section title="Lokasi">
        <label htmlFor="s-campus" className={FIELD_LABEL}>
          Kampus terdekat
        </label>
        <select id="s-campus" value={form.campus} onChange={(e) => setCampus(e.target.value as Campus)} className={cx(INPUT_CLASS, 'mt-1.5')}>
          {CAMPUSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <ChipRow className="mt-3">
          <Chip size="sm" label="Di dalam kampus" selected={!outside} onClick={() => setInside(true)} />
          <Chip size="sm" label="Sekitar kampus" selected={outside} onClick={() => setInside(false)} />
        </ChipRow>

        {!outside && form.campus === 'Anggrek' && (
          <>
            <p className={cx(FIELD_LABEL, 'mt-3')}>Area</p>
            <ChipRow>
              {ANGGREK_AREAS.map((a) => (
                <Chip
                  key={a.area}
                  size="sm"
                  label={a.label}
                  selected={form.area === a.area}
                  onClick={() => setForm((f) => ({ ...f, area: a.area, distanceM: a.distanceM }))}
                />
              ))}
            </ChipRow>
          </>
        )}
        {outside && (
          <>
            <p className={cx(FIELD_LABEL, 'mt-3')}>Jarak jalan kaki dari kampus</p>
            <ChipRow>
              {OUTSIDE_DISTANCES.map((d) => (
                <Chip key={d.distanceM} size="sm" label={d.label} selected={form.distanceM === d.distanceM} onClick={() => set('distanceM', d.distanceM)} />
              ))}
            </ChipRow>
          </>
        )}

        <label htmlFor="s-note" className={cx(FIELD_LABEL, 'mt-3.5 block')}>
          Patokan (opsional)
        </label>
        <input
          id="s-note"
          value={form.locationNote}
          maxLength={120}
          onChange={(e) => set('locationNote', e.target.value)}
          placeholder="mis. Sebelah Indomaret, Jl. Kebon Jeruk"
          className={cx(INPUT_CLASS, 'mt-1.5')}
        />

        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="s-open" className={FIELD_LABEL}>
              Buka
            </label>
            <input id="s-open" type="time" value={form.opens} onChange={(e) => set('opens', e.target.value)} className={cx(INPUT_CLASS, 'mt-1.5')} />
          </div>
          <div>
            <label htmlFor="s-close" className={FIELD_LABEL}>
              Tutup
            </label>
            <input id="s-close" type="time" value={form.closes} onChange={(e) => set('closes', e.target.value)} className={cx(INPUT_CLASS, 'mt-1.5')} />
          </div>
        </div>
      </Section>

      <Section title="Menu dan harga">
        <p className="text-[12.5px] leading-snug text-muted">1–{MAX_MENU_ITEMS} menu yang paling sering dibeli. Harga dalam Rupiah.</p>
        <ul className="mt-2.5 flex flex-col gap-2">
          {form.menu.map((item, i) => (
            <li key={i} className="grid grid-cols-[1fr_7.5rem] gap-2">
              <input
                aria-label={`Menu ${i + 1}`}
                value={item.name}
                maxLength={40}
                onChange={(e) => setMenu(i, 'name', e.target.value)}
                placeholder={i === 0 ? 'mis. Nasi Rames' : `Menu ${i + 1}`}
                className={INPUT_CLASS}
              />
              <input
                aria-label={`Harga menu ${i + 1}`}
                value={item.price}
                inputMode="numeric"
                onChange={(e) => setMenu(i, 'price', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="18000"
                className={INPUT_CLASS}
              />
            </li>
          ))}
        </ul>
      </Section>

      {error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth className="mt-4" disabled={busy} icon={<Plus size={18} aria-hidden />}>
        {busy ? 'Mengirim…' : 'Kirim usulan'}
      </Button>
    </form>
  )
}

function MySuggestions({ list }: { list: PlaceSuggestion[] }) {
  const remove = async (s: PlaceSuggestion) => {
    if (!window.confirm(`Hapus usulan "${s.name}"?`)) return
    try {
      await deleteSuggestion(s.id)
      showToast('Usulan dihapus')
    } catch (err) {
      showToast(firestoreErrorMessage(err))
    }
  }

  return (
    <section aria-labelledby="my-suggestions" className="mt-6">
      <h2 id="my-suggestions" className="text-[16px] font-extrabold text-ink">
        Usulanmu
      </h2>
      <ul className="mt-2.5 flex flex-col gap-2.5">
        {list.map((s) => (
          <li key={s.id}>
            <Card padding="none" className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{s.name}</p>
                <Tag tone={STATUS[s.status].tone} className="mt-1">
                  {STATUS[s.status].label}
                </Tag>
                {s.status === 'rejected' && s.note && <p className="mt-1.5 text-[12.5px] leading-snug text-muted">Alasan: {s.note}</p>}
                {s.status === 'approved' && (
                  <Link to={ROUTES.place(`${COMMUNITY_ID_PREFIX}${s.id}`)} className="mt-1.5 block text-[12.5px] font-bold text-primary-dark underline underline-offset-2">
                    Lihat tempat
                  </Link>
                )}
              </div>
              {s.status !== 'approved' && (
                <Button variant="outline" size="sm" icon={<Trash2 size={15} aria-hidden />} onClick={() => void remove(s)}>
                  Hapus
                </Button>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FIELD_LABEL = 'text-[13px] font-bold text-ink'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="section" padding="none" className="mt-3.5 p-3.5" ariaLabel={title}>
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mt-1.5 flex flex-wrap gap-2', className)}>{children}</div>
}
