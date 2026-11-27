import CompareSlider from '../../components/CompareSlider'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes, getRecipe } from '../recipes/api'
import { getSignedUrl, getSample, listComponents, listResults, listSamples } from '../samples/api'
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { RECIPE_TYPE_LABELS, describeResultCode } from '../../lib/codes'
import { formatNumber, ingredientGrams, formatComponent } from '../../lib/units'
import type { RecipeWithIngredients, SampleDetail, SampleResult } from '../../types/db'

type Kind = 'recipes' | 'samples'

function Tabs({ kind, onChange }: { kind: Kind; onChange: (k: Kind) => void }) {
  const tabs: { value: Kind; label: string; icon: IconName }[] = [
    { value: 'recipes', label: 'تركيبات', icon: 'flask' },
    { value: 'samples', label: 'عينات', icon: 'vase' },
  ]
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-tint p-1 lg:max-w-xs">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-colors ${kind === t.value ? 'bg-surface text-brand-800 shadow-sm' : 'text-mute'}`}
        >
          <Icon name={t.icon} size={16} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="min-w-0">
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">اختر...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ---------------- مقارنة التركيبات ---------------- */

function RecipeCompare({ a, b }: { a: RecipeWithIngredients; b: RecipeWithIngredients }) {
  // نوحّد الكميات على "جرام لكل 1 كجم جليز" عشان المقارنة تبقى عادلة حتى لو الأساس مختلف
  const norm = (r: RecipeWithIngredients) => {
    const m = new Map<string, number>()
    for (const i of r.ingredients) m.set(i.material, (m.get(i.material) ?? 0) + ingredientGrams(i.amount, r.basis, 1))
    return m
  }
  const ma = norm(a)
  const mb = norm(b)
  const materials = [...new Set([...ma.keys(), ...mb.keys()])]
  const totalA = [...ma.values()].reduce((x, y) => x + y, 0)
  const totalB = [...mb.values()].reduce((x, y) => x + y, 0)

  const rows = materials.map((m) => {
    const x = ma.get(m) ?? null
    const y = mb.get(m) ?? null
    const diff = (y ?? 0) - (x ?? 0)
    return { m, x, y, diff, same: x !== null && y !== null && Math.abs(diff) < 0.005 }
  })

  const fmt = (v: number | null) => (v === null ? '—' : formatNumber(v))
  return (
    <div className="space-y-3">
      <div className="card text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <div className="font-bold" dir="ltr">{a.code}</div>
          <div className="font-bold" dir="ltr">{b.code}</div>
          <div className="text-mute">الاسم</div>
          <div>{a.name}</div>
          <div>{b.name}</div>
          <div className="text-mute">النوع</div>
          <div>{RECIPE_TYPE_LABELS[a.type]}</div>
          <div>{RECIPE_TYPE_LABELS[b.type]}</div>
          <div className="text-mute">الكثافة</div>
          <div>{a.density ?? '—'}</div>
          <div>{b.density ?? '—'}</div>
          <div className="text-mute">عدد المكونات</div>
          <div>{a.ingredients.length}</div>
          <div>{b.ingredients.length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-page text-mute">
            <tr>
              <th className="px-3 py-2 text-start font-semibold">الخامة (جم / كجم جليز)</th>
              <th className="px-3 py-2 text-end font-semibold" dir="ltr">{a.code}</th>
              <th className="px-3 py-2 text-end font-semibold" dir="ltr">{b.code}</th>
              <th className="px-3 py-2 text-end font-semibold">الفرق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.m} className={r.same ? '' : 'row-diff'}>
                <td className="px-3 py-2">{r.m}</td>
                <td className="px-3 py-2 text-end tabular-nums">{fmt(r.x)}</td>
                <td className="px-3 py-2 text-end tabular-nums">{fmt(r.y)}</td>
                <td className="px-3 py-2 text-end text-xs font-bold tabular-nums" dir="ltr">
                  {r.x === null ? 'جديدة' : r.y === null ? 'محذوفة' : r.same ? '=' : `${r.diff > 0 ? '+' : ''}${formatNumber(r.diff)}`}
                </td>
              </tr>
            ))}
            <tr className="bg-page font-bold">
              <td className="px-3 py-2">الإجمالي المضاف</td>
              <td className="px-3 py-2 text-end tabular-nums">{formatNumber(totalA)}</td>
              <td className="px-3 py-2 text-end tabular-nums">{formatNumber(totalB)}</td>
              <td className="px-3 py-2 text-end tabular-nums" dir="ltr">
                {totalB - totalA > 0 ? '+' : ''}
                {formatNumber(totalB - totalA)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-faint">الصفوف المظللة = فيها اختلاف بين التركيبتين.</p>
    </div>
  )
}

