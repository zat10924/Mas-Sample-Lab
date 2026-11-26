import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addResultImage, deleteSample, getSample, listResults, updateSampleStatus } from './api'
import ResultCard from './ResultCard'
import AmountsTable from '../recipes/AmountsTable'
import { getRecipe } from '../recipes/api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner, StatusBadge, STATUS_LABELS, SectionTitle } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { sampleFormUrl } from '../../lib/quickEntry'
import { listComponents } from './api'
import { formatComponent, formatNumber, totalWeightGrams } from '../../lib/units'
import { buildSampleMessage, clearGroupLink, copyAndOpenGroup, shareToWhatsApp } from '../../lib/whatsapp'
import PasswordConfirm from '../../components/PasswordConfirm'
import { printDocument } from '../../lib/export'
import SamplePrint from './SamplePrint'
import type { SampleStatus } from '../../types/db'

export default function SampleDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite } = useAuth()
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [askDelete, setAskDelete] = useState(false)
  const components = useQuery({
    queryKey: ['components', id],
    queryFn: () => listComponents(id as string),
    enabled: !!id,
  })
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
    <>
    <div className="space-y-4 print:hidden">
      <PageTitle
        icon="vase" title={s.code}
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
                    components.data ?? [],
                  ),
                )
              }
            >
              <Icon name="share" size={16} />
              واتساب
            </button>
            {canWrite && (
              <Link to={`/samples/${s.id}/edit`} className="btn-secondary">
                <Icon name="pencil" size={16} />
                تعديل
              </Link>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          className="btn-secondary !px-3 !py-2"
          onClick={() => printDocument(`${s.code}${s.recipe ? ` - ${s.recipe.name}` : ''}`)}
        >
          <Icon name="print" size={16} />
          طباعة PDF
        </button>
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
                  components.data ?? [],
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
            to={sampleFormUrl({ from: s.id, recipeId: s.recipe_id, kg: s.batch_kg, temp: s.firing_temp, method: s.application_method, body: s.body_type })}
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
              <span className="flex items-center gap-2 text-mute">
                <Icon name="target" size={15} className="shrink-0 text-faint" />
                الحالة
              </span>
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
            <Row icon="weight" label="كمية الجليز الأساسي" value={`${s.batch_kg} كجم`} />
            <Row icon="vase" label="نوع البدن" value={s.body_type} />
            <Row icon="thermometer" label="درجة الحرق" value={s.firing_temp ? `${s.firing_temp}°م` : null} />
            <Row icon="calendar" label="تاريخ الحرق" value={s.firing_date} />
            <Row icon="brush" label="طريقة التطبيق" value={s.application_method} />
            <Row icon="clock" label="تاريخ التسجيل" value={new Date(s.created_at).toLocaleDateString('en-GB')} />
            {s.notes && (
              <div className="flex items-start gap-2 border-t border-line pt-2 text-mute">
                <Icon name="fileText" size={15} className="mt-0.5 shrink-0 text-faint" />
                <span className="min-w-0 whitespace-pre-wrap">{s.notes}</span>
              </div>
            )}
          </div>

          {components.data && components.data.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon="layers">مكونات العينة</SectionTitle>
                <span className="badge bg-brand-50 text-brand-800">{components.data.length} مكوّن</span>
              </div>
              <ol className="divide-y divide-line">
                {components.data.map((c, i) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tint text-xs font-bold text-mute">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{c.material}</span>
                    <span className="shrink-0 font-bold tabular-nums text-brand-800">{formatComponent(c.amount, c.unit)}</span>
                  </li>
                ))}
              </ol>
              {totalWeightGrams(components.data) > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
                  <span>إجمالي الوزن</span>
                  <span className="font-bold tabular-nums">
                    {formatNumber(totalWeightGrams(components.data))} جم
                    {totalWeightGrams(components.data) >= 1000 && ` (${formatNumber(totalWeightGrams(components.data) / 1000, 3)} كجم)`}
                  </span>
                </div>
              )}
            </div>
          )}

          {recipe.data && (
            <div className="card space-y-2">
              <SectionTitle icon="weight">الكميات المطلوبة</SectionTitle>
              <AmountsTable recipe={recipe.data} kg={s.batch_kg} />
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <div className="space-y-3">
            <SectionTitle icon="image">صور ونتائج ما بعد الحرق</SectionTitle>

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
    <SamplePrint sample={s} components={components.data ?? []} recipe={recipe.data} results={results.data ?? []} />
    </>
  )
}

function Row({ label, value, icon }: { label: string; value: string | null; icon?: IconName }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-mute">
        {icon && <Icon name={icon} size={15} className="shrink-0 text-faint" />}
        {label}
      </span>
      <span className="font-medium text-ink">{value || '—'}</span>
    </div>
  )
}
