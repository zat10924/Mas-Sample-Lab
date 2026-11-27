import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes } from './api'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, ListSkeleton, PageTitle, SearchBox } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { RECIPE_BAR, sampleTone } from '../../lib/sampleView'
import { listSamples } from '../samples/api'
import Sheet from '../../components/Sheet'
import { useCollections, useFavorites } from '../../lib/shared'
import { finalCodeOf } from '../../lib/stats'
import { parseResultCode } from '../../lib/codes'
import type { SampleListItem } from '../../types/db'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'

type Filter = 'all' | 'glaze_color' | 'matte_white' | 'other' | 'fav' | `col:${string}`
type Sort = 'code' | 'name' | 'ingredients'

const FILTERS: { value: Filter; label: string; icon: IconName }[] = [
  { value: 'all', label: 'الكل', icon: 'grid' },
  { value: 'glaze_color', label: 'جليز ملوّن', icon: 'palette' },
  { value: 'matte_white', label: 'مط وأبيض', icon: 'droplet' },
  { value: 'other', label: 'أخرى', icon: 'box' },
]

const SORTS: { value: Sort; label: string }[] = [
  { value: 'code', label: 'الكود' },
  { value: 'name', label: 'الاسم' },
  { value: 'ingredients', label: 'عدد المكونات' },
]

