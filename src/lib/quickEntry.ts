/** مساعد الإدخال السريع: يفهم جملة زي «عينة GL-005 كمية 1.5 كجم حرق 1200 غمس» */

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/،/g, ',')
}

export const METHODS = ['غمس', 'رش', 'فرشاة', 'سكب']

export interface QuickEntry {
  recipeCode: string | null
  kg: number | null
  temp: number | null
  method: string | null
}

export function parseQuickEntry(raw: string): QuickEntry | null {
  let text = normalizeDigits(raw)

  let recipeCode: string | null = null
  const rm = /\b(GL|MT|BS|DC|BD)\s*-?\s*(\d{1,3})\b/i.exec(text)
  if (rm) {
    recipeCode = `${rm[1].toUpperCase()}-${rm[2].padStart(3, '0')}`
    text = text.replace(rm[0], ' ')
  }

  let kg: number | null = null
  const km = /(\d+(?:[.,]\d+)?)\s*(?:كجم|كيلو|كغ|kg)/i.exec(text)
  if (km) {
    kg = Number(km[1].replace(',', '.'))
    text = text.replace(km[0], ' ')
  }

  let temp: number | null = null
  const tm = /(?:حرق|درجة|حرارة|على)\s*(\d{3,4})/.exec(text) ?? /\b(\d{3,4})\s*(?:°|م\b|c\b)/i.exec(text) ?? /\b(\d{3,4})\b/.exec(text)
  if (tm) {
    const n = Number(tm[1])
    if (n >= 500 && n <= 1500) temp = n
  }

  const method = METHODS.find((m) => text.includes(m)) ?? null

  const found = [recipeCode, kg, temp, method].filter((v) => v !== null).length
  if (found === 0) return null
  // لازم يبان إنها نية تسجيل: كود تركيبة، أو كلمة «عينة»، أو أكتر من معلومة
  if (!recipeCode && !/عينة|عينه|سجل/.test(text) && found < 2) return null
  return { recipeCode, kg: kg !== null && kg > 0 ? kg : null, temp, method }
}

/** رابط نموذج عينة جديدة معبّأ مسبقًا */
export function sampleFormUrl(p: { recipeId?: string | null; kg?: number | string | null; temp?: number | string | null; method?: string | null; body?: string | null }): string {
  const q = new URLSearchParams()
  if (p.recipeId) q.set('recipe', p.recipeId)
  if (p.kg != null && p.kg !== '') q.set('kg', String(p.kg))
  if (p.temp != null && p.temp !== '') q.set('temp', String(p.temp))
  if (p.method) q.set('method', p.method)
  if (p.body) q.set('body', p.body)
  const qs = q.toString()
  return `/samples/new${qs ? `?${qs}` : ''}`
}
