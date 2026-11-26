import { describe, expect, it } from 'vitest'
import { buildResultCode, describeResultCode, nextRecipeCode, parseResultCode } from '../codes'

describe('كود النتيجة', () => {
  it('بدون عيوب', () => {
    expect(buildResultCode('G', 1, [])).toBe('G1-0')
  })
  it('العيوب بترتيب ثابت بغض النظر عن ترتيب الاختيار', () => {
    expect(buildResultCode('M', 2, ['C', 'P'])).toBe('M2-PC')
    expect(buildResultCode('S', 3, ['B', 'R', 'C', 'P'])).toBe('S3-PCRB')
  })
  it('بيتجاهل عيب غير معروف', () => {
    expect(buildResultCode('G', 1, ['X'])).toBe('G1-0')
  })
  it('parse يرجّع الأجزاء', () => {
    expect(parseResultCode('M2-PC')).toEqual({ finish: 'M', color: 2, defects: ['P', 'C'] })
    expect(parseResultCode('G1-0')).toEqual({ finish: 'G', color: 1, defects: [] })
  })
  it('parse يرفض الأكواد غير الصالحة', () => {
    expect(parseResultCode(null)).toBeNull()
    expect(parseResultCode('')).toBeNull()
    expect(parseResultCode('G4-0')).toBeNull()
    expect(parseResultCode('X1-0')).toBeNull()
    expect(parseResultCode('G1-')).toBeNull()
  })
  it('build ثم parse بيرجّعوا نفس القيم', () => {
    const code = buildResultCode('S', 3, ['R', 'B'])
    expect(parseResultCode(code)).toEqual({ finish: 'S', color: 3, defects: ['R', 'B'] })
  })
  it('الشرح بالعربي', () => {
    expect(describeResultCode('G1-0')).toBe('لامع - لون مطابق - بدون عيوب')
    expect(describeResultCode('M2-PC')).toBe('مط - لون قريب - Pinholes + Crawling')
    expect(describeResultCode('nope')).toBeNull()
    expect(describeResultCode(null)).toBeNull()
  })
})

describe('nextRecipeCode', () => {
  it('أول كود', () => {
    expect(nextRecipeCode('glaze_color', [])).toBe('GL-001')
  })
  it('بيكمل بعد أكبر رقم موجود ويتجاهل البادئات التانية', () => {
    expect(nextRecipeCode('glaze_color', ['GL-001', 'GL-024', 'MT-099', 'GL-xyz'])).toBe('GL-025')
  })
  it('مط وأبيض بيشاركوا نفس البادئة', () => {
    expect(nextRecipeCode('white', ['MT-007'])).toBe('MT-008')
  })
})
