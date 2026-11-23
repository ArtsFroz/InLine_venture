import { useState } from 'react'
import { InfoNote, showToast } from '../../components'
import { authErrorMessage, useAuth } from '../../state/Auth'

const LINK_CLASS =
  'font-bold text-primary-dark underline underline-offset-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none'

/** "Verifikasi emailmu" note with resend and "Sudah" (reload) actions. Renders nothing once verified. */
export function EmailVerifyNote({ className }: { className?: string }) {
  const { user, sendVerificationEmail, refreshUser } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!user || user.emailVerified) return null

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true)
    try {
      await action()
      showToast(done)
    } catch (error) {
      showToast(authErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const check = () =>
    run(async () => {
      await refreshUser()
    }, 'Status email diperbarui')

  return (
    <InfoNote tone="amber" className={className}>
      <span>
        Verifikasi emailmu dulu: buka link yang kami kirim ke <b>{user.email}</b> (cek juga folder spam).{' '}
        <button type="button" disabled={busy} className={LINK_CLASS} onClick={() => void check()}>
          Sudah verifikasi
        </button>{' '}
        ·{' '}
        <button
          type="button"
          disabled={busy}
          className={LINK_CLASS}
          onClick={() => void run(sendVerificationEmail, 'Link verifikasi dikirim ulang')}
        >
          Kirim ulang
        </button>
      </span>
    </InfoNote>
  )
}
