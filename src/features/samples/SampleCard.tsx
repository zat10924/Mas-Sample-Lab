import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSignedUrl } from './api'
import { useInView } from '../../lib/useInView'
import { StatusBadge } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { finalCodeOf } from '../../lib/stats'
import { componentsPreview, resultBadgeClass, sampleTone } from '../../lib/sampleView'
import type { SampleListItem } from '../../types/db'

/** صورة العينة أعلى الكرت: بتتحمّل لما الكرت يظهر على الشاشة بس */
function CardPhoto({ path, alt }: { path: string; alt: string }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const q = useQuery({
    queryKey: ['thumb', path],
    queryFn: () => getSignedUrl(path),
    enabled: seen,
    staleTime: 50 * 60 * 1000,
    retry: 1,
  })
  if (q.isError) return null
  return (
    <div ref={ref} className="-me-4 -ms-5 -mt-4 mb-3 h-36 overflow-hidden bg-tint">
      {q.data ? (
        <img src={q.data} alt={alt} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      ) : (
        <div className="skeleton h-full w-full !rounded-none" />
      )}
    </div>
  )
}

/** كرت العينة الموحّد (القائمة + لوحة التحكم) */
export default function SampleCard({ sample: s }: { sample: SampleListItem }) {
  const tone = sampleTone(s)
  const code = finalCodeOf(s)
  const preview = componentsPreview(s)
  const photoPath = s.results.find((r) => r.image_path)?.image_path
  const title = s.recipe ? s.recipe.name : preview.items[0] ? 'عينة بمكونات مخصصة' : 'بدون تركيبة'

  return (
    <Link to={`/samples/${s.id}`} className="pro-card group">
      <span className={`absolute inset-y-0 start-0 z-10 w-1.5 ${tone.bar}`} aria-hidden="true" />
      {photoPath && <CardPhoto path={photoPath} alt={`صورة العينة ${s.code}`} />}
      <div className="flex items-start gap-3">
        <div className={`avatar ${tone.chip}`} aria-hidden="true">
          {tone.letter ?? <Icon name="vase" size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span dir="ltr" className="truncate text-start text-base font-extrabold text-ink">
              {s.code}
            </span>
            <StatusBadge status={s.status} />
          </div>
          <div className="mt-0.5 truncate text-sm text-mute">
            {title}
            {s.recipe && <span dir="ltr"> · {s.recipe.code}</span>}
          </div>
        </div>
      </div>

      {preview.items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {preview.items.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          {preview.more > 0 && <span className="chip chip-more">+{preview.more}</span>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-2.5 text-xs text-faint">
        <span>{new Date(s.firing_date ?? s.created_at).toLocaleDateString('en-GB')}</span>
        {s.firing_temp && <span className="font-semibold text-mute">{s.firing_temp}°م</span>}
        {s.application_method && <span>{s.application_method}</span>}
        {code && (
          <span dir="ltr" className={`badge ms-auto ${resultBadgeClass(code)}`}>
            {code}
          </span>
        )}
      </div>
    </Link>
  )
}
