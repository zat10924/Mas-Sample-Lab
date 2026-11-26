import { describe, expect, it } from 'vitest'
import {
  componentGrams,
  formatComponent,
  formatGrams,
  formatNumber,
  ingredientGrams,
  parseNumber,
  totalWeightGrams,
} from '../units'

describe('ingredientGrams', () => {
  it('per_kg: الكمية بالجرام لكل 1 كجم جليز', () => {
    expect(ingredientGrams(10, 'per_kg', 2)).toBe(20)
    expect(ingredientGrams(10, 'per_kg', 0.5)).toBe(5)
  })
  it('percent: نسبة من وزن الجليز', () => {
    expect(ingredientGrams(5, 'percent', 1)).toBe(50)
    expect(ingredientGrams(5, 'percent', 2)).toBe(100)
  })
})

describe('parseNumber', () => {
  it('يقبل الفاصلة العادية والعربية', () => {
    expect(parseNumber('1,5')).toBe(1.5)
    expect(parseNumber('2٫25')).toBe(2.25)
    expect(parseNumber(' 7 ')).toBe(7)
  })
  it('يرجّع null للفاضي والنص غير الصالح', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('   ')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
  })
})

describe('componentGrams', () => {
  it('جم وكجم', () => {
    expect(componentGrams({ amount: 20, unit: 'g' })).toBe(20)
    expect(componentGrams({ amount: 1, unit: 'kg' })).toBe(1000)
  })
  it('النسبة المئوية بتعتمد على كمية الجليز الأساسي', () => {
    expect(componentGrams({ amount: 5, unit: 'percent' }, 1)).toBe(50)
    expect(componentGrams({ amount: 2, unit: 'percent' }, 1)).toBe(20)
    expect(componentGrams({ amount: 5, unit: 'percent' }, null)).toBeNull()
    expect(componentGrams({ amount: 5, unit: 'percent' }, 0)).toBeNull()
  })
  it('السوائل ملهاش وزن', () => {
    expect(componentGrams({ amount: 100, unit: 'ml' })).toBeNull()
    expect(componentGrams({ amount: 1, unit: 'l' })).toBeNull()
  })
})

describe('totalWeightGrams', () => {
  it('بيجمع الوزن ويتجاهل السوائل', () => {
    const rows = [
      { amount: 1, unit: 'kg' as const },
      { amount: 50, unit: 'g' as const },
      { amount: 200, unit: 'ml' as const },
    ]
    expect(totalWeightGrams(rows)).toBe(1050)
  })
  it('بيحسب النسب على أساس كمية الجليز', () => {
    const rows = [
      { amount: 5, unit: 'percent' as const },
      { amount: 2, unit: 'percent' as const },
    ]
    expect(totalWeightGrams(rows, 1)).toBe(70)
    expect(totalWeightGrams(rows, null)).toBe(0)
  })
})

describe('التنسيق', () => {
  it('formatNumber', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.57')
    expect(formatNumber(1.23456, 3)).toBe('1.235')
  })
  it('formatGrams بيضيف الكجم لو ≥ 1000', () => {
    expect(formatGrams(500)).toBe('500 جم')
    expect(formatGrams(1500)).toBe('1,500 جم (1.5 كجم)')
  })
  it('formatComponent زي ورقة العينة (كاولين 5% = 50 جم)', () => {
    expect(formatComponent(5, 'percent', 1)).toBe('5% (50 جم)')
    expect(formatComponent(2, 'percent', 1)).toBe('2% (20 جم)')
    expect(formatComponent(5, 'percent', null)).toBe('5%')
    expect(formatComponent(20, 'g')).toBe('20 جم')
    expect(formatComponent(1, 'kg')).toBe('1 كجم')
  })
})