/* ---------------- مقارنة العينات ---------------- */

function ResultImage({ result }: { result: SampleResult | undefined }) {
  const url = useQuery({
    queryKey: ['signed-url', result?.image_path],
    queryFn: () => getSignedUrl(result!.image_path),
    enabled: !!result,
    staleTime: 30 * 60 * 1000,
  })
  if (!result) return <div className="grid h-40 place-items-center rounded-xl bg-tint text-xs text-faint">لا توجد صورة</div>
  if (url.isLoading) return <div className="skeleton h-40" />
  if (!url.data) return <div className="grid h-40 place-items-center rounded-xl bg-tint text-xs text-faint">تعذر تحميل الصورة</div>
  return <img src={url.data} alt="نتيجة العينة" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
}

function SampleCompare({ a, b }: { a: SampleDetail; b: SampleDetail }) {
  const ra = useQuery({ queryKey: ['results', a.id], queryFn: () => listResults(a.id) })
  const rb = useQuery({ queryKey: ['results', b.id], queryFn: () => listResults(b.id) })
  const pick = (r: SampleResult[] | undefined) => r?.find((x) => x.final_code) ?? r?.[0]
  const ca = useQuery({ queryKey: ['components', a.id], queryFn: () => listComponents(a.id) })
  const cb = useQuery({ queryKey: ['components', b.id], queryFn: () => listComponents(b.id) })
  const resA = pick(ra.data)
  const resB = pick(rb.data)

  const rows: { label: string; x: string; y: string }[] = [
    { label: 'التركيبة', x: a.recipe ? `${a.recipe.name} (${a.recipe.code})` : '—', y: b.recipe ? `${b.recipe.name} (${b.recipe.code})` : '—' },
    { label: 'البدن', x: a.body_type ?? '—', y: b.body_type ?? '—' },
    { label: 'الكمية (كجم)', x: String(a.batch_kg), y: String(b.batch_kg) },
    { label: 'حرارة الحرق', x: a.firing_temp ? `${a.firing_temp}°م` : '—', y: b.firing_temp ? `${b.firing_temp}°م` : '—' },
    { label: 'تاريخ الحرق', x: a.firing_date ?? '—', y: b.firing_date ?? '—' },
    { label: 'طريقة التطبيق', x: a.application_method ?? '—', y: b.application_method ?? '—' },
    { label: 'النتيجة', x: resA?.final_code ?? '—', y: resB?.final_code ?? '—' },
    { label: 'التفسير', x: describeResultCode(resA?.final_code ?? null) ?? '—', y: describeResultCode(resB?.final_code ?? null) ?? '—' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <ResultImage result={resA} />
          <div className="flex items-center justify-between">
            <Link to={`/samples/${a.id}`} dir="ltr" className="text-sm font-bold text-brand-700">{a.code}</Link>
            <StatusBadge status={a.status} />
          </div>
        </div>
        <div className="space-y-1">
          <ResultImage result={resB} />
          <div className="flex items-center justify-between">
            <Link to={`/samples/${b.id}`} dir="ltr" className="text-sm font-bold text-brand-700">{b.code}</Link>
            <StatusBadge status={b.status} />
          </div>
        </div>
      </div>

      {resA && resB && <CompareSlider pathA={resA.image_path} pathB={resB.image_path} labelA={a.code} labelB={b.code} />}

      {((ca.data?.length ?? 0) > 0 || (cb.data?.length ?? 0) > 0) && (
        <div className="card divide-y divide-line !p-0">
          <div className="px-3 py-2 text-sm font-bold">المكونات</div>
          {[...new Set([...(ca.data ?? []).map((c) => c.material), ...(cb.data ?? []).map((c) => c.material)])].map((m) => {
            const x = (ca.data ?? []).find((c) => c.material === m)
            const y = (cb.data ?? []).find((c) => c.material === m)
            const tx = x ? formatComponent(x.amount, x.unit) : '—'
            const ty = y ? formatComponent(y.amount, y.unit) : '—'
            return (
              <div key={m} className={`grid grid-cols-[5.5rem_1fr_1fr] gap-2 px-3 py-2 text-sm ${tx !== ty ? 'row-diff' : ''}`}>
                <div className="min-w-0 break-words text-mute">{m}</div>
                <div>{tx}</div>
                <div>{ty}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card divide-y divide-line !p-0">
        {rows.map((r) => (
          <div key={r.label} className={`grid grid-cols-[5.5rem_1fr_1fr] gap-2 px-3 py-2 text-sm ${r.x !== r.y ? 'row-diff' : ''}`}>
            <div className="text-mute">{r.label}</div>
            <div className="min-w-0 break-words">{r.x}</div>
            <div className="min-w-0 break-words">{r.y}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint">الصفوف المظللة = فيها اختلاف بين العينتين.</p>
    </div>
  )
}

/* ---------------- الصفحة ---------------- */

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const kind: Kind = params.get('type') === 'samples' ? 'samples' : 'recipes'
  const a = params.get('a') ?? ''
  const b = params.get('b') ?? ''

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k))
    setParams(next, { replace: true })
  }

  const recipes = useQuery({ queryKey: ['recipes'], queryFn: listRecipes, enabled: kind === 'recipes' })
  const samples = useQuery({ queryKey: ['samples'], queryFn: () => listSamples(), enabled: kind === 'samples' })

  const options =
    kind === 'recipes'
      ? (recipes.data ?? []).map((r) => ({ id: r.id, label: `${r.code} — ${r.name}` }))
      : (samples.data ?? []).map((s) => ({ id: s.id, label: `${s.code}${s.recipe ? ` — ${s.recipe.name}` : ''}` }))

  const ready = !!a && !!b && a !== b
  const detailA = useQuery({
    queryKey: [kind === 'recipes' ? 'recipe' : 'sample', a],
    queryFn: async (): Promise<RecipeWithIngredients | SampleDetail> =>
      kind === 'recipes' ? await getRecipe(a) : await getSample(a),
    enabled: ready,
  })
  const detailB = useQuery({
    queryKey: [kind === 'recipes' ? 'recipe' : 'sample', b],
    queryFn: async (): Promise<RecipeWithIngredients | SampleDetail> =>
      kind === 'recipes' ? await getRecipe(b) : await getSample(b),
    enabled: ready,
  })

  const listLoading = kind === 'recipes' ? recipes.isLoading : samples.isLoading
  const listError = kind === 'recipes' ? recipes.error : samples.error

  return (
    <div>
      <PageTitle icon="compare" title="المقارنة" subtitle="قارن عنصرين جنب بعض وشوف الفروق" />
      <Tabs kind={kind} onChange={(k) => update({ type: k, a: '', b: '' })} />

      {listLoading && <Spinner compact />}
      {listError && <ErrorBox error={listError} />}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:max-w-2xl">
        <Picker label="الأول" value={a} onChange={(v) => update({ a: v })} options={options} />
        <Picker label="الثاني" value={b} onChange={(v) => update({ b: v })} options={options} />
      </div>

      {a && b && a === b && <ErrorBox error="اختر عنصرين مختلفين" />}
      {!ready && !(a && b && a === b) && (
        <div className="card py-8 text-center text-sm text-mute">اختر عنصرين لعرض المقارنة</div>
      )}
      {ready && (detailA.isLoading || detailB.isLoading) && <Spinner compact />}
      {(detailA.error || detailB.error) && <ErrorBox error={detailA.error ?? detailB.error} />}
      {ready && detailA.data && detailB.data && kind === 'recipes' && (
        <RecipeCompare a={detailA.data as RecipeWithIngredients} b={detailB.data as RecipeWithIngredients} />
      )}
      {ready && detailA.data && detailB.data && kind === 'samples' && (
        <SampleCompare a={detailA.data as SampleDetail} b={detailB.data as SampleDetail} />
      )}
    </div>
  )
}
