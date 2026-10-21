import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, Heart, Home, Map, User, type LucideIcon } from 'lucide-react'
import { ROUTES } from '../routes'
import { cx } from '../lib/cx'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const ITEMS: readonly NavItem[] = [
  { to: ROUTES.home, label: 'Home', icon: Home },
  { to: ROUTES.results, label: 'Radar', icon: Map },
  { to: ROUTES.queue, label: 'Antrean', icon: ClipboardList },
  { to: ROUTES.saved, label: 'Disimpan', icon: Heart },
  { to: ROUTES.profile, label: 'Profil', icon: User },
]

function isActive(pathname: string, to: string): boolean {
  if (to === ROUTES.home) return pathname === ROUTES.home
  return pathname === to || pathname.startsWith(`${to}/`)
}

/** 5-tab bottom bar (76px + bottom safe area). Rendered by <Screen nav />. */
export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Navigasi utama"
      className="relative z-20 shrink-0 border-t border-line/80 bg-surface shadow-nav"
    >
      <ul className="flex items-stretch justify-around px-2 pt-2 pb-[max(11px,env(safe-area-inset-bottom))]">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = isActive(pathname, to)
          return (
            <li key={to} className="flex flex-1 justify-center">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'group flex h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5',
                  'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  active ? 'text-primary' : 'text-muted hover:text-ink',
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                  className="transition-transform duration-150 ease-out group-active:scale-90"
                />
                <span className={cx('text-[12px] leading-[15px]', active ? 'font-bold' : 'font-medium')}>
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
