import { useState, type FormEvent } from 'react'
import { Button, InfoNote, Logo, Screen } from '../components'
import { cx } from '../lib/cx'
import { microsoftLoginEnabled } from '../lib/firebase'
import { authErrorMessage, useAuth } from '../state/Auth'

type Mode = 'masuk' | 'daftar'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 21 21" aria-hidden>
      <path fill="#F25022" d="M0 0h10v10H0z" />
      <path fill="#7FBA00" d="M11 0h10v10H11z" />
      <path fill="#00A4EF" d="M0 11h10v10H0z" />
      <path fill="#FFB900" d="M11 11h10v10H11z" />
    </svg>
  )
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-[12px] border border-line bg-surface px-3.5 text-[15px] text-ink transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
      />
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

/** Masuk / Daftar: Google sign-in or a normal email + password account. */
export function AuthScreen() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('masuk')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const validate = (): string | null => {
    if (mode === 'daftar' && (name.trim().length < 2 || name.trim().length > 50)) return 'Nama 2–50 karakter.'
    if (!EMAIL_RE.test(email.trim())) return 'Format email tidak valid.'
    if (password.length < MIN_PASSWORD) return `Password minimal ${MIN_PASSWORD} karakter.`
    return null
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    void run(() => (mode === 'masuk' ? auth.signInWithEmail(email, password) : auth.signUpWithEmail(name, email, password)))
  }

  const forgot = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Isi email dulu, lalu tekan "Lupa password?".')
      return
    }
    void run(async () => {
      await auth.resetPassword(email)
      setNotice('Link untuk membuat password baru sudah dikirim ke email kamu.')
    })
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  return (
    <Screen>
      <div className="flex flex-col items-center pt-6 text-center">
        <Logo />
        <h1 className="mt-6 text-[22px] leading-tight font-extrabold text-ink">
          {mode === 'masuk' ? 'Masuk ke InLine' : 'Buat akun InLine'}
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">Cek keramaian kantin dan titip makanan tanpa antre.</p>
      </div>

      <div role="tablist" aria-label="Masuk atau daftar" className="mt-6 grid grid-cols-2 rounded-full bg-soft p-1">
        {(['masuk', 'daftar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cx(
              'h-10 rounded-full text-[14px] font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none',
              mode === m ? 'bg-surface text-ink shadow-soft' : 'text-muted',
            )}
          >
            {m === 'masuk' ? 'Masuk' : 'Daftar'}
          </button>
        ))}
      </div>

      {!auth.configured ? (
        <div className="mt-6">
          <InfoNote tone="amber">
            Login belum aktif karena konfigurasi Firebase belum diisi (lihat README). Untuk presentasi, gunakan mode demo.
          </InfoNote>
          <Button fullWidth className="mt-4" onClick={auth.signInDemo}>
            Masuk mode demo
          </Button>
        </div>
      ) : (
        <>
          <Button
            variant="outline"
            fullWidth
            className="mt-6"
            icon={<GoogleMark />}
            disabled={busy}
            onClick={() => void run(auth.signInWithGoogle)}
          >
            {mode === 'masuk' ? 'Masuk dengan Google' : 'Daftar dengan Google'}
          </Button>
          {microsoftLoginEnabled && (
            <Button
              variant="outline"
              fullWidth
              className="mt-2.5"
              icon={<MicrosoftMark />}
              disabled={busy}
              onClick={() => void run(auth.signInWithMicrosoft)}
            >
              {mode === 'masuk' ? 'Masuk dengan Microsoft kampus' : 'Daftar dengan Microsoft kampus'}
            </Button>
          )}
          <p className="mt-2 text-center text-[12px] text-muted">Mau jadi buddy? Daftar dulu, lalu verifikasi NIM di Profil.</p>

          <div className="my-5 flex items-center gap-3 text-[12px] text-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" /> atau dengan email <span className="h-px flex-1 bg-line" />
          </div>

          <form noValidate onSubmit={submit} className="flex flex-col gap-3.5">
            {mode === 'daftar' && (
              <Field id="auth-name" label="Nama" type="text" value={name} onChange={setName} autoComplete="name" />
            )}
            <Field id="auth-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
            <Field
              id="auth-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
              hint={mode === 'daftar' ? `Minimal ${MIN_PASSWORD} karakter.` : undefined}
            />
            {error && (
              <p role="alert" className="text-[13px] font-semibold text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-[13px] font-semibold text-primary">
                {notice}
              </p>
            )}
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Daftar'}
            </Button>
            {mode === 'masuk' && (
              <button
                type="button"
                onClick={forgot}
                disabled={busy}
                className="self-center text-[13px] font-semibold text-primary-dark underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
              >
                Lupa password?
              </button>
            )}
          </form>
        </>
      )}
    </Screen>
  )
}
