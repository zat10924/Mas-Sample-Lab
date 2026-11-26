import type { SampleListItem } from '../types/db'
import { parseResultCode, DEFECT_OPTIONS, FINISH_OPTIONS, COLOR_OPTIONS } from './codes'

export interface Count {
  key: string
  label: string
  count: number
}

export interface LabStats {
  total: number
  reviewed: number
  /** عدد العينات المقيّمة بدون أي عيوب */
  clean: number
  cleanRate: number | null
  finishes: Count[]
  colors: Count[]
  defects: Count[]
  months: Count[]
  topRecipes: { key: string; label: string; total: number; clean: number }[]
}

/** أول كود نهائي للعينة (لو ليها أكتر من صورة نأخذ أول نتيجة معتمدة) */
export function finalCodeOf(s: SampleListItem): string | null {
  return s.results.find((r) => r.final_code)?.final_code ?? null
}

export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export function computeStats(samples: SampleListItem[], monthsBack = 6): LabStats {
  const finishes = new Map<string, number>()
  const colors = new Map<string, number>()
  const defects = new Map<string, number>()
  const perRecipe = new Map<string, { label: string; total: number; clean: number }>()
  let reviewed = 0
  let clean = 0

  for (const s of samples) {
    const rKey = s.recipe?.code ?? '—'
    const entry = perRecipe.get(rKey) ?? { label: s.recipe ? `${s.recipe.name}` : 'بدون تركيبة', total: 0, clean: 0 }
    entry.total += 1

    const parsed = parseResultCode(finalCodeOf(s))
    if (parsed) {
      reviewed += 1
      finishes.set(parsed.finish, (finishes.get(parsed.finish) ?? 0) + 1)
      colors.set(String(parsed.color), (colors.get(String(parsed.color)) ?? 0) + 1)
      if (parsed.defects.length === 0) {
        clean += 1
        entry.clean += 1
      }
      for (const d of parsed.defects) defects.set(d, (defects.get(d) ?? 0) + 1)
    }
    perRecipe.set(rKey, entry)
  }

  // آخر N شهور (بالترتيب من الأقدم للأحدث)
  const now = new Date()
  const months: Count[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const count = samples.filter((s) => {
      const c = new Date(s.created_at)
      return `${c.getFullYear()}-${c.getMonth()}` === key
    }).length
    months.push({ key, label: MONTHS_AR[d.getMonth()], count })
  }

  return {
    total: samples.length,
    reviewed,
    clean,
    cleanRate: reviewed > 0 ? Math.round((clean / reviewed) * 100) : null,
    finishes: FINISH_OPTIONS.map((f) => ({ key: f.value, label: f.label, count: finishes.get(f.value) ?? 0 })),
    colors: COLOR_OPTIONS.map((c) => ({ key: String(c.value), label: c.label, count: colors.get(String(c.value)) ?? 0 })),
    defects: DEFECT_OPTIONS.map((d) => ({ key: d.value, label: d.label.split(' ')[0], count: defects.get(d.value) ?? 0 })),
    months,
    topRecipes: [...perRecipe.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  }
}
