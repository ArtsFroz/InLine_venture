import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Avatar, Button, Card, Screen, Tag, showToast } from '../components'
import { DEMO_USER } from '../data/user'
import { useAppState } from '../state/AppState'
import { ROUTES } from '../routes'
import { BRAND_GRADIENT_CLASS } from './parts/ui'

const MENU_ROWS: readonly string[] = [
  'Riwayat pesanan',
  'Metode pembayaran',
  'Lokasi antar favorit',
  'Pusat bantuan',
  'Syarat & ketentuan',
]

/** 10 · Profil. */
export function ProfileScreen() {
  const navigate = useNavigate()
  const { state, actions } = useAppState()
  const online = state.buddy.online

  const openBuddyMode = () => {
    if (!online) actions.setBuddyOnline(true)
    navigate(ROUTES.buddy)
  }

  return (
    <Screen nav>
      <section aria-label="Akun" className="flex items-center gap-3.5">
        <Avatar name={DEMO_USER.fullName} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-[19px] leading-[23px] font-extrabold tracking-[-0.01em] text-ink">{DEMO_USER.name}</h1>
          <Tag tone="green" size="md" className="mt-1">
            NIM terverifikasi
          </Tag>
          <p className="mt-1 truncate text-[12px] leading-[15px] text-muted">
            NIM {DEMO_USER.nimMasked} · {DEMO_USER.major}
          </p>
        </div>
      </section>

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
        <p className="mt-2 text-[12.5px] leading-[15px] text-white/80">
          Dapat penghasilan tambahan dengan bantu antre &amp; antar di sela jadwal kuliah.
        </p>
        <Button variant="accent" size="sm" fullWidth className="mt-2" onClick={openBuddyMode}>
          {online ? 'Buka Mode Buddy' : 'Aktifkan Mode Buddy'}
        </Button>
      </section>

      <Card as="section" padding="none" className="mt-3.5 px-2 py-1" ariaLabel="Pengaturan akun">
        <ul>
          {MENU_ROWS.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => showToast('Tidak termasuk dalam demo')}
                className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl px-1.5 text-left text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-soft active:bg-[#e2e7e3] focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:outline-none"
              >
                {label}
                <ChevronRight size={18} strokeWidth={2.2} className="shrink-0 text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </Screen>
  )
}
