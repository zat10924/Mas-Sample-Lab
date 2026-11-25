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
