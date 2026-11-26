import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { MAIN_APP_URL } from '../lib/mainApp'
import {
  ROLE_AR,
  getFontSize,
  getThemeMode,
  setFontSize,
  setThemeMode,
  type FontSize,
  type ThemeMode,
} from '../lib/roles'
import { Icon } from './Icon'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'auto', label: 'تلقائي' },
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
]

const SIZES: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'صغير' },
  { value: 'md', label: 'عادي' },
  { value: 'lg', label: 'كبير' },
]

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold text-mute">{label}</div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-tint p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg py-2 text-sm font-bold transition-colors ${
              value === o.value ? 'bg-surface text-brand-700 shadow-sm' : 'text-mute'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const rowClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-bold text-ink transition-colors hover:bg-tint'

/** قائمة الإعدادات: بتجمّع المظهر وحجم الخط وتثبيت/تحديث البرنامج ورابط المصنع والخروج في مكان واحد */
export default function SettingsMenu() {
  const { me, canWrite, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('auto')
  const [size, setSize] = useState<FontSize>('md')
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (!open) return
    setTheme(getThemeMode())
    setSize(getFontSize())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    setInstallEvent(null)
    setOpen(false)
  }

  async function refreshApp() {
    // مفيش مسح للكاش ولا إلغاء تسجيل Service Worker: برنامج المصنع عنده SW على جذر الدومين وبيغطي المختبر
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.()
      await reg?.update()
    } catch {
      // نكمّل بإعادة تحميل عادية
    }
    window.location.reload()
  }

  const roleLine = `${ROLE_AR[me?.role ?? ''] ?? ''}${!canWrite ? ' · عرض فقط' : ''}`
  const initial = (me?.name || 'م').trim().charAt(0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="الإعدادات"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 transition-colors hover:bg-white/25"
      >
        <Icon name="sliders" size={19} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" role="presentation">
            <div className="fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="الإعدادات"
              className="pop-in absolute end-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface p-3 shadow-2xl"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.75rem)' }}
            >
              <div className="flex items-center gap-3 px-1 pb-3">
                <span className="avatar bg-brand-50 text-brand-700">{initial}</span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-extrabold text-ink">{me?.name || 'مستخدم'}</div>
                  <div className="truncate text-xs text-mute">{roleLine}</div>
                </div>
              </div>

              <div className="space-y-3 border-t border-line px-1 py-3">
                <Segmented
                  label="المظهر"
                  value={theme}
                  options={THEMES}
                  onChange={(v) => {
                    setThemeMode(v)
                    setTheme(v)
                  }}
                />
                <Segmented
                  label="حجم الخط"
                  value={size}
                  options={SIZES}
                  onChange={(v) => {
                    setFontSize(v)
                    setSize(v)
                  }}
                />
              </div>

              <div className="space-y-0.5 border-t border-line pt-2">
                {installEvent && (
                  <button type="button" onClick={() => void install()} className={rowClass}>
                    <Icon name="download" size={18} className="text-brand-700" />
                    تثبيت البرنامج على الجهاز
                  </button>
                )}
                <button type="button" onClick={() => void refreshApp()} className={rowClass}>
                  <Icon name="refresh" size={18} className="text-brand-700" />
                  تحديث البرنامج
                </button>
                <a href={MAIN_APP_URL} className={rowClass}>
                  <Icon name="factory" size={18} className="text-brand-700" />
                  برنامج المصنع
                </a>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={`${rowClass} text-red-600 hover:bg-red-50`}
                >
                  <Icon name="logout" size={18} />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
