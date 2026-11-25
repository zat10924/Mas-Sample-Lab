import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from './api'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, PageTitle, Spinner, StatusBadge, STATUS_LABELS } from '../../components/ui'
import type { SampleStatus } from '../../types/db'

type Filter = 'all' | SampleStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'planned', label: STATUS_LABELS.planned },
  { value: 'fired', label: STATUS_LABELS.fired },
  { value: 'reviewed', label: STATUS_LABELS.reviewed },
]

export default function SamplesPage() {
  const { canWrite } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['samples'], queryFn: listSamples })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false
      if (!q) return true
      return (
        s.code.toLowerCase().includes(q) ||
        (s.recipe?.name ?? '').toLowerCase().includes(q) ||
        (s.recipe?.code ?? '').toLowerCase().includes(q) ||
        (s.body_type ?? '').toLowerCase().includes(q)
      )
    })
  }, [data, search, filter])

  return (
    <div>
      <PageTitle
        title="العينات"
        subtitle={data ? `${data.length} عينة` : undefined}
        action={
          canWrite ? (
            <Link to="/samples/new" className="btn-primary">
              + عينة
            </Link>
          ) : undefined
        }
      />

      <input
        className="input mb-3"
        placeholder="ابحث بكود العينة أو اسم التركيبة..."
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
      {!isLoading && !error && items.length === 0 && <Empty text="مفيش عينات لسه" />}

      <div className="space-y-2">
        {items.map((s) => {
          const finalCode = s.results.find((r) => r.final_code)?.final_code ?? null
          return (
            <Link key={s.id} to={`/samples/${s.id}`} className="card block active:bg-page">
              <div className="flex items-center justify-between gap-2">
                <span dir="ltr" className="font-bold text-ink">
                  {s.code}
                </span>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-1 truncate text-sm text-mute">
                {s.recipe ? `${s.recipe.name} (${s.recipe.code})` : 'بدون تركيبة'}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-faint">
                <span>{new Date(s.created_at).toLocaleDateString('en-GB')}</span>
                {s.firing_temp && <span>{s.firing_temp}°م</span>}
                {finalCode && (
                  <span dir="ltr" className="badge bg-brand-50 text-brand-800">
                    {finalCode}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
