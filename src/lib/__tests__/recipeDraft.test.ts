import { describe, expect, it } from 'vitest'
import { matchMaterial, normalizeName, toFormDraft } from '../recipeDraft'

const KNOWN = ['مبيض', 'كاولين', 'اكسيد الحديد', 'سيليكات الزركونيوم', 'كربونات الكالسيوم']

describe('normalizeName', () => {
  it('يوحّد الهمزات والتاء المربوطة والتشكيل', () => {
    expect(normalizeName('أكسيد')).toBe(normalizeName('اكسيد'))
    expect(normalizeName('كاولينَة')).toBe(normalizeName('كاولينه'))
  })
})

describe('matchMaterial', () => {
  it('مطابقة تامة بعد التوحيد', () => {
    expect(matchMaterial('أكسيد الحديد', KNOWN)).toEqual({ name: 'اكسيد الحديد', kind: 'exact' })
  })
  it('اسم قريب بحرف واحد يتصحّح', () => {
    expect(matchMaterial('كاولن', KNOWN)).toEqual({ name: 'كاولين', kind: 'close' })
  })
  it('خامة مش موجودة تفضل جديدة', () => {
    expect(matchMaterial('زرنيخ', KNOWN).kind).toBe('new')
  })
  it('الأسماء القصيرة ما بتتصحّحش تلقائيًا', () => {
    expect(matchMaterial('مبي', KNOWN).kind).toBe('new')
  })
})

describe('toFormDraft', () => {
  it('يحوّل الأرقام لنصوص ويحذّر من الكميات الناقصة والمكررة', () => {
    const f = toFormDraft(
      {
        draft: {
          name: 'أبيض لامع', type: 'white', basis: 'percent', batch_base_kg: 5, density: null, notes: null,
          ingredients: [
            { material: 'مبيض', amount: 8, batch_grams: null },
            { material: 'كاولن', amount: null, batch_grams: null },
            { material: 'مبيض', amount: 2, batch_grams: 100 },
          ],
        },
        warnings: [],
      },
      KNOWN,
    )
    expect(f.rows[0]).toMatchObject({ material: 'مبيض', amount: '8', match: 'exact' })
    expect(f.rows[1]).toMatchObject({ material: 'كاولين', amount: '', match: 'close', original: 'كاولن' })
    expect(f.batchKg).toBe('5')
    expect(f.warnings.some((w) => w.includes('ظهر 2 مرات'))).toBe(true)
    expect(f.warnings.some((w) => w.includes('مفيش كمية'))).toBe(true)
  })
})
