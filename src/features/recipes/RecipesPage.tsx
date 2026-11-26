import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes } from './api'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, ListSkeleton, PageTitle, SearchBox } from '../../components/ui'
import { Icon, type IconName } from '../../components/Icon'
import { RECIPE_BAR } from '../../lib/sampleView'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'

type Filter = 'all' | 'glaze_color' | 'matte_white' | 'other'
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

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = (data ?? []).filter((r) => {
      if (filter === 'glaze_color' && r.type !== 'glaze_color') return false
      if (filter === 'matte_white' && r.type !== 'matte' && r.type !== 'white') return false
      if (filter === 'other' && ['glaze_color', 'matte', 'white'].includes(r.type)) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.material.toLowerCase().includes(q))
      )
    })
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ar')
      if (sort === 'ingredients') return b.ingredients.length - a.ingredients.length
      return a.code.localeCompare(b.code)
    })
  }, [data, search, filter, sort])

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
                <div className="mt-0.5 text-sm text-mute">
                  {RECIPE_TYPE_LABELS[r.type]} · {r.ingredients.length} مكوّن
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
          </Link>
        ))}
      </div>
    </div>
  )
}
