import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRecipe, listRecipes, saveRecipe, type IngredientInput } from './api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, Field, PageTitle, Spinner } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { nextRecipeCode, RECIPE_TYPE_LABELS } from '../../lib/codes'
import { parseNumber } from '../../lib/units'
import type { RecipeBasis, RecipeType } from '../../types/db'

interface IngredientRow {
  key: string
  material: string
  amount: string
  batch: string
}

function newRow(): IngredientRow {
  return { key: crypto.randomUUID(), material: '', amount: '', batch: '' }
}

const TYPE_OPTIONS: RecipeType[] = ['glaze_color', 'matte', 'white', 'base', 'decoration', 'body']

export default function RecipeFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite } = useAuth()

  const existing = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id as string),
    enabled: isEdit,
  })
  const all = useQuery({ queryKey: ['recipes'], queryFn: listRecipes })

  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<RecipeType>('glaze_color')
  const [basis, setBasis] = useState<RecipeBasis>('per_kg')
  const [batchKg, setBatchKg] = useState('')
  const [density, setDensity] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<IngredientRow[]>([newRow()])
  const [formError, setFormError] = useState<string | null>(null)

  // تعبئة النموذج عند التعديل
  useEffect(() => {
    const r = existing.data
    if (!r) return
    setCode(r.code)
    setCodeTouched(true)
    setName(r.name)
    setType(r.type)
    setBasis(r.basis)
    setBatchKg(r.batch_base_kg !== null ? String(r.batch_base_kg) : '')
    setDensity(r.density !== null ? String(r.density) : '')
    setNotes(r.notes ?? '')
    setRows(
      r.ingredients.length > 0
        ? r.ingredients.map((i) => ({
            key: i.id,
            material: i.material,
            amount: String(i.amount),
            batch: i.batch_grams !== null ? String(i.batch_grams) : '',
          }))
        : [newRow()],
    )
  }, [existing.data])

  // اقتراح كود تلقائي للتركيبة الجديدة
  useEffect(() => {
    if (isEdit || codeTouched || !all.data) return
    setCode(nextRecipeCode(type, all.data.map((r) => r.code)))
  }, [isEdit, codeTouched, all.data, type])

  // النسبة المئوية: المط والأبيض افتراضيًا
  function onTypeChange(next: RecipeType) {
    setType(next)
    if (!isEdit) setBasis(next === 'matte' || next === 'white' ? 'percent' : 'per_kg')
  }

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const save = useMutation({
    mutationFn: async () => {
      const cleanName = name.trim()
      const cleanCode = code.trim().toUpperCase()
      if (!cleanName) throw new Error('اكتب اسم التركيبة')
      if (!cleanCode) throw new Error('اكتب كود التركيبة')

      const ingredients: IngredientInput[] = []
      for (const row of rows) {
        const material = row.material.trim()
        if (!material && !row.amount.trim()) continue
        const amount = parseNumber(row.amount)
        if (!material) throw new Error('فيه كمية من غير اسم مكوّن')
        if (amount === null || amount < 0) throw new Error(`اكتب كمية صحيحة للمكوّن "${material}"`)
        ingredients.push({ material, amount, batch_grams: parseNumber(row.batch) })
      }
      if (ingredients.length === 0) throw new Error('أضف مكوّن واحد على الأقل')

      return saveRecipe(
        id ?? null,
        {
          code: cleanCode,
          name: cleanName,
          type,
          basis,
          batch_base_kg: parseNumber(batchKg),
          density: parseNumber(density),
          notes: notes.trim() || null,
        },
        ingredients,
      )
    },
    onSuccess: async (recipeId) => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      await queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
      navigate(`/recipes/${recipeId}`, { replace: true })
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'حدث خطأ'
      setFormError(
        message.includes('duplicate key') ? 'الكود ده مستخدم قبل كده، اختار كود تاني' : message,
      )
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    save.mutate()
  }

  if (!canWrite) return <ErrorBox error="مالكش صلاحية التعديل" />
  if (isEdit && existing.isLoading) return <Spinner />
  if (isEdit && existing.error) return <ErrorBox error={existing.error} />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4">
      <PageTitle title={isEdit ? 'تعديل التركيبة' : 'تركيبة جديدة'} />

      <div className="card space-y-4">
        <Field label="الاسم">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="النوع">
            <select
              className="input"
              value={type}
              onChange={(e) => onTypeChange(e.target.value as RecipeType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {RECIPE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الكود">
            <input
              dir="ltr"
              className="input text-start"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setCodeTouched(true)
              }}
              required
            />
          </Field>
        </div>

        <Field
          label="طريقة تسجيل الكميات"
          hint={
            basis === 'per_kg'
              ? 'جرام لكل 1 كجم جليز شفاف (زي معيار العينة في الملف)'
              : 'نسبة مئوية من وزن الجليز'
          }
        >
          <select
            className="input"
            value={basis}
            onChange={(e) => setBasis(e.target.value as RecipeBasis)}
          >
            <option value="per_kg">جرام لكل 1 كجم جليز</option>
            <option value="percent">نسبة مئوية %</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="وزن الخلطة الكبيرة (كجم)" hint="اختياري">
            <input
              className="input"
              inputMode="decimal"
              value={batchKg}
              onChange={(e) => setBatchKg(e.target.value)}
            />
          </Field>
          <Field label="الكثافة (g/cm³)" hint="اختياري">
            <input
              className="input"
              inputMode="decimal"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
            />
          </Field>
        </div>

        <Field label="ملاحظات">
          <textarea
            className="input min-h-[5rem]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">المكوّنات</h2>
        {rows.map((row) => (
          <div key={row.key} className="rounded-xl border border-line p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input
                  className="input"
                  placeholder="اسم المكوّن (مثلًا: مبيض)"
                  value={row.material}
                  onChange={(e) => updateRow(row.key, { material: e.target.value })}
                />
              </div>
              <input
                className="input"
                inputMode="decimal"
                placeholder={basis === 'per_kg' ? 'جم / كجم' : 'النسبة %'}
                value={row.amount}
                onChange={(e) => updateRow(row.key, { amount: e.target.value })}
              />
              <input
                className="input"
                inputMode="decimal"
                placeholder="الخلطة الكبيرة (جم)"
                value={row.batch}
                onChange={(e) => updateRow(row.key, { batch: e.target.value })}
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-red-600"
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
              >
                حذف المكوّن
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn-secondary w-full" onClick={() => setRows((p) => [...p, newRow()])}>
          <Icon name="plus" size={16} />
          مكوّن
        </button>
      </div>

      {formError && <ErrorBox error={formError} />}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>
          {save.isPending ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          إلغاء
        </button>
      </div>
    </form>
  )
}
