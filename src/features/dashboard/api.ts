import { supabase } from '../../lib/supabase'
import { listSamples } from '../samples/api'
import { computeStats } from '../../lib/stats'
import { fromRemote, type DashboardData, type DashboardTotals, type RemoteStats } from '../../lib/statsRemote'

async function countRows(table: 'lab_recipes' | 'lab_samples', status?: string): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  if (status) query = query.eq('status', status)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

/** الطريقة القديمة: عدّادات + تحميل كل العينات وحساب الإحصائيات في المتصفح */
async function loadLegacy(): Promise<DashboardData> {
  const [recipes, samples, planned, fired, reviewed, all] = await Promise.all([
    countRows('lab_recipes'),
    countRows('lab_samples'),
    countRows('lab_samples', 'planned'),
    countRows('lab_samples', 'fired'),
    countRows('lab_samples', 'reviewed'),
    listSamples(),
  ])
  const totals: DashboardTotals = { recipes, samples, planned, fired, reviewed }
  return { totals, analytics: computeStats(all) }
}

/** إحصائيات اللوحة من دالة Supabase (migration 006). لو الدالة لسه ما اتعملتش بنرجع للطريقة القديمة */
export async function loadDashboard(): Promise<DashboardData> {
  const { data, error } = await supabase.rpc('lab_dashboard_stats')
  if (!error && data) return fromRemote(data as RemoteStats)
  return loadLegacy()
}
