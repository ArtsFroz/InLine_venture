import { useEffect, useState } from 'react'
import { BadgeCheck, Check, X } from 'lucide-react'
import { Button, Card, Header, InfoNote, Screen, Tag, showToast } from '../components'
import {
  firestoreErrorMessage,
  reviewApplication,
  watchPendingApplications,
  type BuddyApplication,
} from '../lib/buddyApplication'
import { useAuth } from '../state/Auth'
import { useIsAdmin } from '../state/useBuddy'
import { INPUT_CLASS, LABEL_CLASS } from './parts/ui'
import { cx } from '../lib/cx'

/** Admin: review buddy applications (approve or reject; the photos are wiped either way). */
export function AdminReviewScreen() {
  const isAdmin = useIsAdmin()
  return (
    <Screen>
      <Header title="Review buddy" subtitle="Cek data, KTM, dan selfie sebelum menyetujui" />
      {isAdmin ? <PendingList /> : <InfoNote tone="amber">Halaman ini hanya untuk admin InLine.</InfoNote>}
    </Screen>
  )
}

function PendingList() {
  const [list, setList] = useState<BuddyApplication[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () =>
      watchPendingApplications(
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
  if (list.length === 0) return <InfoNote>Tidak ada pendaftaran yang menunggu review.</InfoNote>
  return (
    <ul className="flex flex-col gap-3.5">
      {list.map((application) => (
        <li key={application.uid}>
          <ApplicationCard application={application} />
        </li>
      ))}
    </ul>
  )
}

const CHECKLIST = [
  'Nama dan NIM di KTM sama dengan yang diisi',
  'Wajah di selfie sama dengan foto di KTM',
  'KTM terlihat asli (bukan layar/fotokopi)',
] as const

function ApplicationCard({ application }: { application: BuddyApplication }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const submitted = application.submittedAt?.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  const decide = async (decision: 'verified' | 'rejected') => {
    if (!user) return
    if (decision === 'rejected' && !note.trim()) {
      showToast('Tulis alasan penolakan dulu')
      return
    }
    const question =
      decision === 'verified' ? `Setujui ${application.name} sebagai buddy?` : `Tolak pendaftaran ${application.name}?`
    if (!window.confirm(`${question} Foto KTM dan selfie akan dihapus.`)) return
    setBusy(true)
    try {
      await reviewApplication(application.uid, decision, note, user.uid)
      showToast(decision === 'verified' ? 'Buddy disetujui' : 'Pendaftaran ditolak')
    } catch (error) {
      showToast(firestoreErrorMessage(error))
      setBusy(false)
    }
  }

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-extrabold text-ink">{application.name}</p>
          <p className="text-[12.5px] text-muted">{submitted ?? 'baru saja'}</p>
        </div>
        {application.microsoftLinked ? (
          <Tag tone="green" icon={<BadgeCheck size={13} />}>
            Microsoft terhubung
          </Tag>
        ) : (
          <Tag tone="gray">Tanpa akun BINUS</Tag>
        )}
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-ink">
        <Info label="NIM" value={application.nim} />
        <Info label="Kampus" value={application.campus} />
        <Info label="WhatsApp" value={`+${application.whatsapp}`} />
        <Info label="Email akun" value={application.email} />
        {application.binusEmail && (
          <Info label="Email BINUS (diklaim, cocokkan dengan KTM)" value={application.binusEmail} wide />
        )}
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Photo src={application.ktmImage} label="KTM" />
        <Photo src={application.selfieImage} label="Selfie + KTM" />
      </div>

      <ul className="mt-3 list-disc pl-5 text-[12.5px] leading-snug text-muted">
        {CHECKLIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <label htmlFor={`note-${application.uid}`} className="mt-3 block text-[13px] font-bold text-ink">
        Catatan (wajib kalau ditolak)
      </label>
      <input
        id={`note-${application.uid}`}
        value={note}
        maxLength={200}
        onChange={(e) => setNote(e.target.value)}
        placeholder="mis. Foto KTM buram, nama tidak terbaca"
        className={cx(INPUT_CLASS, 'mt-1.5')}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="danger" size="sm" disabled={busy} icon={<X size={16} aria-hidden />} onClick={() => void decide('rejected')}>
          Tolak
        </Button>
        <Button size="sm" disabled={busy} icon={<Check size={16} aria-hidden />} onClick={() => void decide('verified')}>
          Setujui
        </Button>
      </div>
    </Card>
  )
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cx('min-w-0', wide && 'col-span-2')}>
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  )
}

function Photo({ src, label }: { src: string | null; label: string }) {
  return (
    <figure>
      {src ? (
        <img src={src} alt={label} className="h-40 w-full rounded-lg bg-black object-contain" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg bg-soft text-[12px] text-muted">Tidak ada foto</div>
      )}
      <figcaption className="mt-1 text-center text-[12px] text-muted">{label}</figcaption>
    </figure>
  )
}
