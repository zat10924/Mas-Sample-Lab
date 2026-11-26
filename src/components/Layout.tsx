import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { MAIN_APP_URL } from '../lib/mainApp'
import { ROLE_AR, applyStoredFontSize, toggleTheme } from '../lib/roles'
import icon from '../assets/icon-192.png'
import { Icon, type IconName } from './Icon'
import CommandPalette from './CommandPalette'
import SettingsMenu from './SettingsMenu'
import OfflineStatus from './OfflineStatus'

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
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  // حجم الخط المحفوظ من قائمة الإعدادات
  useEffect(() => {
    applyStoredFontSize()
  }, [])

  // Ctrl+K / Cmd+K لفتح البحث الشامل
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const items = isAdmin ? [...NAV_ITEMS, ACCESS_ITEM] : NAV_ITEMS
  const roleLine = `${ROLE_AR[me?.role ?? ''] ?? ''}${!canWrite ? ' · عرض فقط' : ''}`

  return (
    <div className="min-h-[100dvh]">
      {/* ===== اللاب توب: قائمة جانبية ثابتة ===== */}
      <aside className="sidebar fixed inset-y-0 start-0 z-30 hidden w-64 flex-col text-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src={icon} alt="MAS" className="h-11 w-11 rounded-xl shadow-md" />
          <div className="leading-tight">
            <div className="text-lg font-extrabold">
              مختبر <span className="text-gold-light">الماس</span>
            </div>
            <div className="text-[11px] text-white/60">للخزف والصيني</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mb-3 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white/80 hover:bg-white/20"
        >
          <Icon name="search" size={16} />
          <span className="flex-1 text-start">بحث سريع</span>
          <kbd className="rounded bg-white/15 px-1.5 text-[10px] font-bold">Ctrl K</kbd>
        </button>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-2 start-0 w-1 rounded-e bg-gold" aria-hidden="true" />
                  )}
                  <Icon name={item.icon} size={20} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <div className="px-1 leading-tight">
            <div className="truncate text-sm font-bold">{me?.name || 'مستخدم'}</div>
            <div className="truncate text-[11px] text-white/60">{roleLine}</div>
          </div>
          <a
            href={MAIN_APP_URL}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
          >
            <Icon name="factory" size={16} />
            برنامج المصنع
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
            >
              <Icon name="contrast" size={16} />
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
            >
              <Icon name="logout" size={16} />
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* ===== الموبايل: شريط علوي (الهوية + بحث + إعدادات) ===== */}
      <header className="topbar sticky top-0 z-20 text-white lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <img src={icon} alt="MAS" className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-base font-extrabold">
              مختبر <span className="text-gold-light">الماس</span>
            </div>
            {me?.name && <div className="truncate text-xs text-white/70">{me.name}</div>}
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="بحث سريع"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 transition-colors hover:bg-white/25"
          >
            <Icon name="search" size={19} />
          </button>
          <SettingsMenu />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 lg:ps-64 lg:max-w-none lg:pb-12 lg:pt-0">
        <div className="mx-auto lg:max-w-6xl lg:px-10 lg:py-10">
          <OfflineStatus />
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ===== الموبايل: شريط سفلي ===== */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface lg:hidden">
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
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
