import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addResultImage, deleteSample, getSample, listResults, updateSampleStatus } from './api'
import ResultCard from './ResultCard'
import AmountsTable from '../recipes/AmountsTable'
import { getRecipe } from '../recipes/api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner, StatusBadge, STATUS_LABELS } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { sampleFormUrl } from '../../lib/quickEntry'
import { buildSampleMessage, clearGroupLink, copyAndOpenGroup, shareToWhatsApp } from '../../lib/whatsapp'
import PasswordConfirm from '../../components/PasswordConfirm'
import type { SampleStatus } from '../../types/db'

export default function SampleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [askDelete, setAskDelete] = useState(false)
  const [waNote, setWaNote] = useState<string | null>(null)

  const sample = useQuery({ queryKey: ['sample', id], queryFn: () => getSample(id), enabled: !!id })
  const results = useQuery({ queryKey: ['results', id], queryFn: () => listResults(id), enabled: !!id })
  const recipeId = sample.data?.recipe?.id
  const recipe = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => getRecipe(recipeId as string),
    enabled: !!recipeId,
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['results', id] })
    await queryClient.invalidateQueries({ queryKey: ['sample', id] })
    await queryClient.invalidateQueries({ queryKey: ['samples'] })
  }

  const upload = useMutation({
    mutationFn: (file: File) => addResultImage(id, file),
    onSuccess: refresh,
  })
  const changeStatus = useMutation({
    mutationFn: (status: SampleStatus) => updateSampleStatus(id, status),
    onSuccess: refresh,
  })
  async function confirmDelete() {
    await deleteSample(id)
    setAskDelete(false)
    await queryClient.invalidateQueries({ queryKey: ['samples'] })
    toast('اتحذفت العينة')
    navigate('/samples', { replace: true })
  }

  if (sample.isLoading) return <Spinner />
  if (sample.error) return <ErrorBox error={sample.error} />
  const s = sample.data
  if (!s) return <ErrorBox error="العينة غير موجودة" />

  return (
    <div className="space-y-4">
      <PageTitle
        title={s.code}
        subtitle={s.recipe ? `${s.recipe.name} (${s.recipe.code})` : 'بدون تركيبة'}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                void shareToWhatsApp(
                  buildSampleMessage(
                    s,
                    (results.data ?? []).find((r) => r.final_code)?.final_code ?? null,
                    window.location.href,
                  ),
                )
              }
            >
              <Icon name="share" size={16} />
              واتساب
            </button>
            {canWrite && (
              <Link to={`/samples/${s.id}/edit`} className="btn-secondary">
                تعديل
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          className="btn-ghost !px-3 !py-2"
          onClick={async () =>
            setWaNote(
              await copyAndOpenGroup(
                buildSampleMessage(
                  s,
                  (results.data ?? []).find((r) => r.final_code)?.final_code ?? null,
                  window.location.href,
                ),
              ),
            )
          }
        >
          <Icon name="share" size={16} />
          نسخ الرسالة وفتح جروب المعمل
        </button>
        {canWrite && (
          <Link
            to={sampleFormUrl({ recipeId: s.recipe_id, kg: s.batch_kg, temp: s.firing_temp, method: s.application_method, body: s.body_type })}
            className="btn-ghost !px-3 !py-2"
          >
            <Icon name="copy" size={16} />
            نسخ كعينة جديدة
          </Link>
        )}
        <button type="button" className="text-xs text-faint underline" onClick={() => { clearGroupLink(); setWaNote('اتمسح رابط الجروب من الجهاز') }}>
          تغيير الجروب
        </button>
        {waNote && <span className="text-xs text-mute">{waNote}</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-mute">الحالة</span>
              {canWrite ? (
                <select
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-sm"
                  value={s.status}
                  onChange={(e) => changeStatus.mutate(e.target.value as SampleStatus)}
                >
                  {(Object.keys(STATUS_LABELS) as SampleStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={s.status} />
              )}
            </div>
            <Row label="كمية الجليز" value={`${s.batch_kg} كجم`} />
            <Row label="نوع البدن" value={s.body_type} />
            <Row label="درجة الحرق" value={s.firing_temp ? `${s.firing_temp}°م` : null} />
            <Row label="تاريخ الحرق" value={s.firing_date} />
            <Row label="طريقة التطبيق" value={s.application_method} />
            <Row label="تاريخ التسجيل" value={new Date(s.created_at).toLocaleDateString('en-GB')} />
            {s.notes && (
              <div className="border-t border-line pt-2 text-mute">{s.notes}</div>
            )}
          </div>

          {recipe.data && (
            <div className="card space-y-2">
              <h2 className="font-semibold">الكميات المطلوبة</h2>
              <AmountsTable recipe={recipe.data} kg={s.batch_kg} />
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <div className="space-y-3">
            <h2 className="font-semibold">صور ونتائج ما بعد الحرق</h2>

            {canWrite && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) upload.mutate(file)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="btn-primary w-full"
                  disabled={upload.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  {upload.isPending ? (
                    'جاري رفع الصورة...'
                  ) : (
                    <>
                      <Icon name="camera" size={18} />
                      أضف صورة العينة بعد الحرق
                    </>
                  )}
                </button>
                {upload.error && <ErrorBox error={upload.error} />}
              </>
            )}

            {results.isLoading && <Spinner />}
            {results.error && <ErrorBox error={results.error} />}
            {results.data && results.data.length === 0 && (
              <div className="card py-8 text-center text-sm text-mute">لسه مفيش صور لهذه العينة</div>
            )}
            {(results.data ?? []).map((r) => (
              <ResultCard key={r.id} result={r} canWrite={canWrite} />
            ))}
          </div>
        </div>
      </div>

      {canWrite && (
        <div className="border-t border-line pt-4">
          <button type="button" className="btn-ghost text-red-600" onClick={() => setAskDelete(true)}>
            <Icon name="trash" size={16} />
            حذف العينة
          </button>
        </div>
      )}

      <PasswordConfirm
        open={askDelete}
        title="حذف العينة نهائيًا"
        message={`هتحذف العينة ${s.code} بكل صورها ونتائجها، ومش هتقدر ترجّعها.`}
        onConfirm={confirmDelete}
        onClose={() => setAskDelete(false)}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mute">{label}</span>
      <span className="font-medium text-ink">{value || '—'}</span>
    </div>
  )
}
