import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { MAIN_APP_URL } from '../lib/mainApp'
import { pushRecent } from '../lib/organize'
import { usePref } from '../lib/prefs'
import { ROLE_AR, applyStoredFontSize, toggleTheme } from '../lib/roles'
import icon from '../assets/icon-192.png'
import { Icon, type IconName } from './Icon'
import { MORE_PATHS, NAV_SECTIONS } from './nav'
import Breadcrumbs from './Breadcrumbs'
import CommandPalette from './CommandPalette'
import SettingsMenu from './SettingsMenu'
import OfflineStatus from './OfflineStatus'
import OfflineSync from './OfflineSync'
import NotificationBell from './NotificationBell'
import QuickCreateSheet from './QuickCreateSheet'
import PhotoCaptureSheet from './PhotoCaptureSheet'
import AssistantPanel from './AssistantPanel'
import Sheet from './Sheet'

function DockLink({ to, label, icon, end = false }: { to: string; label: string; icon: IconName; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${isActive ? 'text-brand-700' : 'text-mute'}`
      }
    >
      {({ isActive }) => <DockFace icon={icon} label={label} active={isActive} />}
    </NavLink>
  )
}

function DockFace({ icon, label, active }: { icon: IconName; label: string; active: boolean }) {
  return (
    <>
      <span
        className={`grid h-7 w-12 place-items-center rounded-full transition-all duration-200 ${
          active ? 'bg-brand-700 text-white shadow-lg' : ''
        }`}
      >
        <Icon name={icon} size={21} strokeWidth={active ? 2.1 : 1.8} />
      </span>
      {label}
    </>
  )
}

export default function Layout() {
  const { me, isAdmin, canWrite, signOut } = useAuth()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteVoice, setPaletteVoice] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [collapsed, setCollapsed] = usePref<boolean>('lab-sidebar-collapsed', false)

  const openPalette = (voice = false) => {
    setPaletteVoice(voice)
    setPaletteOpen(true)
  }

  // حجم الخط المحفوظ من قائمة الإعدادات
  useEffect(() => {
    applyStoredFontSize()
  }, [])

  // آخر ما فتحته (للبحث الشامل)
  useEffect(() => {
    if (/^\/(samples|recipes)\/[^/]+$/.test(location.pathname) && !location.pathname.endsWith('/new')) {
      pushRecent(location.pathname)
    }
  }, [location.pathname])

  // Ctrl+K / Cmd+K لفتح البحث الشامل
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteVoice(false)
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sections = NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.adminOnly || isAdmin) })).filter(
    (s) => s.items.length > 0,
  )
  const roleLine = `${ROLE_AR[me?.role ?? ''] ?? ''}${!canWrite ? ' · عرض فقط' : ''}`
  const moreActive = MORE_PATHS.some((p) => location.pathname.startsWith(p))
  const onAssistantPage = location.pathname.startsWith('/assistant')

  return (
    <div className="min-h-[100dvh]">
      {/* ===== اللاب توب: قائمة جانبية بأقسام، قابلة للطي ===== */}
      <aside
        className={`sidebar fixed inset-y-0 start-0 z-30 hidden flex-col overflow-y-auto text-white transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center gap-3 py-6 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          <img src={icon} alt="MAS" className="h-11 w-11 shrink-0 rounded-xl shadow-md" />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-lg font-extrabold">
                مختبر <span className="text-gold-light">الماس</span>
              </div>
              <div className="text-[11px] text-white/60">للخزف والصيني</div>
            </div>
          )}
        </div>

        <div className={`mx-3 mb-3 flex gap-2 ${collapsed ? 'flex-col items-center' : ''}`}>
          <button
            type="button"
            onClick={() => openPalette()}
            title="بحث سريع"
            aria-label="بحث سريع"
            className={`flex items-center gap-2 rounded-xl bg-white/10 text-sm text-white/80 hover:bg-white/20 ${
              collapsed ? 'h-10 w-10 justify-center' : 'min-w-0 flex-1 px-4 py-2.5'
            }`}
          >
            <Icon name="search" size={16} />
            {!collapsed && (
              <>
                <span className="flex-1 text-start">بحث سريع</span>
                <kbd className="rounded bg-white/15 px-1.5 text-[10px] font-bold">Ctrl K</kbd>
              </>
            )}
          </button>
          <NotificationBell />
        </div>

        <nav className="flex-1 space-y-4 px-3" aria-label="القائمة الرئيسية">
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <div className="mb-1 px-3 text-[11px] font-bold tracking-wide text-white/45">{section.title}</div>
              ) : (
                <div className="mx-3 mb-2 h-px bg-white/10" aria-hidden="true" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center rounded-xl py-3 text-sm font-bold transition-colors ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                      } ${
                        isActive
                          ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(217,180,95,0.4),0_0_22px_-6px_rgba(217,180,95,0.5)]'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute inset-y-2 start-0 w-1 rounded-e bg-gold" aria-hidden="true" />
                        )}
                        <Icon name={item.icon} size={20} />
                        {!collapsed && item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={`space-y-2 border-t border-white/10 p-4 ${collapsed ? 'flex flex-col items-center px-2' : ''}`}>
          {!collapsed && (
            <div className="px-1 leading-tight">
              <div className="truncate text-sm font-bold">{me?.name || 'مستخدم'}</div>
              <div className="truncate text-[11px] text-white/60">{roleLine}</div>
            </div>
          )}
          <a
            href={MAIN_APP_URL}
            title="برنامج المصنع"
            className={`flex items-center gap-2 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20 ${
              collapsed ? 'h-9 w-9 justify-center' : 'px-3 py-2'
            }`}
          >
            <Icon name="factory" size={16} />
            {!collapsed && 'برنامج المصنع'}
          </a>
          <div className={`flex gap-2 ${collapsed ? 'flex-col' : ''}`}>
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
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
              title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
            >
              <Icon name="panel" size={16} />
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              title="خروج"
              className={`flex items-center justify-center gap-2 rounded-lg bg-white/10 text-xs font-bold hover:bg-white/20 ${
                collapsed ? 'h-9 w-9' : 'flex-1 px-3 py-2'
              }`}
            >
              <Icon name="logout" size={16} />
              {!collapsed && 'خروج'}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== الموبايل: شريط علوي (الهوية + بحث + تنبيهات + إعدادات) ===== */}
      <header className="topbar sticky top-0 z-20 text-white lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-2.5">
          <img src={icon} alt="MAS" className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-base font-extrabold">
              مختبر <span className="text-gold-light">الماس</span>
            </div>
            {me?.name && <div className="truncate text-xs text-white/70">{me.name}</div>}
          </div>
          <button
            type="button"
            onClick={() => openPalette()}
            aria-label="بحث سريع"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 transition-colors hover:bg-white/25"
          >
            <Icon name="search" size={19} />
          </button>
          <NotificationBell />
          <SettingsMenu />
        </div>
      </header>

      <main
        className={`mx-auto max-w-3xl px-4 pb-32 pt-5 lg:max-w-none lg:pb-12 lg:pt-0 ${
          collapsed ? 'lg:ps-20' : 'lg:ps-64'
        }`}
      >
        <div className="mx-auto lg:max-w-6xl lg:px-10 lg:py-10">
          <OfflineSync />
          <OfflineStatus />
          <Breadcrumbs />
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ===== المساعد العائم ===== */}
      {!onAssistantPage && (
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          aria-label="المساعد الذكي"
          className="fixed start-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-gold bg-surface text-brand-700 shadow-xl transition-transform active:scale-95 bottom-[calc(6.2rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:start-auto lg:end-6 print:hidden"
        >
          <Icon name="sparkles" size={22} />
        </button>
      )}

      {/* ===== الموبايل: شريط سفلي عائم + زرار إنشاء في النص ===== */}
      <nav className="safe-bottom dock fixed z-20 lg:hidden" aria-label="التنقل السريع">
        <div className={`mx-auto grid max-w-3xl items-end ${canWrite ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <DockLink to="/" label="الرئيسية" icon="home" end />
          <DockLink to="/recipes" label="التركيبات" icon="flask" />
          {canWrite && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                aria-label="إنشاء جديد"
                className="btn-primary !h-14 !w-14 -mt-6 !rounded-full !p-0 shadow-xl"
              >
                <Icon name="plus" size={26} strokeWidth={2.4} />
              </button>
            </div>
          )}
          <DockLink to="/samples" label="العينات" icon="vase" />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${
              moreActive ? 'text-brand-700' : 'text-mute'
            }`}
          >
            <DockFace icon="more" label="المزيد" active={moreActive} />
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="المزيد">
        <div className="space-y-2">
          {sections
            .flatMap((s) => s.items)
            .filter((i) => MORE_PATHS.includes(i.to))
            .map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-bold"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name={i.icon} size={19} />
                </span>
                {i.label}
              </Link>
            ))}
          <a
            href={MAIN_APP_URL}
            className="flex items-center gap-3 rounded-2xl border border-line p-3 text-sm font-bold"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tint text-mute">
              <Icon name="factory" size={19} />
            </span>
            برنامج المصنع
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line p-3 text-sm font-bold"
            >
              <Icon name="contrast" size={18} />
              الوضع الليلي
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line p-3 text-sm font-bold text-red-600"
            >
              <Icon name="logout" size={18} />
              خروج
            </button>
          </div>
        </div>
      </Sheet>

      <QuickCreateSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onPhoto={() => setPhotoOpen(true)}
        onVoice={() => openPalette(true)}
      />
      <PhotoCaptureSheet open={photoOpen} onClose={() => setPhotoOpen(false)} />
      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      <CommandPalette open={paletteOpen} voice={paletteVoice} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
