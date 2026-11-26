import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifyReview } from '../../lib/whatsapp'
import { useToast } from '../../components/Toast'
import { analyzeResult, deleteResult, getSignedUrl, saveReview } from './api'
import { ErrorBox } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { InlineSpinner } from '../../components/Loader'
import {
  buildResultCode,
  COLOR_OPTIONS,
  DEFECT_OPTIONS,
  describeResultCode,
  FINISH_OPTIONS,
} from '../../lib/codes'
import type { ColorMatch, Finish, SampleResult } from '../../types/db'

function ResultImage({ path }: { path: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['signed-url', path],
    queryFn: () => getSignedUrl(path),
    staleTime: 50 * 60 * 1000,
  })
  if (isLoading) return <div className="skeleton h-56" />
  if (error || !data) return <div className="rounded-xl bg-tint p-6 text-center text-sm text-mute">تعذّر تحميل الصورة</div>
  return (
    <a href={data} target="_blank" rel="noreferrer">
      <img
        src={data}
        alt="صورة العينة بعد الحرق"
        className="max-h-80 w-full rounded-xl bg-tint object-contain"
      />
    </a>
  )
}

export default function ResultCard({
  result,
  canWrite,
}: {
  result: SampleResult
  canWrite: boolean
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [finish, setFinish] = useState<Finish | ''>(result.finish ?? '')
  const [color, setColor] = useState<ColorMatch | 0>(result.color_match ?? 0)
  const [defects, setDefects] = useState<string[]>(result.defects ?? [])
  const [notes, setNotes] = useState(result.reviewer_notes ?? '')

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['results', result.sample_id] })
    await queryClient.invalidateQueries({ queryKey: ['samples'] })
    await queryClient.invalidateQueries({ queryKey: ['sample', result.sample_id] })
  }

  const analyze = useMutation({ mutationFn: () => analyzeResult(result.id), onSuccess: refresh })
  const review = useMutation({
    mutationFn: () => {
      if (!finish || !color) throw new Error('اختار اللمعان واللون الأول')
      return saveReview(result, {
        finish,
        color_match: color,
        defects,
        reviewer_notes: notes.trim() || null,
      })
    },
    onSuccess: async (code) => {
      void notifyReview(result.id)
      toast(`اتعتمدت النتيجة ${code}`)
      await refresh()
    },
  })
  const remove = useMutation({ mutationFn: () => deleteResult(result), onSuccess: refresh })

  const ai = result.ai_analysis
  const previewCode = finish && color ? buildResultCode(finish, color, defects) : null

  function useAiSuggestion() {
    if (!ai) return
    setFinish(ai.finish)
    setColor(ai.color_match)
    setDefects(ai.defects)
    if (!notes && ai.notes) setNotes(ai.notes)
  }

  function toggleDefect(value: string) {
    setDefects((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]))
  }

  return (
    <div className="card space-y-3">
      <ResultImage path={result.image_path} />

      {result.final_code && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
          <div>
            <div className="text-xs text-brand-700">الكود المعتمد</div>
            <div className="text-sm text-brand-900">{describeResultCode(result.final_code)}</div>
          </div>
          <span dir="ltr" className="text-xl font-bold text-brand-800">
            {result.final_code}
          </span>
        </div>
      )}

      {/* تحليل الذكاء الاصطناعي */}
      {ai ? (
        <div className="space-y-1 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-semibold text-violet-900">
              <Icon name="sparkles" size={16} />
              تحليل الذكاء الاصطناعي (اقتراح فقط)
            </span>
            {result.ai_suggested_code && (
              <span dir="ltr" className="badge bg-violet-200 text-violet-900">
                {result.ai_suggested_code}
              </span>
            )}
          </div>
          <p className="text-ink">{ai.summary}</p>
          <p className="text-xs text-mute">
            الثقة: {Math.round(ai.confidence * 100)}%
            {ai.notes ? ` · ${ai.notes}` : ''}
          </p>
          {canWrite && (
            <button type="button" className="btn-secondary mt-2 w-full" onClick={useAiSuggestion}>
              <Icon name="sparkles" size={16} />
              استخدم الاقتراح في التقييم
            </button>
          )}
        </div>
      ) : (
        canWrite && (
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={analyze.isPending}
            onClick={() => analyze.mutate()}
          >
            {analyze.isPending ? (
              <>
                <InlineSpinner />
                بنحلل الصورة (10-20 ثانية)
              </>
            ) : (
              <>
                <Icon name="sparkles" size={18} />
                حلل الصورة بالذكاء الاصطناعي
              </>
            )}
          </button>
        )
      )}
      {analyze.error && <ErrorBox error={analyze.error} />}

      {/* تقييمك واعتمادك */}
      {canWrite && (
        <div className="space-y-3 border-t border-line pt-3">
          <h3 className="text-sm font-semibold text-ink">تقييمك</h3>

          <div>
            <div className="label">اللمعان</div>
            <div className="grid grid-cols-3 gap-2">
              {FINISH_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFinish(o.value)}
                  className={`rounded-xl border py-2 text-sm font-semibold ${
                    finish === o.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-surface'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">مطابقة اللون</div>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setColor(o.value)}
                  className={`rounded-xl border py-2 text-sm font-semibold ${
                    color === o.value ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-surface'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label">العيوب</div>
            <div className="grid grid-cols-2 gap-2">
              {DEFECT_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                    defects.includes(o.value) ? 'border-red-300 bg-red-50 text-red-800' : 'border-line bg-surface'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={defects.includes(o.value)}
                    onChange={() => toggleDefect(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          <textarea
            className="input min-h-[4rem]"
            placeholder="ملاحظاتك على النتيجة..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-mute">الكود:</span>
            <span dir="ltr" className="text-lg font-bold text-ink">
              {previewCode ?? '—'}
            </span>
          </div>

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!previewCode || review.isPending}
            onClick={() => review.mutate()}
          >
            <Icon name="checkCircle" size={18} />
            {review.isPending ? 'بنحفظ' : result.final_code ? 'تحديث الاعتماد' : 'اعتماد النتيجة'}
          </button>
          {review.error && <ErrorBox error={review.error} />}

          <button
            type="button"
            className="btn-ghost w-full text-red-600"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm('تحذف الصورة دي ونتيجتها؟')) remove.mutate()
            }}
          >
            حذف الصورة
          </button>
          {remove.error && <ErrorBox error={remove.error} />}
        </div>
      )}
    </div>
  )
}
