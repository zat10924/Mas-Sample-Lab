import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from '../features/samples/api'
import { finalCodeOf } from '../lib/stats'
import { Icon } from './Icon'
import Sheet from './Sheet'

const DAY_MS = 86_400_000
const FIRED_DAYS = 3
const PLANNED_DAYS = 7

interface Alert {
  id: string
  code: string
  text: string
  days: number
  tone: 'amber' | 'gray'
}

/** جرس التنبيهات: عينات متأخرة في التقييم أو لسه ما اتحرقتش */
export default function NotificationBell({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ queryKey: ['samples'], queryFn: () => listSamples(), refetchInterval: 120_000 })

  const alerts = useMemo<Alert[]>(() => {
    const now = Date.now()
    const out: Alert[] = []
    for (const s of data ?? []) {
      const days = Math.floor((now - new Date(s.firing_date ?? s.created_at).getTime()) / DAY_MS)
      if (s.status === 'fired' && !finalCodeOf(s) && days >= FIRED_DAYS) {
        out.push({ id: s.id, code: s.code, text: `مستنية التقييم من ${days} يوم`, days, tone: 'amber' })
      } else if (s.status === 'planned' && days >= PLANNED_DAYS) {
        out.push({ id: s.id, code: s.code, text: `مخططة من ${days} يوم ولسه ما اتحرقتش`, days, tone: 'gray' })
      }
    }
    return out.sort((a, b) => b.days - a.days)
  }, [data])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alerts.length > 0 ? `التنبيهات (${alerts.length})` : 'التنبيهات'}
        className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 transition-colors hover:bg-white/25 ${className}`}
      >
        <Icon name="bell" size={19} />
        {alerts.length > 0 && (
          <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-extrabold text-white">
            {alerts.length > 99 ? '99+' : alerts.length}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="التنبيهات">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-mute">
            <Icon name="checkCircle" size={30} className="text-emerald-600" />
            مفيش تنبيهات، كله تمام
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {alerts.slice(0, 30).map((a) => (
              <li key={a.id}>
                <Link
                  to={`/samples/${a.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 py-3"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      a.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-tint text-mute'
                    }`}
                  >
                    <Icon name={a.tone === 'amber' ? 'flame' : 'clock'} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span dir="ltr" className="block truncate text-start text-sm font-extrabold">
                      {a.code}
                    </span>
                    <span className="block truncate text-xs text-mute">{a.text}</span>
                  </span>
                  <Icon name="chevronLeft" size={16} className="text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  )
}
