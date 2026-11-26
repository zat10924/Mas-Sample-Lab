/** مساعد الإدخال السريع: يفهم جملة زي «عينة GL-005 كمية 1.5 كجم حرق 1200 غمس» */

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function normalizeDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/،/g, ',')
    .replace(/٪/g, '%')
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
export function sampleFormUrl(p: { from?: string | null; recipeId?: string | null; kg?: number | string | null; temp?: number | string | null; method?: string | null; body?: string | null }): string {
  const q = new URLSearchParams()
  if (p.from) q.set('from', p.from)
  if (p.recipeId) q.set('recipe', p.recipeId)
  if (p.kg != null && p.kg !== '') q.set('kg', String(p.kg))
  if (p.temp != null && p.temp !== '') q.set('temp', String(p.temp))
  if (p.method) q.set('method', p.method)
  if (p.body) q.set('body', p.body)
  const qs = q.toString()
  return `/samples/new${qs ? `?${qs}` : ''}`
}

/* ---------- لصق المكونات دفعة واحدة ---------- */
import type { ComponentUnit } from '../types/db'

export interface ComponentDraft {
  material: string
  amount: string
  unit: ComponentUnit
}

const UNIT_PATTERNS: { unit: ComponentUnit; re: RegExp }[] = [
  { unit: 'kg', re: /^(?:كجم|كيلو|كغم|كغ|كج|kg|kgs)$/i },
  { unit: 'g', re: /^(?:جم|جرام|غرام|جر|غم|g|gm|gr|gram|grams)$/i },
  { unit: 'ml', re: /^(?:مل|ملل|ملي|ml)$/i },
  { unit: 'l', re: /^(?:لتر|ل|l|ltr|liter)$/i },
]

/** يفهم: «جليز شفاف 1 كجم + أكسيد نحاس 20 جم + فريت 50» (الفاصل: + أو سطر جديد أو فاصلة) */
export function parseComponents(raw: string): ComponentDraft[] {
  const text = normalizeDigits(raw)
  const chunks = text
    .split(/[\n+،;]|,(?!\d)/)
    .map((c) => c.trim())
    .filter(Boolean)
  const out: ComponentDraft[] = []
  for (const chunk of chunks) {
    // نسبة مئوية: «2%» أو «2 بالمية» أو «2 في المية»
    const pm = /(\d+(?:[.,]\d+)?)\s*(?:%|بالمية|بالمائة|بالميه|في المية|في المائة|في الميه)/.exec(chunk)
    if (pm) {
      const rest = chunk.replace(pm[0], ' ').replace(/\s+/g, ' ').trim()
      out.push({ material: rest.replace(/^[-–:×x]\s*|\s*[-–:×x]$/g, '').trim(), amount: pm[1].replace(',', '.'), unit: 'percent' })
      continue
    }
    const m = /(\d+(?:[.,]\d+)?)\s*([A-Za-z\u0600-\u06FF]{0,6})/.exec(chunk)
    if (!m) {
      out.push({ material: chunk, amount: '', unit: 'g' })
      continue
    }
    const unitHit = UNIT_PATTERNS.find((u) => u.re.test(m[2]))
    const unit: ComponentUnit = unitHit?.unit ?? 'g'
    // لو الكلمة بعد الرقم مش وحدة (يعني جزء من الاسم) نرجّعها للاسم
    const rest = (unitHit ? chunk.replace(m[0], ' ') : chunk.replace(m[1], ' ')).replace(/\s+/g, ' ').trim()
    out.push({ material: rest.replace(/^[-–:×x]\s*|\s*[-–:×x]$/g, '').trim(), amount: m[1].replace(',', '.'), unit })
  }
  return out.filter((r) => r.material !== '' || r.amount !== '')
}
