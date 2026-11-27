import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Icon } from './Icon'
import MicButton from './MicButton'
import { ErrorBox } from './ui'
import { InlineSpinner } from './Loader'
import { useOnline } from '../lib/useOnline'
import { RECIPE_TYPE_LABELS } from '../lib/codes'
import { toFormDraft, type FormDraft, type MatchKind } from '../lib/recipeDraft'
import { parseRecipeText } from '../features/recipes/recipeAi'

const BADGE: Record<MatchKind, { label: string; cls: string }> = {
  exact: { label: 'موجودة', cls: 'bg-emerald-100 text-emerald-800' },
  close: { label: 'اتصحّحت', cls: 'bg-sky-100 text-sky-800' },
  new: { label: 'جديدة', cls: 'bg-amber-100 text-amber-800' },
}

const EXAMPLE = 'مثال: جليز أبيض لامع، نسبة مئوية، مبيض 8، كاولين 5، سيليكات الزركونيوم 12'

/**
 * إدخال تركيبة بالكلام أو الكتابة الحرة: المساعد يحوّل النص لحقول، وأنت تراجع وتحفظ.
 * لا يحفظ شيئًا بنفسه، ولا يرسل أي حاجة لـ Groq غير لما تضغط «حلّل».
 */
export default function RecipeAiInput({
  materials,
  applyLabel,
  onApply,
}: {
  materials: string[]
  applyLabel: string
  onApply: (draft: FormDraft) => void
}) {
  const online = useOnline()
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<FormDraft | null>(null)
  const textRef = useRef('')
  const spoken = useRef('')

  function put(v: string) {
    textRef.current = v
    setText(v)
  }

  // الصوت بيرجّع الجملة كاملة كل مرة: نستبدل الجزء المنطوق السابق بدل ما نكرره
  function onMic(t: string, final: boolean) {
    const cur = textRef.current
    const sp = spoken.current
    const base = sp && cur.endsWith(sp) ? cur.slice(0, cur.length - sp.length) : cur
    const piece = (base && !/\s$/.test(base) ? ' ' : '') + t
    spoken.current = final ? '' : piece
    put(base + piece)
  }

  const parse = useMutation({
    mutationFn: () => parseRecipeText(text.trim(), materials),
    onSuccess: (res) => setDraft(toFormDraft(res, materials)),
  })

  if (draft) {
    return (
      <div className="space-y-3" aria-live="polite">
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-sm font-extrabold">{draft.name || 'بدون اسم'}</div>
          <div className="mt-0.5 text-xs text-mute">
            {draft.type ? RECIPE_TYPE_LABELS[draft.type] : 'النوع غير محدد'}
            {' · '}
            {draft.basis === 'percent' ? 'نسبة مئوية %' : draft.basis === 'per_kg' ? 'جرام لكل 1 كجم' : 'طريقة الكميات غير محددة'}
            {draft.batchKg && ` · خلطة ${draft.batchKg} كجم`}
          </div>
        </div>

        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {draft.rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <span className="min-w-0 truncate font-semibold">
                {r.material}
                {r.match === 'close' && <span className="ms-1 text-[11px] font-normal text-faint">(كتبت «{r.original}»)</span>}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span dir="ltr" className={r.amount === '' ? 'font-bold text-red-600' : 'font-bold'}>
                  {r.amount === '' ? '؟' : r.amount}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE[r.match].cls}`}>{BADGE[r.match].label}</span>
              </span>
            </li>
          ))}
        </ul>

        {draft.warnings.length > 0 && (
          <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            {draft.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1" onClick={() => onApply(draft)} disabled={draft.rows.length === 0}>
            <Icon name="check" size={16} />
            {applyLabel}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
            تعديل النص
          </button>
        </div>
        <p className="text-[11px] leading-snug text-faint">دي مسودة آلية. هتراجعها في النموذج وتعدّل أي رقم أو اسم قبل ما تحفظ.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2">
        <textarea
          className="input min-h-[7rem] flex-1"
          value={text}
          onChange={(e) => put(e.target.value)}
          placeholder={EXAMPLE}
          maxLength={4000}
          aria-label="نص التركيبة"
        />
        <MicButton onText={onMic} />
      </div>
      <button
        type="button"
        className="btn-primary w-full !bg-violet-700"
        disabled={text.trim().length < 3 || parse.isPending || !online}
        onClick={() => parse.mutate()}
      >
        {parse.isPending ? <InlineSpinner /> : <Icon name="sparkles" size={16} />}
        {parse.isPending ? 'بنحلّل التركيبة…' : 'حلّل التركيبة'}
      </button>
      {!online && <p className="text-xs font-bold text-amber-700">محتاج اتصال بالإنترنت. أدخل التركيبة يدويًا لحد ما يرجع.</p>}
      {parse.error && <ErrorBox error={parse.error} />}
      <p className="text-[11px] leading-snug text-faint">
        عند الضغط يُرسل إلى Groq النص اللي كتبته وأسماء الخامات المسجّلة، بدون صور أو بيانات مستخدمين. مفيش حاجة بتتحفظ تلقائيًا.
      </p>
    </div>
  )
}
