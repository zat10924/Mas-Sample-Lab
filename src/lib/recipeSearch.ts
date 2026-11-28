import type { RecipeType } from '../types/db'
import { editDistance, normalizeName } from './recipeDraft'

/**
 * بحث ذكي في التركيبات من غير ما تكتب الاسم أو الكود بالحرف:
 * - يتجاهل الهمزات والتشكيل والتاء المربوطة والألف المقصورة («اخضر» = «أخضر»)
 * - يتحمّل غلطة حرف («كاولن» تلاقي «كاولين»)
 * - يفهم المرادفات والأسماء الإنجليزية («موف» = بنفسجي، «kaolin» = كاولين)
 * - يفهم النوع («مط»، «ابيض») واسم الخامة («اللي فيها كاولين»)
 * - يفهم النفي («جليز بدون كوبلت»)
 * - كل كلمة لازم تتطابق مع حاجة في التركيبة؛ ولو مفيش تركيبة بتطابق الكل نعرض الأقرب
 */

export interface SearchableRecipe {
  code: string
  name: string
  type: RecipeType
  ingredients: { material: string }[]
}

export interface RecipeSearchHit<T> {
  item: T
  score: number
  /** ليه ظهرت التركيبة دي (مثلًا: فيها كاولين) */
  reasons: string[]
}

export interface RecipeSearchResult<T> {
  hits: RecipeSearchHit<T>[]
  /** true لو مفيش تركيبة بتطابق كل الكلمات فعرضنا الأقرب */
  relaxed: boolean
  /** الخامات/الكلمات المستبعدة بالنفي */
  excluded: string[]
}

const STOP = new Set(
  'اللي الي فيها فيه فيهم عاوز عايز عايزه اريد ابحث ابحثلي هات هاتلي عن تركيبه تركيبات بتاع بتاعه بتاعت من في علي مع و او كل زي شبه استخدم بيها لو ده دي دا فين اي ايه هي هو لون الوان'.split(' '),
)
const NEG = new Set(['بدون', 'غير', 'مفيش', 'مافيش', 'ماعدا', 'عدا', 'مش'])

/** مرادفات (كل مجموعة بالصيغة الموحّدة): أي كلمة فيها تساوي باقي الكلمات */
const SYN_GROUPS: string[][] = [
  ['اخضر', 'green'], ['ازرق', 'blue'], ['احمر', 'red'], ['اصفر', 'yellow'], ['اسود', 'black'],
  ['ابيض', 'بيضاء', 'بيضا', 'white'], ['بني', 'brown'], ['رمادي', 'gray', 'grey', 'جراي'],
  ['وردي', 'روز', 'pink', 'بينك'], ['موف', 'بنفسجي', 'ليلكي', 'purple', 'violet'],
  ['تركواز', 'فيروزي', 'turquoise'], ['برتقالي', 'orange', 'اورنج', 'اورانج'],
  ['لموني', 'ليموني', 'ليمون', 'lemon'], ['ذهبي', 'دهبي', 'gold'], ['بيج', 'beige'],
  ['فاتح', 'light'], ['غامق', 'داكن', 'dark'], ['لامع', 'glossy', 'gloss'],
  ['كاولين', 'kaolin'], ['فلسبار', 'feldspar'], ['سيليكا', 'silica'], ['كوارتز', 'quartz'],
  ['فريت', 'frit'], ['زركونيوم', 'زركون', 'zirconium', 'zircon'], ['كوبلت', 'cobalt'],
  ['كروم', 'chrome', 'chromium'], ['حديد', 'iron'], ['منجنيز', 'manganese'], ['نحاس', 'copper'],
  ['تيتانيوم', 'titanium'], ['زنك', 'zinc'], ['تلك', 'talc'], ['كالسيوم', 'calcium'],
  ['كربونات', 'carbonate'], ['بنتونيت', 'bentonite'],
]
const SYN = new Map<string, string[]>()
for (const g of SYN_GROUPS) for (const w of g) SYN.set(w, g)

const TYPE_WORDS: Record<RecipeType, string[]> = {
  matte: ['مط', 'ماط', 'مات', 'matte', 'mat'],
  white: ['ابيض', 'بيضاء', 'بيضا', 'white'],
  glaze_color: ['ملون', 'ملونه', 'colored'],
  base: ['قاعده', 'اساس', 'base'],
  decoration: ['زخرفه', 'ديكور', 'decoration'],
  body: ['بدن', 'جسم', 'body'],
}

function stem(w: string): string {
  let t = w
  if (t.length > 5 && t.startsWith('وال')) t = t.slice(3)
  else if (t.length > 4 && t.startsWith('ال')) t = t.slice(2)
  else if (t.length > 4 && t.startsWith('و')) t = t.slice(1)
  return t.length >= 2 ? t : w
}

function words(s: string): string[] {
  return normalizeName(s)
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    .split(' ')
    .filter(Boolean)
}

