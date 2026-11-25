import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listRecipes } from './api'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'

type Filter = 'all' | 'glaze_color' | 'matte_white'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'glaze_color', label: 'جليز ملوّن' },
  { value: 'matte_white', label: 'مط وأبيض' },
]

export default function RecipesPage() {
  const { canWrite } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['recipes'], queryFn: listRecipes })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((r) => {
      if (filter === 'glaze_color' && r.type !== 'glaze_color') return false
      if (filter === 'matte_white' && r.type !== 'matte' && r.type !== 'white') return false
      if (!q) return true
      return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    })
  }, [data, search, filter])

  return (
    <div>
      <PageTitle
        title="مكتبة التركيبات"
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

      <input
        className="input mb-3 lg:max-w-md"
        placeholder="ابحث بالاسم أو الكود..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === f.value ? 'bg-brand-700 text-white' : 'border border-line bg-surface text-mute'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox error={error} />}
      {!isLoading && !error && items.length === 0 && <Empty text="مفيش تركيبات مطابقة" />}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <Link
            key={r.id}
            to={`/recipes/${r.id}`}
            className="card-link flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{r.name}</div>
              <div className="mt-0.5 text-xs text-mute">
                {RECIPE_TYPE_LABELS[r.type]} · {r.ingredients.length} مكوّن
              </div>
            </div>
            <span dir="ltr" className="badge shrink-0 bg-brand-50 text-brand-800">
              {r.code}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
