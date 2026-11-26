import type { ReactNode } from 'react'
import type { SampleStatus } from '../types/db'
import { Icon, IconBadge, type IconName } from './Icon'
import { MiniLoader, PageLoader } from './Loader'

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return 'حدث خطأ غير متوقع'
}

/** مؤشر التحميل الموحّد: هيكل احترافي بدل نص (compact = صغير جوه الكروت) */
export function Spinner({ compact = false }: { compact?: boolean }) {
  return compact ? <MiniLoader /> : <PageLoader />
}

/** هيكل تحميل بدل الدوّامة: كروت رمادية بتلمع لحد ما البيانات توصل */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="تحميل">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-[5.5rem]" />
      ))}
    </div>
  )
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{errorMessage(error)}</span>
    </div>
  )
}

export function Empty({ text, icon = 'inbox', action }: { text: string; icon?: IconName; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center text-sm text-mute">
      <IconBadge name={icon} tone="gray" size={26} box="h-14 w-14" />
      {text}
      {action}
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: IconName
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 lg:mb-6">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconBadge name={icon} size={22} box="h-11 w-11" />}
        <div className="min-w-0">
          <h1 className="title-gradient truncate text-xl font-extrabold lg:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-mute">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** عنوان قسم داخل كرت: أيقونة ملوّنة + نص */
export function SectionTitle({ icon, children, aside }: { icon: IconName; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex min-w-0 items-center gap-2 font-semibold">
        <IconBadge name={icon} size={16} box="h-7 w-7" />
        <span className="truncate">{children}</span>
      </h2>
      {aside}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  icon,
}: {
  label: string
  hint?: string
  children: ReactNode
  icon?: IconName
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        {icon && <Icon name={icon} size={14} className="shrink-0 text-faint" />}
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  )
}

const STATUS_STYLES: Record<SampleStatus, { label: string; className: string; dot: string; icon: IconName }> = {
  planned: { label: 'مخططة', className: 'bg-tint text-ink', dot: 'bg-faint', icon: 'clock' },
  fired: { label: 'محروقة', className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: 'flame' },
  reviewed: { label: 'تم التقييم', className: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', icon: 'checkCircle' },
}

export const STATUS_LABELS: Record<SampleStatus, string> = {
  planned: STATUS_STYLES.planned.label,
  fired: STATUS_STYLES.fired.label,
  reviewed: STATUS_STYLES.reviewed.label,
}

export function StatusBadge({ status }: { status: SampleStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={`badge gap-1.5 ${s.className}`}>
      <Icon name={s.icon} size={13} strokeWidth={2.2} />
      {s.label}
    </span>
  )
}

/** خانة بحث بأيقونة وزرار مسح */
export function SearchBox({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        className="input !ps-10 !pe-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="مسح البحث"
          className="absolute end-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-faint hover:bg-tint hover:text-ink"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
