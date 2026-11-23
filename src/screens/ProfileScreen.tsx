import { useNavigate } from 'react-router-dom'
import { BadgeCheck, ChevronRight, LogOut, ShieldCheck } from 'lucide-react'
import { Avatar, Button, Card, Screen, Tag, showToast } from '../components'
import { useAuth, type AuthUser } from '../state/Auth'
import { useAppState } from '../state/AppState'
import { canUseBuddyMode, useBuddyAccess, useIsAdmin, type BuddyAccess } from '../state/useBuddy'
import { ROUTES } from '../routes'
import { EmailVerifyNote } from './parts/EmailVerifyNote'
import { BRAND_GRADIENT_CLASS } from './parts/ui'

const MENU_ROWS: readonly string[] = [
  'Riwayat pesanan',
  'Metode pembayaran',
  'Lokasi antar favorit',
  'Pusat bantuan',
  'Syarat & ketentuan',
]

const PROVIDER_LABEL: Record<AuthUser['provider'], string> = {
  google: 'Akun Google',
  microsoft: 'Akun Microsoft',
  password: 'Akun email',
  demo: 'Mode demo',
}

/** Text and button of the Jadi Buddy card for each verification state. */
function buddyCardCopy(access: BuddyAccess, online: boolean): { text: string; action: string } {
  if (canUseBuddyMode(access)) {
    return {
      text: 'Kamu buddy terverifikasi. Aktifkan saat siap bantu antre & antar di sela kuliah.',
      action: online ? 'Buka Mode Buddy' : 'Aktifkan Mode Buddy',
    }
  }
  if (access.kind === 'application' && access.application.status === 'pending') {
    return { text: 'Pendaftaranmu sedang direview tim InLine (biasanya 1×24 jam).', action: 'Lihat status' }
  }
  if (access.kind === 'application' && access.application.status === 'rejected') {
    return { text: 'Pendaftaran sebelumnya ditolak. Periksa alasannya dan ajukan lagi.', action: 'Lihat & ajukan ulang' }
  }
  return {
    text: 'Dapat penghasilan tambahan dengan bantu antre & antar. Verifikasi NIM, KTM, dan selfie dulu.',
    action: 'Daftar jadi buddy',
  }
}

/** 10 · Profil. */
export function ProfileScreen() {
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const { user, signOut } = useAuth()
  const access = useBuddyAccess()
  const isAdmin = useIsAdmin()
  const name = user?.name ?? 'Pengguna'
  const online = state.buddy.online
  const verifiedBuddy = canUseBuddyMode(access) && access.kind !== 'demo'
  const copy = buddyCardCopy(access, online)

  const openBuddy = () => {
    if (!canUseBuddyMode(access)) {
      navigate(ROUTES.buddyApply)
      return
    }
    if (!online) actions.setBuddyOnline(true)
    navigate(ROUTES.buddy)
  }

  return (
    <Screen nav>
      <section aria-label="Akun" className="flex items-center gap-3.5">
        <Avatar name={name} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-[19px] leading-[23px] font-extrabold tracking-[-0.01em] text-ink">{name}</h1>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag tone="green" size="md">
              {user ? PROVIDER_LABEL[user.provider] : 'Akun'}
            </Tag>
            {user?.binusEmail && (
              <Tag tone="outline" size="md" icon={<BadgeCheck size={13} />}>
                Mahasiswa BINUS
              </Tag>
            )}
            {verifiedBuddy && (
              <Tag tone="dark" size="md" icon={<ShieldCheck size={13} />}>
                Buddy terverifikasi
              </Tag>
            )}
          </div>
          <p className="mt-1 truncate text-[12px] leading-[15px] text-muted">{user?.email}</p>
        </div>
      </section>

      <EmailVerifyNote className="mt-3.5" />

      <section
        aria-labelledby="jadi-buddy"
        className={`relative isolate mt-3.5 overflow-hidden rounded-card ${BRAND_GRADIENT_CLASS} p-[18px] text-white shadow-[0_16px_32px_rgba(15,94,44,0.24)]`}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-12 -z-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.16),transparent_70%)]"
        />
        <h2 id="jadi-buddy" className="text-[18px] leading-[21px] font-extrabold">
          Jadi Buddy
        </h2>
        <p className="mt-2 text-[12.5px] leading-[15px] text-white/80">{copy.text}</p>
        <Button
          variant="accent"
          size="sm"
          fullWidth
          className="mt-2"
          disabled={access.kind === 'loading'}
          onClick={openBuddy}
        >
          {access.kind === 'loading' ? 'Memuat…' : copy.action}
        </Button>
      </section>

      <Card as="section" padding="none" className="mt-3.5 px-2 py-1" ariaLabel="Pengaturan akun">
        <ul>
          <li>
            <MenuRow label="Usulkan tempat makan" onClick={() => navigate(ROUTES.suggest)} />
          </li>
          {isAdmin && (
            <li>
              <MenuRow label="Review buddy & usulan tempat (admin)" onClick={() => navigate(ROUTES.admin)} />
            </li>
          )}
          {MENU_ROWS.map((label) => (
            <li key={label}>
              <MenuRow label={label} onClick={() => showToast('Segera hadir')} />
            </li>
          ))}
        </ul>
      </Card>

      <Button
        variant="danger"
        size="sm"
        fullWidth
        className="mt-3.5"
        icon={<LogOut size={17} aria-hidden />}
        onClick={() => {
          actions.setBuddyOnline(false)
          signOut()
            .then(() => showToast('Kamu sudah keluar'))
            .catch(() => showToast('Gagal keluar, coba lagi'))
        }}
      >
        Keluar
      </Button>
    </Screen>
  )
}

function MenuRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl px-1.5 text-left text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-soft active:bg-[#e2e7e3] focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      {label}
      <ChevronRight size={18} strokeWidth={2.2} className="shrink-0 text-muted" aria-hidden />
    </button>
  )
}
