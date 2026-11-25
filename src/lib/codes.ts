import type { ColorMatch, Finish, RecipeType } from '../types/db'

export const FINISH_OPTIONS: { value: Finish; label: string }[] = [
  { value: 'G', label: 'لامع' },
  { value: 'S', label: 'نصف مط' },
  { value: 'M', label: 'مط' },
]

export const COLOR_OPTIONS: { value: ColorMatch; label: string }[] = [
  { value: 1, label: 'مطابق' },
  { value: 2, label: 'قريب' },
  { value: 3, label: 'بعيد' },
]

export const DEFECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'P', label: 'Pinholes (ثقوب دبوسية)' },
  { value: 'C', label: 'Crawling (تكوّر الجليز)' },
  { value: 'R', label: 'Crazing (تشقق)' },
  { value: 'B', label: 'Blistering (فقاعات)' },
]

export const RECIPE_TYPE_LABELS: Record<RecipeType, string> = {
  glaze_color: 'جليز ملوّن',
  matte: 'مط',
  white: 'أبيض',
  base: 'قاعدة',
  decoration: 'زخرفة',
  body: 'بدن',
}

/** كود النتيجة: [لمعان][لون]-[عيوب]  مثال: G1-0  أو  M2-PC */
export function buildResultCode(finish: Finish, color: ColorMatch, defects: string[]): string {
  const ordered = DEFECT_OPTIONS.map((d) => d.value).filter((v) => defects.includes(v))
  return `${finish}${color}-${ordered.length > 0 ? ordered.join('') : '0'}`
}

/** شرح الكود بالعربي، أو null لو الكود غير صالح */
export function describeResultCode(code: string | null): string | null {
  if (!code) return null
  const m = /^([GSM])([123])-(0|[PCRB]+)$/.exec(code)
  if (!m) return null
  const finish = FINISH_OPTIONS.find((f) => f.value === m[1])?.label ?? m[1]
  const color = COLOR_OPTIONS.find((c) => String(c.value) === m[2])?.label ?? m[2]
  const defects =
    m[3] === '0'
      ? 'بدون عيوب'
      : m[3]
          .split('')
          .map((d) => DEFECT_OPTIONS.find((o) => o.value === d)?.label.split(' ')[0] ?? d)
          .join(' + ')
  return `${finish} - لون ${color} - ${defects}`
}

function prefixFor(type: RecipeType): string {
  switch (type) {
    case 'glaze_color':
      return 'GL'
    case 'matte':
    case 'white':
      return 'MT'
    case 'base':
      return 'BS'
    case 'decoration':
      return 'DC'
    case 'body':
      return 'BD'
  }
}

/** يقترح كود التركيبة التالي، مثال: GL-025 */
export function nextRecipeCode(type: RecipeType, existingCodes: string[]): string {
  const prefix = prefixFor(type)
  const re = new RegExp(`^${prefix}-(\\d+)$`)
  let max = 0
  for (const c of existingCodes) {
    const m = re.exec(c)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
