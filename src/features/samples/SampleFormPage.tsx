import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSample, saveSample } from './api'
import { getRecipe, listRecipes } from '../recipes/api'
import AmountsTable from '../recipes/AmountsTable'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, Field, PageTitle, Spinner } from '../../components/ui'
import { parseNumber } from '../../lib/units'

const APPLICATION_METHODS = ['غمس', 'رش', 'فرشاة', 'سكب']

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA')
}

export default function SampleFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite } = useAuth()

  const existing = useQuery({
    queryKey: ['sample', id],
    queryFn: () => getSample(id as string),
    enabled: isEdit,
  })
  const recipes = useQuery({ queryKey: ['recipes'], queryFn: listRecipes })

  const [recipeId, setRecipeId] = useState(searchParams.get('recipe') ?? '')
  const [bodyType, setBodyType] = useState('')
  const [batchKg, setBatchKg] = useState('1')
  const [firingTemp, setFiringTemp] = useState('')
  const [firingDate, setFiringDate] = useState(isEdit ? '' : todayLocal())
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const s = existing.data
    if (!s) return
    setRecipeId(s.recipe_id ?? '')
    setBodyType(s.body_type ?? '')
    setBatchKg(String(s.batch_kg))
    setFiringTemp(s.firing_temp !== null ? String(s.firing_temp) : '')
    setFiringDate(s.firing_date ?? '')
    setMethod(s.application_method ?? '')
    setNotes(s.notes ?? '')
  }, [existing.data])

  const selectedRecipe = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => getRecipe(recipeId),
    enabled: !!recipeId,
  })

  const save = useMutation({
    mutationFn: async () => {
      const kg = parseNumber(batchKg)
      if (kg === null || kg <= 0) throw new Error('اكتب الكمية بالكيلوجرام (أكبر من صفر)')
      const temp = parseNumber(firingTemp)
      return saveSample(id ?? null, {
        recipe_id: recipeId || null,
        body_type: bodyType.trim() || null,
        batch_kg: kg,
        firing_temp: temp !== null ? Math.round(temp) : null,
        firing_date: firingDate || null,
        application_method: method || null,
        notes: notes.trim() || null,
      })
    },
    onSuccess: async (sampleId) => {
      await queryClient.invalidateQueries({ queryKey: ['samples'] })
      await queryClient.invalidateQueries({ queryKey: ['sample', sampleId] })
      navigate(`/samples/${sampleId}`, { replace: true })
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'حدث خطأ'),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    save.mutate()
  }

  if (!canWrite) return <ErrorBox error="مالكش صلاحية التسجيل" />
  if (isEdit && existing.isLoading) return <Spinner />
  if (isEdit && existing.error) return <ErrorBox error={existing.error} />

  const kg = parseNumber(batchKg) ?? 0

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4">
      <PageTitle
        title={isEdit ? 'تعديل العينة' : 'عينة جديدة'}
        subtitle={isEdit ? existing.data?.code : 'الكود هيتولد تلقائي بعد الحفظ'}
      />

      <div className="card space-y-4">
        <Field label="التركيبة">
          <select className="input" value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
            <option value="">— من غير تركيبة —</option>
            {(recipes.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} · {r.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="كمية الجليز (كجم)">
            <input
              className="input"
              inputMode="decimal"
              value={batchKg}
              onChange={(e) => setBatchKg(e.target.value)}
              required
            />
          </Field>
          <Field label="نوع البدن">
            <input className="input" value={bodyType} onChange={(e) => setBodyType(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="درجة الحرق (°م)">
            <input
              className="input"
              inputMode="numeric"
              value={firingTemp}
              onChange={(e) => setFiringTemp(e.target.value)}
            />
          </Field>
          <Field label="تاريخ الحرق">
            <input
              type="date"
              className="input"
              value={firingDate}
              onChange={(e) => setFiringDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="طريقة التطبيق">
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">— اختر —</option>
            {APPLICATION_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="ملاحظات (تعديلات على التركيبة، سمك الطبقة...)">
          <textarea
            className="input min-h-[5rem]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>

      {recipeId && (
        <div className="card space-y-2">
          <h2 className="font-semibold">الكميات المطلوبة</h2>
          {selectedRecipe.isLoading && <Spinner />}
          {selectedRecipe.data && kg > 0 && <AmountsTable recipe={selectedRecipe.data} kg={kg} />}
        </div>
      )}

      {formError && <ErrorBox error={formError} />}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>
          {save.isPending ? 'جاري الحفظ...' : 'حفظ العينة'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          إلغاء
        </button>
      </div>
    </form>
  )
}
