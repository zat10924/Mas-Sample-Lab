import { COLOR_OPTIONS, DEFECT_OPTIONS, FINISH_OPTIONS } from './codes'
import { MONTHS_AR, type Count, type LabStats } from './stats'

/** شكل الرد من دالة lab_dashboard_stats في Supabase (migration 006) */
export interface RemoteStats {
  recipes: number
  samples: number
  planned: number
  fired: number
  reviewed_status: number
  reviewed: number
  clean: number
  finishes: Record<string, number>
  colors: Record<string, number>
  defects: Record<string, number>
  months: { year: number; month: number; count: number }[]
  topRecipes: { key: string; label: string; total: number; clean: number }[]
}

export interface DashboardTotals {
  recipes: number
  samples: number
  planned: number
  fired: number
  reviewed: number
}

export interface DashboardData {
  totals: DashboardTotals
  analytics: LabStats
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function toCounts(options: { value: string | number; label: string }[], map: Record<string, number> | null | undefined): Count[] {
  return options.map((o) => ({ key: String(o.value), label: o.label, count: num(map?.[String(o.value)]) }))
}

/** يحوّل رد قاعدة البيانات لنفس الشكل اللي بيستخدمه باقي البرنامج (LabStats) */
export function fromRemote(r: RemoteStats): DashboardData {
  const reviewed = num(r.reviewed)
  const clean = num(r.clean)
  return {
    totals: {
      recipes: num(r.recipes),
      samples: num(r.samples),
      planned: num(r.planned),
      fired: num(r.fired),
      reviewed: num(r.reviewed_status),
    },
    analytics: {
      total: num(r.samples),
      reviewed,
      clean,
      cleanRate: reviewed > 0 ? Math.round((clean / reviewed) * 100) : null,
      finishes: toCounts(FINISH_OPTIONS, r.finishes),
      colors: toCounts(COLOR_OPTIONS, r.colors),
      defects: toCounts(
        DEFECT_OPTIONS.map((d) => ({ value: d.value, label: d.label.split(' ')[0] })),
        r.defects,
      ),
      months: (r.months ?? []).map((m) => ({
        key: `${num(m.year)}-${num(m.month)}`,
        label: MONTHS_AR[num(m.month)] ?? '',
        count: num(m.count),
      })),
      topRecipes: (r.topRecipes ?? []).map((t) => ({
        key: String(t.key),
        label: String(t.label),
        total: num(t.total),
        clean: num(t.clean),
      })),
    },
  }
}
