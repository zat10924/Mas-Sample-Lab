import type { RecipeBasis } from '../types/db'

/** الكمية بالجرام لمكوّن معين عند كمية جليز kg (بالكيلوجرام) */
export function ingredientGrams(amount: number, basis: RecipeBasis, kg: number): number {
  return basis === 'per_kg' ? amount * kg : (amount / 100) * kg * 1000
}

export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function formatGrams(g: number): string {
  return g >= 1000 ? `${formatNumber(g)} جم (${formatNumber(g / 1000, 3)} كجم)` : `${formatNumber(g)} جم`
}

/** يحوّل نص إلى رقم، أو null لو فاضي/غير صالح. يقبل الفاصلة العربية والعادية */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace('٫', '.').replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

import type { ComponentUnit } from '../types/db'

export const COMPONENT_UNITS: { value: ComponentUnit; label: string }[] = [
  { value: 'g', label: 'جم' },
  { value: 'kg', label: 'كجم' },
  { value: 'percent', label: '٪ نسبة' },
  { value: 'ml', label: 'مل' },
  { value: 'l', label: 'لتر' },
]

export const UNIT_LABEL: Record<ComponentUnit, string> = { g: 'جم', kg: 'كجم', ml: 'مل', l: 'لتر', percent: '%' }

/**
 * وزن المكوّن بالجرام. النسبة المئوية بتتحسب من كمية الجليز الأساسي (كجم).
 * بترجّع null للسوائل (مل/لتر) أو للنسبة لو كمية الجليز الأساسي مش معروفة.
 */
export function componentGrams(c: { amount: number; unit: ComponentUnit }, batchKg?: number | null): number | null {
  if (c.unit === 'g') return c.amount
  if (c.unit === 'kg') return c.amount * 1000
  if (c.unit === 'percent') return batchKg && batchKg > 0 ? (c.amount / 100) * batchKg * 1000 : null
  return null
}

/** «20 جم» أو «1 كجم» أو «2% (20 جم)» لو كمية الجليز الأساسي معروفة */
export function formatComponent(amount: number, unit: ComponentUnit, batchKg?: number | null): string {
  if (unit === 'percent') {
    const g = componentGrams({ amount, unit }, batchKg)
    return g === null ? `${formatNumber(amount, 3)}%` : `${formatNumber(amount, 3)}% (${formatNumber(g)} جم)`
  }
  return `${formatNumber(amount, 3)} ${UNIT_LABEL[unit]}`
}

/** إجمالي الوزن بالجرام لمكونات الوزن (جم/كجم، والنسبة لو كمية الجليز معروفة). السوائل ما بتتجمعش مع الوزن */
export function totalWeightGrams(rows: { amount: number; unit: ComponentUnit }[], batchKg?: number | null): number {
  return rows.reduce((sum, r) => sum + (componentGrams(r, batchKg) ?? 0), 0)
}
