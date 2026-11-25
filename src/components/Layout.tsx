import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { MAIN_APP_URL } from '../lib/mainApp'
import { ROLE_AR, toggleTheme } from '../lib/roles'
import icon from '../assets/icon-192.png'
import { Icon, type IconName } from './Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'الرئيسية', icon: 'home', end: true },
  { to: '/recipes', label: 'التركيبات', icon: 'flask', end: false },
  { to: '/samples', label: 'العينات', icon: 'vase', end: false },
  { to: '/assistant', label: 'المساعد', icon: 'sparkles', end: false },
]

const ACCESS_ITEM: NavItem = { to: '/access', label: 'الصلاحيات', icon: 'key', end: false }

export default function Layout() {
  const { me, isAdmin, canWrite, signOut } = useAuth()
  const items = isAdmin ? [...NAV_ITEMS, ACCESS_ITEM] : NAV_ITEMS

  return (
    <div className="min-h-[100dvh]">
      <header className="topbar sticky top-0 z-20 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <img src={icon} alt="MAS" className="h-9 w-9 rounded-lg" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-extrabold">
              مختبر <span className="text-gold-light">الماس</span>
            </div>
            <div className="truncate text-[11px] text-white/70">
              {me?.name ? `${me.name} · ` : ''}
              {ROLE_AR[me?.role ?? ''] ?? ''}
              {!canWrite ? ' · عرض فقط' : ''}
            </div>
          </div>
          <span className="flex-1" />
          <a
            href={MAIN_APP_URL}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
          >
            <Icon name="factory" size={14} />
            <span className="hidden sm:inline">برنامج المصنع</span>
            <span className="sm:hidden">المصنع</span>
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="تبديل الوضع الليلي"
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25"
          >
            <Icon name="contrast" size={16} />
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="خروج"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25"
          >
            <Icon name="logout" size={14} />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface">
        <div className={`mx-auto grid max-w-3xl ${items.length > 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${
                  isActive ? 'text-brand-700' : 'text-mute'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 h-[3px] w-8 rounded-b bg-gold" aria-hidden="true" />
                  )}
                  <span
                    className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${
                      isActive ? 'bg-brand-50' : ''
                    }`}
                  >
                    <Icon name={item.icon} size={21} strokeWidth={isActive ? 2.1 : 1.8} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
