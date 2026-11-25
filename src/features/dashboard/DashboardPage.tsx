import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { listSamples } from '../samples/api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '../../components/ui'

async function countRows(table: 'lab_recipes' | 'lab_samples', status?: string): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (status) query = query.eq('status', status)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function loadStats() {
  const [recipes, samples, planned, fired, reviewed] = await Promise.all([
    countRows('lab_recipes'),
    countRows('lab_samples'),
    countRows('lab_samples', 'planned'),
    countRows('lab_samples', 'fired'),
    countRows('lab_samples', 'reviewed'),
  ])
  return { recipes, samples, planned, fired, reviewed }
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm font-medium opacity-80">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { me, canWrite } = useAuth()
  const stats = useQuery({ queryKey: ['stats'], queryFn: loadStats })
  const samples = useQuery({ queryKey: ['samples'], queryFn: listSamples })

  return (
    <div className="space-y-5">
      <PageTitle
        title={`أهلًا ${me?.name || ''}`.trim()}
        subtitle="ملخص سريع للمعمل"
      />

      {stats.isLoading && <Spinner />}
      {stats.error && <ErrorBox error={stats.error} />}
      {stats.data && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="تركيبة" value={stats.data.recipes} tone="bg-brand-50 text-brand-900" />
          <Stat label="عينة" value={stats.data.samples} tone="bg-sky-50 text-sky-900" />
          <Stat label="مخططة" value={stats.data.planned} tone="bg-tint text-ink" />
          <Stat label="محروقة (محتاجة تقييم)" value={stats.data.fired} tone="bg-amber-50 text-amber-900" />
        </div>
      )}

      {canWrite && (
        <div className="grid grid-cols-2 gap-3">
          <Link to="/samples/new" className="btn-primary">
            + عينة جديدة
          </Link>
          <Link to="/recipes/new" className="btn-secondary">
            + تركيبة جديدة
          </Link>
        </div>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">آخر العينات</h2>
          <Link to="/samples" className="text-sm font-semibold text-brand-700">
            عرض الكل
          </Link>
        </div>
        {samples.isLoading && <Spinner />}
        {samples.error && <ErrorBox error={samples.error} />}
        {samples.data && samples.data.length === 0 && (
          <div className="card py-8 text-center text-sm text-mute">لسه مفيش عينات</div>
        )}
        <div className="space-y-2">
          {(samples.data ?? []).slice(0, 5).map((s) => (
            <Link key={s.id} to={`/samples/${s.id}`} className="card flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div dir="ltr" className="text-start font-bold">
                  {s.code}
                </div>
                <div className="truncate text-sm text-mute">{s.recipe?.name ?? 'بدون تركيبة'}</div>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