/** درجة تطابق كلمة البحث مع قائمة كلمات: 0 = مفيش */
function wordScore(v: string, ws: string[]): number {
  let best = 0
  for (const w0 of ws) {
    const w = stem(w0)
    let sc = 0
    if (w === v) sc = 6
    else if (v.length >= 2 && w.startsWith(v)) sc = 5
    else if (v.length >= 4 && w.includes(v)) sc = 3
    else if (v.length >= 5 && w[0] === v[0] && editDistance(v, w) <= (v.length >= 9 ? 2 : 1)) sc = 2
    if (sc > best) best = sc
  }
  return best
}

interface Prepared<T> {
  item: T
  /** حروف الكود وقيمة رقمه: GL-004 → { L: 'gl', N: 4 } */
  codeL: string
  codeN: number | null
  nameWords: string[]
  ing: { material: string; words: string[] }[]
  typeWords: string[]
}

function splitCode(code: string): { codeL: string; codeN: number | null } {
  const m = /^([a-z]*)(\d*)$/.exec(normalizeName(code).replace(/[^a-z0-9]/g, ''))
  return { codeL: m?.[1] ?? '', codeN: m && m[2] !== '' ? Number(m[2]) : null }
}

function prepare<T extends SearchableRecipe>(item: T): Prepared<T> {
  return {
    item,
    ...splitCode(item.code),
    nameWords: words(item.name),
    ing: item.ingredients.map((i) => ({ material: i.material, words: words(i.material) })),
    typeWords: TYPE_WORDS[item.type],
  }
}

function variantsOf(tok: string): string[] {
  return SYN.get(tok) ?? [tok]
}

/** أفضل تطابق لكلمة بحث (بكل مرادفاتها) مع تركيبة */
function matchToken<T>(tok: string, p: Prepared<T>): { score: number; reason: string | null } {
  let best = 0
  let reason: string | null = null
  // الكود: GL-004 أو gl4 أو 4 أو gl (كل صيغة بتتطابق من غير ما تكتب الأصفار)
  if (/^[a-z0-9-]+$/.test(tok)) {
    const m = /^([a-z]*)(\d*)$/.exec(tok.replace(/-/g, ''))
    if (m) {
      const [, L, D] = m
      if (L && D) {
        if (L === p.codeL && p.codeN === Number(D)) return { score: 12, reason: 'الكود' }
      } else if (D) {
        if (p.codeN === Number(D)) {
          best = 8
          reason = 'الكود'
        }
      } else if (L.length >= 2 && p.codeL.startsWith(L)) {
        best = 4
        reason = 'الكود'
      }
    }
  }
  for (const v of variantsOf(tok)) {
    const n = wordScore(v, p.nameWords)
    if (n > best) {
      best = n
      reason = null
    }
    for (const i of p.ing) {
      const s = wordScore(v, i.words) * 0.65
      if (s > best) {
        best = s
        reason = `فيها ${i.material}`
      }
    }
    if (p.typeWords.includes(v) && 3 > best) {
      best = 3
      reason = 'النوع'
    }
  }
  return { score: best, reason }
}

/** هل التركيبة فيها الكلمة (للنفي)؟ تطابق حقيقي فقط، من غير تقريب بالغلط */
function hasToken<T>(tok: string, p: Prepared<T>): boolean {
  for (const v of variantsOf(tok)) {
    if (wordScore(v, p.nameWords) >= 5) return true
    for (const i of p.ing) if (wordScore(v, i.words) * 0.65 >= 2.5) return true
  }
  return false
}

export function searchRecipes<T extends SearchableRecipe>(items: T[], query: string): RecipeSearchResult<T> {
  const pos: string[] = []
  const neg: string[] = []
  let negative = false
  for (const raw of words(query)) {
    if (NEG.has(raw)) {
      negative = true
      continue
    }
    if (STOP.has(raw)) continue
    const t = stem(raw)
    ;(negative ? neg : pos).push(t)
  }

  const prepared = items.map(prepare)
  const allowed = prepared.filter((p) => !neg.some((t) => hasToken(t, p)))

  if (pos.length === 0) {
    return {
      hits: allowed.map((p) => ({ item: p.item, score: 0, reasons: [] })),
      relaxed: false,
      excluded: neg,
    }
  }

  const scored = allowed.map((p) => {
    let total = 0
    let matched = 0
    const reasons: string[] = []
    for (const t of pos) {
      const m = matchToken(t, p)
      if (m.score > 0) {
        matched++
        total += m.score
        if (m.reason && !reasons.includes(m.reason)) reasons.push(m.reason)
      }
    }
    return { p, total, matched, reasons }
  })

  const order = (a: (typeof scored)[number], b: (typeof scored)[number]) =>
    b.matched - a.matched || b.total - a.total || a.p.item.code.localeCompare(b.p.item.code)

  const full = scored.filter((s) => s.matched === pos.length).sort(order)
  if (full.length > 0 || pos.length < 2) {
    return {
      hits: full.map((s) => ({ item: s.p.item, score: s.total, reasons: s.reasons })),
      relaxed: false,
      excluded: neg,
    }
  }
  const near = scored.filter((s) => s.matched > 0).sort(order)
  return {
    hits: near.map((s) => ({ item: s.p.item, score: s.total, reasons: s.reasons })),
    relaxed: near.length > 0,
    excluded: neg,
  }
}
