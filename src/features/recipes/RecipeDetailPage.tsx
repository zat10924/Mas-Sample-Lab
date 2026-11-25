import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteRecipe, getRecipe } from './api'
import AmountsTable from './AmountsTable'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'
import { formatGrams, formatNumber, ingredientGrams, parseNumber } from '../../lib/units'

export default function RecipeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite, isAdmin } = useAuth()
  const [kgText, setKgText] = useState('1')
  // base = وزن الجليز الشفاف | total = الوزن النهائي الكلي بعد إضافة كل المكونات
  const [mode, setMode] = useState<'base' | 'total'>('base')

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id),
    enabled: !!id,
  })

  const remove = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate('/recipes', { replace: true })
    },
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorBox error={error} />
  if (!recipe) return <ErrorBox error="التركيبة غير موجودة" />

  const entered = parseNumber(kgText) ?? 0
  // مجموع الجرامات المضافة لكل 1 كجم أساس
  const addedPerKg = recipe.ingredients.reduce(
    (sum, ing) => sum + ingredientGrams(ing.amount, recipe.basis, 1),
    0,
  )
  const kg = mode === 'total' ? entered / (1 + addedPerKg / 1000) : entered
  const hasBatch = recipe.batch_base_kg !== null

  return (
    <div className="space-y-4">
      <PageTitle
        title={recipe.name}
        subtitle={`${recipe.code} · ${RECIPE_TYPE_LABELS[recipe.type]}`}
        action={
          canWrite ? (
            <Link to={`/recipes/${recipe.id}/edit`} className="btn-secondary">
              تعديل
            </Link>
          ) : undefined
        }
      />

      {recipe.notes && (
        <div className="card text-sm text-mute">{recipe.notes}</div>
      )}

      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={mode === 'base' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('base')}
          >
            {recipe.basis === 'per_kg' ? 'وزن الجليز الشفاف' : 'وزن الجليز'}
          </button>
          <button
            type="button"
            className={mode === 'total' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMode('total')}
          >
            الوزن النهائي الكلي
          </button>
        </div>

        <div>
          <label className="label" htmlFor="kg">
            {mode === 'total' ? 'الوزن النهائي المطلوب (كجم)' : 'الكمية (كجم)'}
          </label>
          <input
            id="kg"
            className="input"
            inputMode="decimal"
            value={kgText}
            onChange={(e) => setKgText(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 5, 10, 20, 50].map((n) => (
              <button
                key={n}
                type="button"
                className="btn-ghost border border-line px-3 py-1 text-sm"
                onClick={() => setKgText(String(n))}
              >
                {n} كجم
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-faint">
            {mode === 'total'
              ? 'اكتب الوزن النهائي اللي عايزه وهيحسب كمية الأساس وكل مكوّن تلقائي.'
              : recipe.basis === 'per_kg'
                ? 'الكميات بالجرام لكل 1 كجم جليز شفاف، وبتتضرب في الكمية اللي تكتبها.'
                : 'النسب مئوية من وزن الجليز، وبتتحسب على الكمية اللي تكتبها.'}
          </p>
        </div>

        {entered > 0 ? (
          <AmountsTable recipe={recipe} kg={kg} />
        ) : (
          <p className="text-sm text-amber-700">اكتب كمية أكبر من صفر</p>
        )}

        {recipe.density !== null && (
          <p className="text-sm text-mute">الكثافة: {formatNumber(recipe.density)} g/cm³</p>
        )}
      </div>

      {hasBatch && (
        <div className="card">
          <h2 className="mb-2 font-semibold">الخلطة الكبيرة ({formatNumber(recipe.batch_base_kg ?? 0)} كجم جليز شفاف)</h2>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex justify-between border-b border-line py-1 last:border-0">
                <span>{ing.material}</span>
                <span className="font-semibold">
                  {ing.batch_grams !== null ? formatGrams(ing.batch_grams) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canWrite && (
        <Link to={`/samples/new?recipe=${recipe.id}`} className="btn-primary w-full">
          + سجّل عينة بالتركيبة دي
        </Link>
      )}

      {isAdmin && (
        <div className="pt-2">
          <button
            type="button"
            className="btn-ghost w-full text-red-600"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`تحذف التركيبة "${recipe.name}" نهائيًا؟`)) remove.mutate()
            }}
          >
            حذف التركيبة
          </button>
          {remove.error && <div className="mt-2"><ErrorBox error={remove.error} /></div>}
        </div>
      )}
    </div>
  )
}
