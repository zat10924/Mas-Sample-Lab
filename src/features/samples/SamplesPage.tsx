import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from './api'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, ListSkeleton, PageTitle, SearchBox, StatusBadge, STATUS_LABELS } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import SampleCard from './SampleCard'
import { COLOR_OPTIONS, DEFECT_OPTIONS, FINISH_OPTIONS, parseResultCode } from '../../lib/codes'
import { finalCodeOf } from '../../lib/stats'
import { downloadCsv } from '../../lib/export'
import { formatComponent } from '../../lib/units'
import type { SampleStatus } from '../../types/db'

type Filter = 'all' | SampleStatus
type Sort = 'newest' | 'oldest' | 'temp_desc' | 'temp_asc' | 'code'

const FILTERS: { value: Filter; label: string; icon: IconName }[] = [
  { value: 'all', label: 'الكل', icon: 'grid' },
  { value: 'planned', label: STATUS_LABELS.planned, icon: 'clock' },
  { value: 'fired', label: STATUS_LABELS.fired, icon: 'flame' },
  { value: 'reviewed', label: STATUS_LABELS.reviewed, icon: 'checkCircle' },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'الأحدث أولًا' },
  { value: 'oldest', label: 'الأقدم أولًا' },
  { value: 'temp_desc', label: 'الحرارة: الأعلى' },
  { value: 'temp_asc', label: 'الحرارة: الأقل' },
  { value: 'code', label: 'الكود' },
]

interface Advanced {
  recipe: string
  finish: string
  color: string
  defect: string // '' = الكل، 'none' = بدون عيوب، أو حرف العيب
  from: string
  to: string
  tempMin: string
  tempMax: string
}

const EMPTY_ADV: Advanced = { recipe: '', finish: '', color: '', defect: '', from: '', to: '', tempMin: '', tempMax: '' }

