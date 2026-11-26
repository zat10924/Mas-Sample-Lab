import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveRecipe, deleteRecipe, getRecipe, RecipeInUseError } from './api'
import AmountsTable from './AmountsTable'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, SectionTitle, Spinner } from '../../components/ui'
import PasswordConfirm from '../../components/PasswordConfirm'
import { Icon } from '../../components/Icon'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'
import { printDocument } from '../../lib/export'
import RecipePrint from './RecipePrint'
import { formatGrams, formatNumber, ingredientGrams, parseNumber } from '../../lib/units'

export default function RecipeDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canWrite, isAdmin } = useAuth()
  const [kgText, setKgText] = useState('1')
  const [askDelete, setAskDelete] = useState(false)
  const [inUse, setInUse] = useState(false)
  // base = وزن الجليز الشفاف | total = الوزن النهائي الكلي بعد إضافة كل المكونات
  const [mode, setMode] = useState<'base' | 'total'>('base')

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id),
    enabled: !!id,
  })

  async function afterRemoved() {
    await queryClient.invalidateQueries({ queryKey: ['recipes'] })
    navigate('/recipes', { replace: true })
  }

  // بعد التأكد من كلمة السر: لو التركيبة عليها عينات نعرض خيار الأرشفة بدل الحذف
  async function confirmDelete() {
    try {
      await deleteRecipe(id)
      setAskDelete(false)
      await afterRemoved()
    } catch (e) {
      if (e instanceof RecipeInUseError) {
        setAskDelete(false)
        setInUse(true)
        return
      }
      throw e
    }
  }

  const archive = useMutation({
    mutationFn: () => archiveRecipe(id),
    onSuccess: afterRemoved,
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
    <>
    <div className="space-y-4 print:hidden">
      <PageTitle
        icon="flask" title={recipe.name}
        subtitle={`${recipe.code} · ${RECIPE_TYPE_LABELS[recipe.type]}`}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => printDocument(`${recipe.code} - ${recipe.name} - ${formatNumber(entered, 3)} كجم`)}
              disabled={!(kg > 0)}
            >
              <Icon name="print" size={16} />
              PDF
            </button>
            {canWrite && (
              <Link to={`/recipes/${recipe.id}/edit`} className="btn-secondary">
                <Icon name="pencil" size={16} />
                تعديل
              </Link>
            )}
          </div>
        }
      />


      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="space-y-4 lg:col-span-2">
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
              <p className="flex items-center gap-2 text-sm text-mute">
                <Icon name="droplet" size={15} className="text-faint" />
                الكثافة: {formatNumber(recipe.density)} g/cm³
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {recipe.notes && (
            <div className="card flex items-start gap-2 text-sm text-mute">
              <Icon name="fileText" size={16} className="mt-0.5 shrink-0 text-faint" />
              <span className="min-w-0 whitespace-pre-wrap">{recipe.notes}</span>
            </div>
          )}
          {hasBatch && (
            <div className="card">
              <div className="mb-3">
                <SectionTitle icon="box">الخلطة الكبيرة ({formatNumber(recipe.batch_base_kg ?? 0)} كجم جليز شفاف)</SectionTitle>
              </div>
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
              <Icon name="plus" size={16} />
              سجّل عينة بالتركيبة دي
            </Link>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="border-t border-line pt-4">
          <button
            type="button"
            className="btn-ghost text-red-600"
            onClick={() => setAskDelete(true)}
          >
            <Icon name="trash" size={16} />
            حذف التركيبة
          </button>

          {inUse && (
            <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p>
                مش ممكن تحذف التركيبة لأن فيه عينات مسجلة عليها. تقدر تأرشفها: بتختفي من المكتبة
                والعينات القديمة تفضل محفوظة.
              </p>
              <button
                type="button"
                className="btn-secondary"
                disabled={archive.isPending}
                onClick={() => archive.mutate()}
              >
                {archive.isPending ? 'لحظة...' : 'أرشفة التركيبة'}
              </button>
              {archive.error && <ErrorBox error={archive.error} />}
            </div>
          )}
        </div>
      )}

      <PasswordConfirm
        open={askDelete}
        title="حذف التركيبة نهائيًا"
        message={`هتحذف "${recipe.name}" بكل مكوّناتها، ومش هتقدر ترجّعها.`}
        onConfirm={confirmDelete}
        onClose={() => setAskDelete(false)}
      />
    </div>
    <RecipePrint recipe={recipe} kg={kg} entered={entered} mode={mode} />
    </>
  )
}
