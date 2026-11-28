import { describe, expect, it } from 'vitest'
import { searchRecipes, type SearchableRecipe } from '../recipeSearch'

const R = (code: string, name: string, type: SearchableRecipe['type'], mats: string[]): SearchableRecipe => ({
  code, name, type, ingredients: mats.map((material) => ({ material })),
})
const DATA: SearchableRecipe[] = [
  R('GL-001', 'جليز أخضر فاتح (معدل)', 'glaze_color', ['مبيض', 'اكسيد الكروم']),
  R('GL-002', 'جليز تركواز فاتح', 'glaze_color', ['مبيض', 'كوبلت', 'نحاس']),
  R('GL-004', 'جليز أسود (التركيبة الأصلية)', 'glaze_color', ['كوبلت', 'اكسيد الحديد', 'منجنيز']),
  R('GL-018', 'جليز موف قديم', 'glaze_color', ['كوبلت', 'منجنيز']),
  R('GL-020', 'جليز كوبلت', 'glaze_color', ['كوبلت']),
  R('MT-001', 'مط أبيض', 'matte', ['كاولين', 'فلسبار', 'سيليكات الزركونيوم']),
  R('WH-001', 'أبيض لامع', 'white', ['كاولين', 'فريت', 'سيليكات الزركونيوم']),
]
const codes = (q: string) => searchRecipes(DATA, q).hits.map((h) => h.item.code)

describe('searchRecipes', () => {
  it('يتجاهل الهمزات: اخضر = أخضر', () => expect(codes('اخضر')).toEqual(['GL-001']))
  it('يتحمّل غلطة حرف في الخامة', () => expect(codes('كاولن')).toEqual(['MT-001', 'WH-001']))
  it('يفهم المرادفات والإنجليزي', () => {
    expect(codes('بنفسجي')).toEqual(['GL-018'])
    expect(codes('kaolin')).toEqual(['MT-001', 'WH-001'])
  })
  it('صيغة سؤال عادية: اللي فيها كوبلت', () => {
    expect(codes('عايز اللي فيها كوبلت')).toEqual(expect.arrayContaining(['GL-002', 'GL-004', 'GL-018', 'GL-020']))
    expect(codes('عايز اللي فيها كوبلت')).not.toContain('GL-001')
  })
  it('النفي: جليز بدون كوبلت', () => expect(codes('جليز بدون كوبلت')).toEqual(['GL-001']))
  it('كل كلمة لازم تتطابق (AND)', () => expect(codes('ابيض فريت')).toEqual(['WH-001']))
  it('يفهم النوع: مط', () => expect(codes('مط')[0]).toBe('MT-001'))
  it('الكود جزئي أو بأرقام فقط', () => {
    expect(codes('gl 4')).toContain('GL-004')
    expect(codes('GL-020')[0]).toBe('GL-020')
  })
  it('لبني ما تتلخبطش مع بني', () => {
    const d = [R('A', 'جليز لبني فاتح', 'glaze_color', []), R('B', 'جليز بني', 'glaze_color', [])]
    expect(searchRecipes(d, 'لبني').hits.map((h) => h.item.code)).toEqual(['A'])
  })
  it('لو مفيش تطابق كامل يعرض الأقرب ويعلّم relaxed', () => {
    const r = searchRecipes(DATA, 'كوبلت اخضر')
    expect(r.relaxed).toBe(true)
    expect(r.hits.length).toBeGreaterThan(0)
  })
  it('بدون نتيجة: كلام ملوش علاقة', () => expect(codes('زرنيخ')).toEqual([]))
  it('يذكر السبب لما التطابق من الخامة', () => {
    const h = searchRecipes(DATA, 'منجنيز').hits.find((x) => x.item.code === 'GL-004')
    expect(h?.reasons).toContain('فيها منجنيز')
  })
})
