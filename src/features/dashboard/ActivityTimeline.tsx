import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from '../samples/api'
import { Icon, type IconName } from '../../components/Icon'
import { SectionTitle } from '../../components/ui'
import { finalCodeOf } from '../../lib/stats'
import { resultBadgeClass } from '../../lib/sampleView'
import type { SampleListItem } from '../../types/db'

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return 'دلوقتي'
  if (mins < 60) return `من ${mins} دقيقة`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `من ${hours} ساعة`
  return `من ${Math.floor(hours / 24)} يوم`
}

function describe(s: SampleListItem): { text: string; icon: IconName; tone: string } {
  if (s.status === 'reviewed') return { text: 'اتقيّمت العينة', icon: 'checkCircle', tone: 'bg-emerald-100 text-emerald-700' }
  if (s.status === 'fired') return { text: 'اتحرقت العينة', icon: 'flame', tone: 'bg-amber-100 text-amber-700' }
  return { text: 'اتسجّلت عينة جديدة', icon: 'plus', tone: 'bg-sky-100 text-sky-700' }
}

/** خط زمني لآخر نشاط في المعمل، بيتحدّث لوحده كل دقيقة */
export default function ActivityTimeline() {
  const { data } = useQuery({
    queryKey: ['samples', 'recent'],
    queryFn: () => listSamples({ limit: 8 }),
    refetchInterval: 60_000,
  })
  const list = [...(data ?? [])].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  if (list.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionTitle
        icon="history"
        aside={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            مباشر
          </span>
        }
      >
        آخر النشاط
      </SectionTitle>
      <ol className="card relative space-y-0 !p-0">
        {list.map((s) => {
          const d = describe(s)
          const code = finalCodeOf(s)
          return (
            <li key={s.id} className="border-b border-line last:border-0">
              <Link to={`/samples/${s.id}`} className="flex items-center gap-3 px-3.5 py-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${d.tone}`}>
                  <Icon name={d.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    <span dir="ltr">{s.code}</span> · {d.text}
                  </span>
                  <span className="block truncate text-xs text-mute">
                    {s.recipe?.name ?? 'بدون تركيبة'} · {timeAgo(s.updated_at)}
                  </span>
                </span>
                {code && (
                  <span dir="ltr" className={`badge ${resultBadgeClass(code)}`}>
                    {code}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
