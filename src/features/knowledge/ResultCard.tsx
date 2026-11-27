import { Link } from 'react-router-dom'
import { CONFIDENCE_AR, STATUS_AR, type Confidence, type ExperienceStatus, type KbResult } from './api'

const LAYER_STYLE: Record<KbResult['layer'], { label: string; badge: string; bar: string }> = {
  encyclopedia: { label: 'موسوعة علمية', badge: 'bg-sky-100 text-sky-800', bar: 'bg-sky-500' },
  lab: { label: 'تجربة داخل المختبر', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  approved_experience: { label: 'خبرة مصنع معتمدة', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  unapproved_experience: { label: 'فرضية تحتاج إلى تحقق', badge: 'bg-red-100 text-red-700', bar: 'bg-red-400' },
}

const LEVEL: Record<Confidence, number> = { reference: 3, high: 3, medium: 2, low: 1 }
const LEVEL_CLS: Record<Confidence, string> = {
  reference: 'bg-sky-500', high: 'bg-emerald-500', medium: 'bg-amber-500', low: 'bg-red-400',
}

/** مقياس ثقة من 3 نقاط + نص: الثقة مبنية على نوع المصدر وجودة البيانات (ليست رقمًا شكليًا) */
export function ConfidenceMeter({ c }: { c: Confidence }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-faint">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-3 rounded-full ${i <= LEVEL[c] ? LEVEL_CLS[c] : 'bg-line'}`} />
        ))}
      </span>
      الثقة: {CONFIDENCE_AR[c]}
    </span>
  )
}

/** بطاقة نتيجة بحث: الطبقة + المصدر + درجة الثقة دائمًا ظاهرة */
export default function ResultCard({ r, onNavigate }: { r: KbResult; onNavigate?: () => void }) {
  const layer = LAYER_STYLE[r.layer]
  const statusAr = r.layer.endsWith('experience') && r.status ? STATUS_AR[r.status as ExperienceStatus] : null
  return (
    <Link to={r.link_path} onClick={onNavigate}
      className="card relative block space-y-2 overflow-hidden !pe-4 ps-5 transition active:scale-[0.99] active:bg-page">
      <span className={`absolute inset-y-0 start-0 w-1.5 ${layer.bar}`} aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
        <span className={`rounded-full px-2 py-0.5 ${layer.badge}`}>{layer.label}</span>
        {statusAr && <span className="rounded-full bg-tint px-2 py-0.5 text-ink">{statusAr}</span>}
        {r.category_name && <span className="rounded-full bg-tint px-2 py-0.5 text-faint">{r.category_name}</span>}
      </div>
      <div className="text-sm font-bold leading-snug text-ink">{r.title}</div>
      <p className="line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-faint">{r.snippet}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
        <ConfidenceMeter c={r.confidence} />
        <span className="line-clamp-1 max-w-[60%] text-[11px] text-faint">{r.source_detail}</span>
      </div>
    </Link>
  )
}