export default function RecipesPage() {
  const { canWrite } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['recipes'], queryFn: listRecipes })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('code')
  const favorites = useFavorites()
  const collections = useCollections()
  const [collFor, setCollFor] = useState<string | null>(null)
  const [collName, setCollName] = useState('')
  const samples = useQuery({ queryKey: ['samples'], queryFn: () => listSamples() })

  // نتائج العينات لكل تركيبة (رقائق النتائج + نسبة النجاح)
  const byRecipe = useMemo(() => {
    const m = new Map<string, SampleListItem[]>()
    for (const s of samples.data ?? []) {
      if (s.recipe_id) m.set(s.recipe_id, [...(m.get(s.recipe_id) ?? []), s])
    }
    return m
  }, [samples.data])

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = (data ?? []).filter((r) => {
      if (filter === 'glaze_color' && r.type !== 'glaze_color') return false
      if (filter === 'matte_white' && r.type !== 'matte' && r.type !== 'white') return false
      if (filter === 'other' && ['glaze_color', 'matte', 'white'].includes(r.type)) return false
      if (filter === 'fav' && !favorites.has(r.id)) return false
      if (filter.startsWith('col:') && collections.map[r.id] !== filter.slice(4)) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.material.toLowerCase().includes(q))
      )
    })
    const sorted = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ar')
      if (sort === 'ingredients') return b.ingredients.length - a.ingredients.length
      return a.code.localeCompare(b.code)
    })
    // المفضّلة في أول القائمة
    return [...sorted.filter((r) => favorites.has(r.id)), ...sorted.filter((r) => !favorites.has(r.id))]
  }, [data, search, filter, sort, favorites.ids, collections.map]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageTitle
        icon="flask" title="مكتبة التركيبات"
        subtitle={data ? `${data.length} تركيبة` : undefined}
        action={
          canWrite ? (
            <Link to="/recipes/new" className="btn-primary">
              <Icon name="plus" size={16} />
              تركيبة
            </Link>
          ) : undefined
        }
      />

      <SearchBox className="mb-3 lg:max-w-md" placeholder="ابحث بالاسم أو الكود أو اسم خامة..." value={search} onChange={setSearch} />

      <div className="mb-4 flex items-center gap-2">
       <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.value ? 'bg-brand-700 text-white' : 'border border-line bg-surface text-mute'
            }`}
          >
            <Icon name={f.icon} size={15} />
            {f.label}
          </button>
        ))}
        {favorites.ids.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter('fav')}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === 'fav' ? 'bg-gold text-white' : 'border border-gold bg-surface text-brand-800'
            }`}
          >
            <Icon name="star" size={15} />
            المفضلة
          </button>
        )}
        {collections.names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFilter(`col:${n}`)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === `col:${n}` ? 'bg-brand-700 text-white' : 'border border-line bg-surface text-mute'
            }`}
          >
            <Icon name="tag" size={15} />
            {n}
          </button>
        ))}
       </div>
        <select
          className="input !w-auto shrink-0 !py-2 text-sm"
          aria-label="الترتيب"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
        >
          {SORTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Link to="/compare?type=recipes" className="btn-ghost shrink-0 !px-3" aria-label="مقارنة تركيبات">
          <Icon name="compare" size={16} />
        </Link>
      </div>

      {isLoading && <ListSkeleton />}
      {error && <ErrorBox error={error} />}
      {!isLoading && !error && items.length === 0 && <Empty text="مفيش تركيبات مطابقة" />}

      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <Link key={r.id} to={`/recipes/${r.id}`} className="pro-card">
            <span className={`absolute inset-y-0 start-0 w-1.5 ${RECIPE_BAR[r.type]}`} aria-hidden="true" />
            <div className="flex items-start gap-3">
              <div className="avatar bg-brand-50 text-brand-800" aria-hidden="true">
                <Icon name="flask" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-base font-extrabold text-ink">{r.name}</span>
                  <span dir="ltr" className="badge shrink-0 bg-brand-50 text-brand-800">
                    {r.code}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-sm text-mute">
                  <span className="min-w-0 truncate">
                    {RECIPE_TYPE_LABELS[r.type]} · {r.ingredients.length} مكوّن
                    {collections.map[r.id] ? ` · ${collections.map[r.id]}` : ''}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label="مجموعة"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCollName(collections.map[r.id] ?? '')
                        setCollFor(r.id)
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-tint hover:text-ink"
                    >
                      <Icon name="tag" size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={favorites.has(r.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                      aria-pressed={favorites.has(r.id)}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        favorites.toggle(r.id)
                      }}
                      className={`grid h-8 w-8 place-items-center rounded-lg hover:bg-tint ${favorites.has(r.id) ? 'text-gold' : 'text-faint'}`}
                    >
                      <Icon name="star" size={16} fill={favorites.has(r.id) ? 'currentColor' : 'none'} />
                    </button>
                  </span>
                </div>
              </div>
            </div>
            {r.ingredients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                {r.ingredients.slice(0, 4).map((i) => (
                  <span key={i.id} className="chip">
                    {i.material}
                  </span>
                ))}
                {r.ingredients.length > 4 && <span className="chip chip-more">+{r.ingredients.length - 4}</span>}
              </div>
            )}
            <ResultStrip list={byRecipe.get(r.id)} />
          </Link>
        ))}
      </div>

      <Sheet open={collFor !== null} onClose={() => setCollFor(null)} title="مجموعة التركيبة">
        <div className="space-y-3">
          <input
            className="input"
            placeholder="اسم المجموعة (مثال: سلسلة الأزرق)"
            value={collName}
            onChange={(e) => setCollName(e.target.value)}
            maxLength={40}
          />
          {collections.names.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {collections.names.map((n) => (
                <button key={n} type="button" onClick={() => setCollName(n)} className="chip !px-3 !py-1.5 text-sm">
                  {n}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => {
                if (collFor) collections.set(collFor, collName)
                setCollFor(null)
              }}
            >
              حفظ
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (collFor) collections.set(collFor, '')
                setCollFor(null)
              }}
            >
              إزالة من المجموعة
            </button>
          </div>
          <p className="text-xs text-faint">المفضلة والمجموعات بتتحفظ على الجهاز ده بس.</p>
        </div>
      </Sheet>
    </div>
  )
}

/** رقائق نتائج آخر العينات للتركيبة + نسبة النجاح */
function ResultStrip({ list }: { list: SampleListItem[] | undefined }) {
  if (!list || list.length === 0) return null
  const recent = list.slice(0, 8)
  const reviewed = list.filter((s) => parseResultCode(finalCodeOf(s)))
  const clean = reviewed.filter((s) => (parseResultCode(finalCodeOf(s))?.defects.length ?? 1) === 0).length
  return (
    <div className="mt-2.5 flex items-center gap-1.5">
      {recent.map((s) => {
        const t = sampleTone(s)
        return (
          <span key={s.id} className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-extrabold ${t.chip}`} title={s.code}>
            {t.letter ?? '·'}
          </span>
        )
      })}
      <span className="ms-auto text-[11px] text-faint">
        {list.length} عينة{reviewed.length > 0 ? ` · ${Math.round((clean / reviewed.length) * 100)}% نظيفة` : ''}
      </span>
    </div>
  )
}
