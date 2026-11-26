import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { finalCodeOf } from '../../lib/stats'
import { componentsPreview, resultBadgeClass, sampleTone } from '../../lib/sampleView'
import type { SampleListItem } from '../../types/db'

/** كرت العينة الموحّد (القائمة + لوحة التحكم) */
export default function SampleCard({ sample: s }: { sample: SampleListItem }) {
  const tone = sampleTone(s)
  const code = finalCodeOf(s)
  const preview = componentsPreview(s)
  const title = s.recipe ? s.recipe.name : preview.items[0] ? 'عينة بمكونات مخصصة' : 'بدون تركيبة'

  return (
    <Link to={`/samples/${s.id}`} className="pro-card group">
      <span className={`absolute inset-y-0 start-0 w-1.5 ${tone.bar}`} aria-hidden="true" />
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
