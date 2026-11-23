import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Camera, Clock, IdCard, ShieldCheck, XCircle } from 'lucide-react'
import { Button, Card, Header, InfoNote, Screen, showToast } from '../components'
import {
  compressPhoto,
  firestoreErrorMessage,
  submitApplication,
  validateForm,
  withdrawApplication,
  type ApplicationForm,
  type BuddyApplication,
} from '../lib/buddyApplication'
import { microsoftLoginEnabled } from '../lib/firebase'
import { cx } from '../lib/cx'
import { ROUTES } from '../routes'
import { authErrorMessage, useAuth } from '../state/Auth'
import { CAMPUSES, type Campus } from '../state/types'
import { useBuddyAccess } from '../state/useBuddy'
import { EmailVerifyNote } from './parts/EmailVerifyNote'
import { INPUT_CLASS, LABEL_CLASS } from './parts/ui'

/** Jadi Buddy: apply with NIM + KTM + selfie, then follow the review status. */
export function BuddyApplyScreen() {
  const navigate = useNavigate()
  const access = useBuddyAccess()

  let body: ReactNode
  if (access.kind === 'loading') {
    body = <p role="status" className="mt-6 text-center text-[13px] text-muted">Memuat status verifikasi…</p>
  } else if (access.kind === 'demo') {
    body = (
      <>
        <InfoNote tone="amber">
          Verifikasi buddy membutuhkan Firebase (lihat docs/SETUP-LOGIN.md). Tanpa konfigurasi, Mode Buddy dibuka sebagai demo.
        </InfoNote>
        <Button fullWidth className="mt-4" onClick={() => navigate(ROUTES.buddy)}>
          Buka Mode Buddy (demo)
        </Button>
      </>
    )
  } else if (access.kind === 'application' && access.application.status === 'pending') {
    body = <PendingCard application={access.application} />
  } else if (access.kind === 'application' && access.application.status === 'verified') {
    body = <VerifiedCard onOpen={() => navigate(ROUTES.buddy)} />
  } else {
    const rejected = access.kind === 'application' ? access.application : null
    body = (
      <>
        {access.kind === 'error' && (
          <InfoNote tone="amber" className="mb-3.5">
            {access.message}
          </InfoNote>
        )}
        {rejected && <RejectedNote note={rejected.note} />}
        <ApplyForm previous={rejected} />
      </>
    )
  }

  return (
    <Screen>
      <Header title="Jadi Buddy" subtitle="Verifikasi mahasiswa BINUS sebelum menerima order" />
      {body}
    </Screen>
  )
}

function StatusCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card padding="lg" className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-light text-primary" aria-hidden>
        {icon}
      </span>
      <h2 className="mt-3 text-[18px] font-extrabold text-ink">{title}</h2>
      <div className="mt-1.5 text-[13.5px] leading-snug text-muted">{children}</div>
    </Card>
  )
}

