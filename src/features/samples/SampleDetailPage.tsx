import { useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addResultImage, deleteSample, getSample, listResults, updateSampleStatus } from './api'
import ResultCard from './ResultCard'
import AmountsTable from '../recipes/AmountsTable'
import { getRecipe } from '../recipes/api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner, StatusBadge, STATUS_LABELS } from '../../components/ui'
import type { SampleStatus } from '../../types/db'

export default function SampleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)

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
  const remove = useMutation({
    mutationFn: () => deleteSample(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['samples'] })
      navigate('/samples', { replace: true })
    },
  })

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
          canWrite ? (
            <Link to={`/samples/${s.id}/edit`} className="btn-secondary">
              تعديل
            </Link>
          ) : undefined
        }
      />

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
              {upload.isPending ? 'جاري رفع الصورة...' : '📷 أضف صورة العينة بعد الحرق'}
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

      {canWrite && (
        <div className="pt-2">
          <button
            type="button"
            className="btn-ghost w-full text-red-600"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`تحذف العينة ${s.code} بكل صورها؟`)) remove.mutate()
            }}
          >
            حذف العينة
          </button>
          {remove.error && <div className="mt-2"><ErrorBox error={remove.error} /></div>}
        </div>
      )}
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
