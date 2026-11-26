import { describe, expect, it } from 'vitest'
import { computeStats, finalCodeOf, MONTHS_AR } from '../stats'
import { fromRemote, type RemoteStats } from '../statsRemote'
import type { SampleListItem } from '../../types/db'

function sample(over: Partial<SampleListItem> & { codes?: (string | null)[]; recipe?: { code: string; name: string } | null }): SampleListItem {
  const { codes = [], ...rest } = over
  return {
    id: Math.random().toString(36).slice(2),
    code: 'MAS-2026-0001',
    recipe_id: null,
    body_type: null,
    batch_kg: 1,
    firing_temp: null,
    firing_date: null,
    application_method: null,
    status: 'planned',
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    recipe: null,
    results: codes.map((c) => ({ final_code: c })),
    components: [],
    ...rest,
  } as SampleListItem
}

describe('finalCodeOf', () => {
  it('أول كود نهائي موجود', () => {
    expect(finalCodeOf(sample({ codes: [null, 'G1-0', 'M3-P'] }))).toBe('G1-0')
    expect(finalCodeOf(sample({ codes: [] }))).toBeNull()
  })
})

describe('computeStats', () => {
  const recipeA = { code: 'GL-001', name: 'أبيض لميع' }
  const samples = [
    sample({ recipe: recipeA, codes: ['G1-0'] }),
    sample({ recipe: recipeA, codes: ['G2-PC'] }),
    sample({ recipe: recipeA, codes: [] }),
    sample({ recipe: null, codes: ['M1-0'] }),
  ]
  const s = computeStats(samples)

  it('الإجماليات ونسبة النجاح', () => {
    expect(s.total).toBe(4)
    expect(s.reviewed).toBe(3)
    expect(s.clean).toBe(2)
    expect(s.cleanRate).toBe(67)
  })
  it('نسبة النجاح null لو مفيش تقييم', () => {
    expect(computeStats([sample({ codes: [] })]).cleanRate).toBeNull()
  })
  it('توزيع اللمعة والعيوب', () => {
    expect(s.finishes.find((f) => f.key === 'G')?.count).toBe(2)
    expect(s.finishes.find((f) => f.key === 'M')?.count).toBe(1)
    expect(s.defects.find((d) => d.key === 'P')?.count).toBe(1)
    expect(s.defects.find((d) => d.key === 'C')?.count).toBe(1)
    expect(s.defects.find((d) => d.key === 'R')?.count).toBe(0)
  })
  it('أكتر التركيبات تجربة', () => {
    expect(s.topRecipes[0]).toEqual({ key: 'GL-001', label: 'أبيض لميع', total: 3, clean: 1 })
    expect(s.topRecipes[1].label).toBe('بدون تركيبة')
  })
  it('6 شهور وآخر شهر فيه كل العينات', () => {
    expect(s.months).toHaveLength(6)
    expect(s.months[5].count).toBe(4)
    expect(s.months[0].count).toBe(0)
  })
})

describe('fromRemote (إحصائيات Supabase)', () => {
  const remote: RemoteStats = {
    recipes: 32,
    samples: 4,
    planned: 1,
    fired: 1,
    reviewed_status: 2,
    reviewed: 3,
    clean: 2,
    finishes: { G: 2, M: 1 },
    colors: { '1': 2, '2': 1 },
    defects: { P: 1, C: 1 },
    months: [
      { year: 2026, month: 5, count: 0 },
      { year: 2026, month: 10, count: 4 },
    ],
    topRecipes: [{ key: 'GL-001', label: 'أبيض لميع', total: 3, clean: 1 }],
  }
  const d = fromRemote(remote)

  it('الإجماليات', () => {
    expect(d.totals).toEqual({ recipes: 32, samples: 4, planned: 1, fired: 1, reviewed: 2 })
    expect(d.analytics.total).toBe(4)
    expect(d.analytics.cleanRate).toBe(67)
  })
  it('بيطلّع كل الخيارات حتى اللي عددها صفر وبنفس ترتيب الواجهة', () => {
    expect(d.analytics.finishes.map((f) => f.key)).toEqual(['G', 'S', 'M'])
    expect(d.analytics.finishes.map((f) => f.count)).toEqual([2, 0, 1])
    expect(d.analytics.colors.map((c) => c.count)).toEqual([2, 1, 0])
    expect(d.analytics.defects.map((x) => x.count)).toEqual([1, 1, 0, 0])
  })
  it('الشهور بأسمائها العربي', () => {
    expect(d.analytics.months[0].label).toBe(MONTHS_AR[5])
    expect(d.analytics.months[1]).toEqual({ key: '2026-10', label: 'نوفمبر', count: 4 })
  })
  it('نفس نتيجة الحساب في المتصفح لنفس البيانات', () => {
    const local = computeStats([
      sample({ recipe: { code: 'GL-001', name: 'أبيض لميع' }, codes: ['G1-0'] }),
      sample({ recipe: { code: 'GL-001', name: 'أبيض لميع' }, codes: ['G2-PC'] }),
      sample({ recipe: { code: 'GL-001', name: 'أبيض لميع' }, codes: [] }),
      sample({ recipe: null, codes: ['M1-0'] }),
    ])
    expect(d.analytics.reviewed).toBe(local.reviewed)
    expect(d.analytics.clean).toBe(local.clean)
    expect(d.analytics.finishes).toEqual(local.finishes)
    expect(d.analytics.colors).toEqual(local.colors)
    expect(d.analytics.defects).toEqual(local.defects)
  })
  it('رد فاضي أو ناقص ما بيكسرش', () => {
    const empty = fromRemote({} as RemoteStats)
    expect(empty.analytics.total).toBe(0)
    expect(empty.analytics.cleanRate).toBeNull()
    expect(empty.analytics.months).toEqual([])
  })
})