function PendingCard({ application }: { application: BuddyApplication }) {
  const [busy, setBusy] = useState(false)
  const withdraw = async () => {
    if (!window.confirm('Batalkan pendaftaran? Foto KTM dan selfie akan ikut dihapus.')) return
    setBusy(true)
    try {
      await withdrawApplication(application.uid)
      showToast('Pendaftaran dibatalkan')
    } catch (error) {
      showToast(firestoreErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <StatusCard icon={<Clock size={26} />} title="Sedang direview">
        Tim InLine sedang memeriksa NIM, KTM, dan selfie kamu. Biasanya selesai dalam 1×24 jam. Halaman ini otomatis
        berubah begitu ada keputusan.
      </StatusCard>
      <Card padding="md" className="mt-3.5 text-[13px] text-ink">
        <p>
          <span className={LABEL_CLASS}>Nama</span> <br />
          {application.name}
        </p>
        <p className="mt-2">
          <span className={LABEL_CLASS}>NIM · Kampus</span> <br />
          {application.nim} · {application.campus}
        </p>
        <p className="mt-2">
          <span className={LABEL_CLASS}>Akun BINUS</span> <br />
          {application.microsoftLinked ? (application.binusEmail ?? 'Akun Microsoft terhubung') : 'Belum dihubungkan'}
        </p>
      </Card>
      <Button variant="outline" size="sm" fullWidth className="mt-3.5" disabled={busy} onClick={() => void withdraw()}>
        Batalkan pendaftaran
      </Button>
    </>
  )
}

function VerifiedCard({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <StatusCard icon={<BadgeCheck size={28} />} title="Kamu buddy terverifikasi">
        Akunmu sudah diverifikasi tim InLine. Aktifkan Mode Buddy saat siap bantu antre &amp; antar.
      </StatusCard>
      <Button fullWidth className="mt-4" onClick={onOpen}>
        Buka Mode Buddy
      </Button>
    </>
  )
}

function RejectedNote({ note }: { note: string | null }) {
  return (
    <div className="mb-3.5 flex gap-2.5 rounded-tile bg-[#fdecec] px-3.5 py-3 text-[13px] leading-snug text-danger-dark">
      <XCircle size={18} className="mt-px shrink-0" aria-hidden />
      <p>
        <b>Pendaftaran sebelumnya ditolak.</b> {note ? `Alasan: ${note}` : 'Periksa data dan foto, lalu ajukan lagi.'}
      </p>
    </div>
  )
}

function Section({ title, children, step }: { title: string; children: ReactNode; step: number }) {
  return (
    <Card as="section" padding="none" className="mt-3.5 p-3.5" ariaLabel={title}>
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[12px] text-white" aria-hidden>
          {step}
        </span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

function BinusAccount() {
  const { user, linkMicrosoft } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!user) return null
  if (user.microsoftLinked) {
    return (
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-primary-dark">
        <BadgeCheck size={18} aria-hidden /> Terhubung{user.binusEmail ? `: ${user.binusEmail}` : ''}
      </p>
    )
  }
  const link = async () => {
    setBusy(true)
    try {
      await linkMicrosoft()
      showToast('Akun Microsoft BINUS terhubung')
    } catch (error) {
      showToast(authErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <p className="text-[13px] leading-snug text-muted">
        Hubungkan akun Microsoft kampus (@binus.ac.id) supaya tim kami tahu kamu mahasiswa aktif. Review jadi lebih cepat.
      </p>
      {microsoftLoginEnabled ? (
        <Button variant="outline" size="sm" fullWidth className="mt-2.5" disabled={busy} onClick={() => void link()}>
          {busy ? 'Menghubungkan…' : 'Hubungkan akun Microsoft BINUS'}
        </Button>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted">Login Microsoft kampus sedang tidak tersedia. Lanjutkan dengan KTM.</p>
      )}
    </>
  )
}

function PhotoField({
  id,
  label,
  hint,
  capture,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  capture: 'user' | 'environment'
  value: string
  onChange: (dataUrl: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange(await compressPhoto(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto tidak bisa dipakai.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <p className="text-[13px] font-bold text-ink">{label}</p>
      <p className="mt-0.5 text-[12px] text-muted">{hint}</p>
      <label
        htmlFor={id}
        className={cx(
          'mt-2 flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors focus-within:ring-[3px] focus-within:ring-primary/30',
          value ? 'border-primary/40 bg-black' : 'border-line bg-soft hover:bg-[#e8eee9]',
        )}
      >
        {value ? (
          <img src={value} alt={`Pratinjau ${label}`} className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[12.5px] font-semibold text-muted">
            <Camera size={22} aria-hidden />
            {busy ? 'Memproses foto…' : 'Ambil atau pilih foto'}
          </span>
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          capture={capture}
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {value && <p className="mt-1 text-[12px] text-primary-dark">Tersimpan. Ketuk foto untuk mengganti.</p>}
      {error && (
        <p role="alert" className="mt-1 text-[12px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function ApplyForm({ previous }: { previous: BuddyApplication | null }) {
  const { user } = useAuth()
  const [form, setForm] = useState<ApplicationForm>(() => ({
    name: previous?.name ?? user?.name ?? '',
    nim: previous?.nim ?? '',
    campus: previous?.campus ?? 'Anggrek',
    whatsapp: previous ? `0${previous.whatsapp.slice(2)}` : '',
    ktmImage: '',
    selfieImage: '',
  }))
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user) return null

  const set = <K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = !user.emailVerified
      ? 'Verifikasi emailmu dulu (lihat catatan di atas).'
      : (validateForm(form) ?? (consent ? null : 'Centang persetujuan penggunaan data.'))
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await submitApplication(
        { uid: user.uid, email: user.email, binusEmail: user.binusEmail, microsoftLinked: user.microsoftLinked },
        form,
      )
      showToast('Pendaftaran terkirim')
    } catch (err) {
      setError(firestoreErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={(e) => void submit(e)}>
      <InfoNote>
        Buddy memegang uang dan makanan mahasiswa lain, jadi setiap buddy dicek manual oleh tim InLine: data diri, KTM, dan
        selfie sambil memegang KTM.
      </InfoNote>
      <EmailVerifyNote className="mt-3.5" />

      <Section step={1} title="Akun BINUS (disarankan)">
        <BinusAccount />
      </Section>

      <Section step={2} title="Data mahasiswa">
        <div className="flex flex-col gap-3">
          <TextField id="b-name" label="Nama lengkap (sesuai KTM)" value={form.name} onChange={(v) => set('name', v)} autoComplete="name" />
          <TextField
            id="b-nim"
            label="NIM"
            value={form.nim}
            onChange={(v) => set('nim', v.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            hint="10 digit, seperti di KTM."
          />
          <div>
            <label htmlFor="b-campus" className="block text-[13px] font-bold text-ink">
              Kampus utama
            </label>
            <select
              id="b-campus"
              value={form.campus}
              onChange={(e) => set('campus', e.target.value as Campus)}
              className={cx(INPUT_CLASS, 'mt-1.5')}
            >
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="b-wa"
            label="Nomor WhatsApp"
            value={form.whatsapp}
            onChange={(v) => set('whatsapp', v)}
            inputMode="tel"
            autoComplete="tel"
            hint="Untuk dihubungi pemesan dan tim InLine."
          />
        </div>
      </Section>

      <Section step={3} title="Foto verifikasi">
        <div className="flex flex-col gap-4">
          <PhotoField
            id="b-ktm"
            label="Foto KTM"
            hint="Bagian depan, nama dan NIM terbaca jelas."
            capture="environment"
            value={form.ktmImage}
            onChange={(v) => set('ktmImage', v)}
          />
          <PhotoField
            id="b-selfie"
            label="Selfie sambil memegang KTM"
            hint="Wajah dan KTM terlihat dalam satu foto."
            capture="user"
            value={form.selfieImage}
            onChange={(v) => set('selfieImage', v)}
          />
        </div>
      </Section>

      <label className="mt-3.5 flex items-start gap-2.5 text-[12.5px] leading-snug text-ink">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-[#16803c]"
        />
        <span>
          Saya setuju data diri, foto KTM, dan selfie saya dipakai <b>hanya</b> untuk verifikasi buddy InLine. Foto dihapus
          otomatis setelah direview (UU No. 27/2022 tentang Pelindungan Data Pribadi).
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth className="mt-4" disabled={busy} icon={<ShieldCheck size={18} aria-hidden />}>
        {busy ? 'Mengirim…' : previous ? 'Ajukan ulang' : 'Kirim untuk verifikasi'}
      </Button>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-muted">
        <IdCard size={14} aria-hidden /> NIM dicek formatnya; keaslian dicek tim dari KTM dan selfie.
      </p>
    </form>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  inputMode,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  inputMode?: 'numeric' | 'tel'
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cx(INPUT_CLASS, 'mt-1.5')}
      />
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}
