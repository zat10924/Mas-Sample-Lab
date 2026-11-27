import type { RecipeBasis, RecipeType } from '../types/db'

/** مسودة التركيبة كما ترجع من الدالة lab-ai (action: recipe_parse) بعد التحقق من الشكل في الخادم */
export interface RecipeDraftIngredient {
  material: string
  amount: number | null
  batch_grams: number | null
}

export interface RecipeDraft {
  name: string | null
  type: RecipeType | null
  basis: RecipeBasis | null
  batch_base_kg: number | null
  density: number | null
  notes: string | null
  ingredients: RecipeDraftIngredient[]
}

export interface RecipeParseResult {
  draft: RecipeDraft
  warnings: string[]
  model?: string
}

/** exact = موجود في القائمة · close = اسم قريب اتصحّح للاسم المعروف · new = خامة جديدة مش في القائمة */
export type MatchKind = 'exact' | 'close' | 'new'

export interface FormIngredient {
  material: string
  amount: string
  batch: string
  match: MatchKind
  /** الاسم كما كتبه المستخدم (لو اتصحّح) */
  original: string
}

/** مسودة جاهزة لملء نموذج التركيبة (كل القيم نصوص زي حقول النموذج) */
export interface FormDraft {
  name: string
  type: RecipeType | null
  basis: RecipeBasis | null
  batchKg: string
  density: string
  notes: string
  rows: FormIngredient[]
  warnings: string[]
}

/** توحيد الكتابة العربية للمقارنة: تشكيل، همزات، ياء/ألف مقصورة، تاء مربوطة، أرقام هندية */
export function normalizeName(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 2) return 3
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

/**
 * يطابق اسم خامة مع قائمة الخامات المعروفة.
 * التصحيح التلقائي بس لو الاسم مطابق بعد التوحيد، أو قريب بحرف واحد (حرفين للأسماء الطويلة)
 * ومفيش اسمين معروفين بنفس القرب. غير كده نسيبه خامة جديدة ونعلّم عليها.
 */
export function matchMaterial(name: string, known: string[]): { name: string; kind: MatchKind } {
  const clean = name.trim()
  const n = normalizeName(clean)
  if (!n) return { name: clean, kind: 'new' }
  const exact = known.find((k) => normalizeName(k) === n)
  if (exact) return { name: exact, kind: 'exact' }
  if (n.length < 4) return { name: clean, kind: 'new' }
  const limit = n.length >= 8 ? 2 : 1
  let best: string | null = null
  let bestD = limit + 1
  let tie = false
  for (const k of known) {
    const d = editDistance(n, normalizeName(k))
    if (d < bestD) {
      best = k
      bestD = d
      tie = false
    } else if (d === bestD && best !== null) {
      tie = true
    }
  }
  if (best !== null && bestD <= limit && !tie) return { name: best, kind: 'close' }
  return { name: clean, kind: 'new' }
}

const numText = (n: number | null): string => (n === null ? '' : String(Number(n.toFixed(4))))

/** يحوّل رد الدالة لمسودة نموذج: يطابق الخامات، ويضيف تحذيرات المراجعة */
export function toFormDraft(result: RecipeParseResult, known: string[]): FormDraft {
  const d = result.draft
  const warnings = [...result.warnings]
  const seen = new Map<string, number>()
  const rows: FormIngredient[] = d.ingredients.map((ing) => {
    const m = matchMaterial(ing.material, known)
    const key = normalizeName(m.name)
    seen.set(key, (seen.get(key) ?? 0) + 1)
    return {
      material: m.name,
      amount: numText(ing.amount),
      batch: numText(ing.batch_grams),
      match: m.kind,
      original: ing.material,
    }
  })
  for (const [key, count] of seen) {
    if (count > 1) warnings.push(`المكوّن «${rows.find((r) => normalizeName(r.material) === key)?.material}» ظهر ${count} مرات، راجعه.`)
  }
  const missing = rows.filter((r) => r.amount === '').map((r) => r.material)
  if (missing.length > 0) warnings.push(`مفيش كمية مكتوبة لـ: ${missing.join('، ')}. اكتبها بنفسك قبل الحفظ.`)
  if (rows.length === 0) warnings.push('ما لقيتش مكوّنات في النص. اكتب كل مكوّن وكميته.')
  return {
    name: d.name ?? '',
    type: d.type,
    basis: d.basis,
    batchKg: numText(d.batch_base_kg),
    density: numText(d.density),
    notes: d.notes ?? '',
    rows,
    warnings,
  }
}