export default function SamplesPage() {
  const { canWrite } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['samples'], queryFn: () => listSamples() })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [adv, setAdv] = useState<Advanced>(EMPTY_ADV)
  const [showAdv, setShowAdv] = useState(false)

  const setA = (patch: Partial<Advanced>) => setAdv((a) => ({ ...a, ...patch }))
  const activeCount = Object.values(adv).filter((v) => v !== '').length

  const recipeOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of data ?? []) if (s.recipe_id && s.recipe) map.set(s.recipe_id, `${s.recipe.code} — ${s.recipe.name}`)
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [data])

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    const tMin = adv.tempMin === '' ? null : Number(adv.tempMin)
    const tMax = adv.tempMax === '' ? null : Number(adv.tempMax)
    const list = (data ?? []).filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false
      if (adv.recipe && s.recipe_id !== adv.recipe) return false
      const day = (s.firing_date ?? s.created_at).slice(0, 10)
      if (adv.from && day < adv.from) return false
      if (adv.to && day > adv.to) return false
      if (tMin !== null && (s.firing_temp === null || s.firing_temp < tMin)) return false
      if (tMax !== null && (s.firing_temp === null || s.firing_temp > tMax)) return false
      if (adv.finish || adv.color || adv.defect) {
        const p = parseResultCode(finalCodeOf(s))
        if (!p) return false
        if (adv.finish && p.finish !== adv.finish) return false
        if (adv.color && String(p.color) !== adv.color) return false
        if (adv.defect === 'none' && p.defects.length > 0) return false
        if (adv.defect && adv.defect !== 'none' && !p.defects.includes(adv.defect)) return false
      }
      if (!q) return true
      return (
        s.code.toLowerCase().includes(q) ||
        (s.recipe?.name ?? '').toLowerCase().includes(q) ||
        (s.recipe?.code ?? '').toLowerCase().includes(q) ||
        (s.body_type ?? '').toLowerCase().includes(q) ||
        (s.application_method ?? '').toLowerCase().includes(q) ||
        (s.notes ?? '').toLowerCase().includes(q) ||
        s.components.some((c) => c.material.toLowerCase().includes(q))
      )
    })
    const byTemp = (a: number | null, b: number | null, dir: 1 | -1) =>
      a === null ? 1 : b === null ? -1 : (a - b) * dir
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.created_at.localeCompare(b.created_at)
        case 'temp_desc':
          return byTemp(a.firing_temp, b.firing_temp, -1)
        case 'temp_asc':
          return byTemp(a.firing_temp, b.firing_temp, 1)
        case 'code':
          return a.code.localeCompare(b.code)
        default:
          return b.created_at.localeCompare(a.created_at)
      }
    })
  }, [data, search, filter, adv, sort])

  function exportFiltered() {
    downloadCsv(`mas-samples-filtered-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['كود العينة', 'التركيبة', 'كود التركيبة', 'المكونات', 'البدن', 'الكمية كجم', 'الحرارة', 'تاريخ الحرق', 'الحالة', 'النتيجة'],
      ...items.map((s) => [
        s.code,
        s.recipe?.name ?? '',
        s.recipe?.code ?? '',
        s.components.map((c) => `${c.material} ${formatComponent(c.amount, c.unit, s.batch_kg)}`).join(' + '),
        s.body_type ?? '',
        s.batch_kg,
        s.firing_temp ?? '',
        s.firing_date ?? '',
        STATUS_LABELS[s.status],
        finalCodeOf(s) ?? '',
      ]),
    ])
  }

  return (
    <div>
      <PageTitle
        icon="vase" title="العينات"
        subtitle={data ? `${items.length} من ${data.length} عينة` : undefined}
        action={
          canWrite ? (
            <Link to="/samples/new" className="btn-primary">
              <Icon name="plus" size={16} />
              عينة
            </Link>
          ) : undefined
        }
      />

      <div className="mb-3 flex gap-2 lg:max-w-2xl">
        <SearchBox className="min-w-0 flex-1" placeholder="ابحث بالكود أو التركيبة أو مكوّن..." value={search} onChange={setSearch} />
        <button
          type="button"
          onClick={() => setShowAdv((v) => !v)}
          aria-expanded={showAdv}
          className={`btn relative shrink-0 border border-line ${showAdv ? 'bg-brand-50 text-brand-800' : 'bg-surface text-ink'}`}
        >
          <Icon name="filter" size={16} />
          فلاتر
          {activeCount > 0 && (
            <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1 text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {showAdv && (
        <div className="card mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="col-span-2">
              <label className="label">التركيبة</label>
              <select className="input" value={adv.recipe} onChange={(e) => setA({ recipe: e.target.value })}>
                <option value="">كل التركيبات</option>
                {recipeOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">اللمعة</label>
              <select className="input" value={adv.finish} onChange={(e) => setA({ finish: e.target.value })}>
                <option value="">الكل</option>
                {FINISH_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">اللون</label>
              <select className="input" value={adv.color} onChange={(e) => setA({ color: e.target.value })}>
                <option value="">الكل</option>
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={String(c.value)}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">العيوب</label>
              <select className="input" value={adv.defect} onChange={(e) => setA({ defect: e.target.value })}>
                <option value="">الكل</option>
                <option value="none">بدون عيوب</option>
                {DEFECT_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    فيها {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">من تاريخ</label>
              <input type="date" className="input" value={adv.from} onChange={(e) => setA({ from: e.target.value })} />
            </div>
            <div>
              <label className="label">إلى تاريخ</label>
              <input type="date" className="input" value={adv.to} onChange={(e) => setA({ to: e.target.value })} />
            </div>
            <div>
              <label className="label">حرارة من (°م)</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                value={adv.tempMin}
                onChange={(e) => setA({ tempMin: e.target.value })}
              />
            </div>
            <div>
              <label className="label">حرارة إلى (°م)</label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                value={adv.tempMax}
                onChange={(e) => setA({ tempMax: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost !px-3" onClick={() => setAdv(EMPTY_ADV)} disabled={activeCount === 0}>
              مسح الفلاتر
            </button>
            <span className="flex-1" />
            <select
              className="input !w-auto"
              aria-label="الترتيب"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === f.value ? 'bg-brand-700 text-white shadow-sm' : 'border border-line bg-surface text-mute hover:bg-tint'
              }`}
            >
              <Icon name={f.icon} size={15} />
              {f.label}
            </button>
          ))}
        </div>
        <Link to="/compare?type=samples" className="btn-ghost shrink-0 !px-3" aria-label="مقارنة عينات">
          <Icon name="compare" size={16} />
        </Link>
        <button
          type="button"
          className="btn-ghost shrink-0 !px-3"
          onClick={exportFiltered}
          disabled={items.length === 0}
          aria-label="تصدير Excel"
        >
          <Icon name="download" size={16} />
        </button>
      </div>

      {isLoading && <ListSkeleton />}
      {error && <ErrorBox error={error} />}
      {!isLoading && !error && items.length === 0 && (
        <Empty text={data && data.length > 0 ? 'مفيش عينات مطابقة للفلاتر' : 'مفيش عينات لسه'} />
      )}

      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <SampleCard key={s.id} sample={s} />
        ))}
      </div>
    </div>
  )
}
