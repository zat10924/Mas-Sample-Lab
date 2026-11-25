import type { ReactNode } from 'react'
import type { SampleStatus } from '../types/db'

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return 'حدث خطأ غير متوقع'
}

export function Spinner({ label = 'جاري التحميل...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-mute">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      {errorMessage(error)}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="card py-10 text-center text-sm text-mute">{text}</div>
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-mute">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  )
}

const STATUS_STYLES: Record<SampleStatus, { label: string; className: string; dot: string }> = {
  planned: { label: 'مخططة', className: 'bg-tint text-ink', dot: 'bg-faint' },
  fired: { label: 'محروقة', className: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  reviewed: { label: 'تم التقييم', className: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
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
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}
