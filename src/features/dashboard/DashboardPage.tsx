import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listSamples } from '../samples/api'
import { loadDashboard } from './api'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, ListSkeleton, SectionTitle, STATUS_LABELS, errorMessage } from '../../components/ui'
import SampleCard from '../samples/SampleCard'
import { Icon, type IconName } from '../../components/Icon'
import { Bars } from '../../components/Bars'
import CountUp from '../../components/CountUp'
import { useToast } from '../../components/Toast'
import { finalCodeOf } from '../../lib/stats'
import { downloadCsv, printDocument } from '../../lib/export'
import { formatComponent } from '../../lib/units'
import DashboardPrint from './DashboardPrint'
import ActivityTimeline from './ActivityTimeline'
import type { SampleListItem } from '../../types/db'

/** عدد الأيام اللي بعدها العينة المحروقة تعتبر متأخرة في التقييم */
const OVERDUE_DAYS = 3
const DAY_MS = 86_400_000

function sampleDate(s: SampleListItem): number {
  return new Date(s.firing_date ?? s.created_at).getTime()
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
    <div className="card stat-card flex items-center gap-3 !p-3.5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <div className="stat-num text-2xl font-extrabold leading-none tabular-nums">
          <CountUp value={value} />
        </div>
        <div className="mt-1 truncate text-xs font-medium text-mute">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { me, canWrite } = useAuth()
  const { toast } = useToast()
  // الأرقام والإحصائيات بتتحسب في قاعدة البيانات (migration 006)، واللوحة بتحمّل آخر العينات بس
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: loadDashboard, refetchOnMount: 'always' })
  const recent = useQuery({ queryKey: ['samples', 'recent', 15], queryFn: () => listSamples({ limit: 15 }) })
  const fired = useQuery({ queryKey: ['samples', 'fired'], queryFn: () => listSamples({ status: 'fired' }) })

  const totals = dash.data?.totals
  const analytics = dash.data?.analytics ?? null

  const overdue = useMemo(() => {
    const limit = Date.now() - OVERDUE_DAYS * DAY_MS
    return (fired.data ?? [])
      .filter((s) => !finalCodeOf(s) && sampleDate(s) < limit)
      .sort((a, b) => sampleDate(a) - sampleDate(b))
  }, [fired.data])

  async function exportSamples() {
    try {
      const all = await listSamples()
      const rows: (string | number | null)[][] = [
        ['كود العينة', 'التركيبة', 'كود التركيبة', 'المكونات', 'البدن', 'الكمية كجم', 'الحرارة', 'تاريخ الحرق', 'الحالة', 'النتيجة', 'تاريخ الإنشاء'],
        ...all.map((x) => [
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
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  function printReport() {
    printDocument(`تقرير-مختبر-الماس-${new Date().toISOString().slice(0, 10)}`)
  }

  return (
    <>
    <div className="space-y-5 print:hidden">
      <div className="hero rounded-3xl p-4 sm:p-5">
        <div className="relative z-10">
          <p className="text-sm text-white/70">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-0.5 text-xl font-extrabold sm:text-2xl">{`أهلًا ${me?.name || ''}`.trim()}</h1>
          <p className="mt-1 hidden text-sm text-white/80 sm:block">ملخص سريع للمعمل</p>
          {canWrite && (
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <Link to="/samples/new" className="btn !px-3.5 !py-2 text-sm bg-white text-brand-800 hover:bg-white/90">
                <Icon name="plus" size={16} />
                عينة جديدة
              </Link>
              <Link to="/recipes/new" className="btn !px-3.5 !py-2 text-sm bg-white/15 text-white hover:bg-white/25">
                <Icon name="plus" size={16} />
                تركيبة جديدة
              </Link>
              <Link to="/compare" className="btn !px-3.5 !py-2 text-sm bg-white/15 text-white hover:bg-white/25">
                <Icon name="compare" size={16} />
                مقارنة
              </Link>
            </div>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Icon name="alert" size={18} className="shrink-0 text-amber-700" />
            {overdue.length} عينة مستنية التقييم من أكتر من {OVERDUE_DAYS} أيام
          </div>
          <ul className="mt-1.5 divide-y divide-amber-200">
            {overdue.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link to={`/samples/${s.id}`} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span dir="ltr" className="font-bold">
                    {s.code}
                  </span>
                  <span className="text-xs font-semibold text-amber-800">
                    من {Math.floor((Date.now() - sampleDate(s)) / DAY_MS)} يوم · قيّمها
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {overdue.length > 3 && (
            <Link to="/samples" className="mt-1 inline-block text-xs font-bold underline">
              عرض الباقي ({overdue.length - 3})
            </Link>
          )}
        </section>
      )}

      {dash.isLoading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-busy="true" aria-label="تحميل">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}
      {dash.error && <ErrorBox error={dash.error} />}
      {totals && (
        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Stat label="تركيبة" value={totals.recipes} tone="bg-brand-50 text-brand-700" icon="flask" />
          <Stat label="عينة" value={totals.samples} tone="bg-sky-100 text-sky-700" icon="vase" />
          <Stat label="مخططة" value={totals.planned} tone="bg-tint text-mute" icon="clock" />
          <Stat label="محروقة (محتاجة تقييم)" value={totals.fired} tone="bg-amber-100 text-amber-700" icon="flame" />
        </div>
      )}

      <ActivityTimeline />

      {analytics && analytics.total > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SectionTitle icon="barChart">التقارير والإحصائيات</SectionTitle>
            <div className="flex gap-2 print:hidden">
              <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => void exportSamples()}>
                Excel
              </button>
              <button type="button" className="btn-secondary !px-3 !py-2" onClick={printReport}>
                PDF / طباعة
              </button>
            </div>
          </div>

          <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-3">
            {analytics.reviewed > 0 ? (
              <>
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
              </>
            ) : (
              <div className="card col-span-2 flex items-start gap-3 lg:col-span-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon name="camera" size={20} />
                </span>
                <div>
                  <div className="text-sm font-bold">لسه مفيش عينة متقيّمة</div>
                  <div className="mt-0.5 text-xs text-mute">
                    صوّر العينة بعد الحرق وقيّمها، وهتظهر هنا نسبة النجاح وأكتر العيوب تكرارًا.
                  </div>
                </div>
              </div>
            )}
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
        {recent.isLoading && <ListSkeleton count={3} />}
        {recent.error && <ErrorBox error={recent.error} />}
        {recent.data && recent.data.length === 0 && (
          <div className="card py-8 text-center text-sm text-mute">لسه مفيش عينات</div>
        )}
        <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(recent.data ?? []).slice(0, 6).map((s) => (
            <SampleCard key={s.id} sample={s} />
          ))}
        </div>
      </section>
    </div>

    {analytics && analytics.total > 0 && recent.data && (
      <DashboardPrint totals={totals} analytics={analytics} samples={recent.data} />
    )}
    </>
  )
}
