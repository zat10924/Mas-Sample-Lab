import type { RecipeType, SampleListItem } from '../types/db'
import { parseResultCode } from './codes'
import { finalCodeOf } from './stats'
import { formatComponent } from './units'

export interface SampleTone {
  /** لون الشريط الجانبي للكرت */
  bar: string
  /** لون دائرة الرمز */
  chip: string
  /** رمز الدائرة: حرف اللمعة أو null */
  letter: string | null
}

/** لون الكرت حسب الحالة والنتيجة: أخضر = نظيفة، أحمر = فيها عيوب، كهرمان = محروقة */
export function sampleTone(s: SampleListItem): SampleTone {
  const code = finalCodeOf(s)
  const p = parseResultCode(code)
  if (p) {
    return p.defects.length === 0
      ? { bar: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800', letter: p.finish }
      : { bar: 'bg-red-500', chip: 'bg-red-100 text-red-700', letter: p.finish }
  }
  if (s.status === 'fired') return { bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-800', letter: null }
  return { bar: 'bg-faint', chip: 'bg-tint text-mute', letter: null }
}

export function resultBadgeClass(code: string | null): string {
  const p = parseResultCode(code)
  if (!p) return 'bg-tint text-mute'
  return p.defects.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
}

/** أول مكونات العينة كنصوص قصيرة، مع عدد الباقي */
export function componentsPreview(s: SampleListItem, max = 3): { items: string[]; more: number } {
  const sorted = [...s.components].sort((a, b) => a.sort_order - b.sort_order)
  return {
    items: sorted.slice(0, max).map((c) => `${c.material} ${formatComponent(c.amount, c.unit)}`),
    more: Math.max(0, sorted.length - max),
  }
}

export const RECIPE_BAR: Record<RecipeType, string> = {
  glaze_color: 'bg-brand-700',
  matte: 'bg-slate-400',
  white: 'bg-stone-300',
  base: 'bg-amber-500',
  decoration: 'bg-gold',
  body: 'bg-orange-700',
}
