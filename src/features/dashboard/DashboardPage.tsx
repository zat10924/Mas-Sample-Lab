import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { listSamples } from '../samples/api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, ListSkeleton, SectionTitle } from '../../components/ui'
import SampleCard from '../samples/SampleCard'
import { Icon, type IconName } from '../../components/Icon'
import { Bars } from '../../components/Bars'
import CountUp from '../../components/CountUp'
import { computeStats, finalCodeOf } from '../../lib/stats'
import { downloadCsv, printPage } from '../../lib/export'
import { formatComponent } from '../../lib/units'
import { STATUS_LABELS } from '../../components/ui'

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

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: string
  icon: IconName
}) {
  return (
    <div className="card flex items-center gap-3 !p-3.5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold leading-none tabular-nums text-ink">
          <CountUp value={value} />
        </div>
        <div className="mt-1 truncate text-xs font-medium text-mute">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { me, canWrite } = useAuth()
  const stats = useQuery({ queryKey: ['stats'], queryFn: loadStats })
  const samples = useQuery({ queryKey: ['samples'], queryFn: listSamples })
  const analytics = useMemo(() => (samples.data ? computeStats(samples.data) : null), [samples.data])

  function exportSamples() {
    const rows: (string | number | null)[][] = [
      ['كود العينة', 'التركيبة', 'كود التركيبة', 'المكونات', 'البدن', 'الكمية كجم', 'الحرارة', 'تاريخ الحرق', 'الحالة', 'النتيجة', 'تاريخ الإنشاء'],
      ...(samples.data ?? []).map((x) => [
        x.code,
        x.recipe?.name ?? '',
        x.recipe?.code ?? '',
        x.components.map((c) => `${c.material} ${formatComponent(c.amount, c.unit, x.batch_kg)}`).join(' + '),
        x.body_type,
        x.batch_kg,
        x.firing_temp,
        x.firing_date,
        STATUS_LABELS[x.status],
        finalCodeOf(x),
        x.created_at.slice(0, 10),
      ]),
    ]
    downloadCsv(`mas-samples-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div className="space-y-5">
      <div className="hero rounded-3xl p-5">
        <div className="relative z-10">
          <p className="text-sm text-white/70">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold">{`أهلًا ${me?.name || ''}`.trim()}</h1>
          <p className="mt-1 text-sm text-white/80">ملخص سريع للمعمل</p>
          {canWrite && (
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <Link to="/samples/new" className="btn bg-white text-brand-800 hover:bg-white/90">
                <Icon name="plus" size={16} />
                عينة جديدة
              </Link>
              <Link to="/recipes/new" className="btn bg-white/15 text-white hover:bg-white/25">
                <Icon name="plus" size={16} />
                تركيبة جديدة
              </Link>
              <Link to="/compare" className="btn bg-white/15 text-white hover:bg-white/25">
                <Icon name="compare" size={16} />
                مقارنة
              </Link>
            </div>
          )}
        </div>
      </div>

      {stats.isLoading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-busy="true" aria-label="تحميل">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}
      {stats.error && <ErrorBox error={stats.error} />}
      {stats.data && (
        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Stat label="تركيبة" value={stats.data.recipes} tone="bg-brand-50 text-brand-700" icon="flask" />
          <Stat label="عينة" value={stats.data.samples} tone="bg-sky-100 text-sky-700" icon="vase" />
          <Stat label="مخططة" value={stats.data.planned} tone="bg-tint text-mute" icon="clock" />
          <Stat label="محروقة (محتاجة تقييم)" value={stats.data.fired} tone="bg-amber-100 text-amber-700" icon="flame" />
        </div>
      )}

      {analytics && analytics.total > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle icon="barChart">التقارير والإحصائيات</SectionTitle>
            <div className="flex gap-2 print:hidden">
              <button type="button" className="btn-secondary !px-3 !py-2" onClick={exportSamples}>
                Excel
              </button>
              <button type="button" className="btn-secondary !px-3 !py-2" onClick={printPage}>
                PDF / طباعة
              </button>
            </div>
          </div>

          <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="card">
              <div className="text-3xl font-extrabold tabular-nums text-emerald-700">
                {analytics.cleanRate === null ? '—' : <CountUp value={analytics.cleanRate} suffix="%" />}
              </div>
              <div className="mt-1 text-sm text-mute">نسبة النجاح (بدون عيوب)</div>
              <div className="mt-0.5 text-xs text-faint">
                {analytics.clean} من {analytics.reviewed} عينة مقيّمة
              </div>
            </div>
            <div className="card">
              <div className="text-3xl font-extrabold tabular-nums">
                <CountUp value={analytics.reviewed} />
              </div>
              <div className="mt-1 text-sm text-mute">عينة تم تقييمها</div>
              <div className="mt-0.5 text-xs text-faint">من أصل {analytics.total}</div>
            </div>
            <div className="card col-span-2 lg:col-span-1">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="calendar" size={15} className="text-brand-700" />عينات آخر 6 شهور</div>
              <Bars items={analytics.months} />
            </div>
          </div>

          {analytics.reviewed > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="card">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="sparkles" size={15} className="text-brand-700" />اللمعة</div>
                <Bars items={analytics.finishes} />
              </div>
              <div className="card">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="palette" size={15} className="text-brand-700" />مطابقة اللون</div>
                <Bars items={analytics.colors} tone="bg-gold" />
              </div>
              <div className="card">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="alert" size={15} className="text-brand-700" />العيوب الأكثر تكرارًا</div>
                <Bars items={analytics.defects} tone="bg-red-500" />
              </div>
            </div>
          )}

          <div className="card">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Icon name="trending" size={15} className="text-brand-700" />أكتر التركيبات تجربة</div>
            <div className="divide-y divide-line">
              {analytics.topRecipes.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span dir="ltr" className="me-2 font-bold">
                      {r.key}
                    </span>
                    <span className="text-mute">{r.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-mute">
                    {r.total} عينة · {r.clean} ناجحة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle icon="clock">آخر العينات</SectionTitle>
          <Link to="/samples" className="text-sm font-semibold text-brand-700">
            عرض الكل
          </Link>
        </div>
        {samples.isLoading && <ListSkeleton count={3} />}
        {samples.error && <ErrorBox error={samples.error} />}
        {samples.data && samples.data.length === 0 && (
          <div className="card py-8 text-center text-sm text-mute">لسه مفيش عينات</div>
        )}
        <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(samples.data ?? []).slice(0, 6).map((s) => (
            <SampleCard key={s.id} sample={s} />
          ))}
        </div>
      </section>
    </div>
  )
}
