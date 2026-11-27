import type { QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { loadDashboard } from '../features/dashboard/api'
import { getSignedUrl } from '../features/samples/api'
import { hasCachedImage } from './imageCache'
import { writePref } from './prefs'
import type {
  RecipeWithIngredients,
  SampleComponent,
  SampleDetail,
  SampleListItem,
  SampleResult,
} from '../types/db'
import type { RecipeListItem } from '../features/recipes/api'

const PAGE = 1000
const IMAGES_TO_CACHE = 30

async function pageAll<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const rows = (Array.isArray(data) ? data : []) as T[]
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}

type RecipeRow = RecipeWithIngredients
type SampleRow = SampleDetail

/**
 * تحميل كل بيانات المختبر مرة واحدة (بعدد قليل من الطلبات) وتوزيعها على كاش كل الصفحات،
 * فكل التبويبات والتفاصيل تفتح بدون إنترنت.
 */
export async function syncOffline(queryClient: QueryClient): Promise<void> {
  const [recipeRows, sampleRows, resultRows] = await Promise.all([
    pageAll<RecipeRow>((a, b) =>
      supabase.from('lab_recipes').select('*, ingredients:lab_recipe_ingredients(*)').order('code').range(a, b),
    ),
    pageAll<SampleRow>((a, b) =>
      supabase
        .from('lab_samples')
        .select('*, recipe:lab_recipes(id,code,name,type,basis)')
        .order('created_at', { ascending: false })
        .range(a, b),
    ),
    pageAll<SampleResult>((a, b) =>
      supabase.from('lab_sample_results').select('*').order('created_at', { ascending: false }).range(a, b),
    ),
  ])

  let componentRows: SampleComponent[] = []
  try {
    componentRows = await pageAll<SampleComponent>((a, b) =>
      supabase.from('lab_sample_components').select('*').order('sort_order', { ascending: true }).range(a, b),
    )
  } catch {
    // جدول المكونات لسه ما اتعملش (004): نكمّل بدونه
  }

  // ----- التركيبات -----
  for (const r of recipeRows) {
    queryClient.setQueryData<RecipeWithIngredients>(['recipe', r.id], {
      ...r,
      ingredients: [...r.ingredients].sort((x, y) => x.sort_order - y.sort_order),
    })
  }
  const recipeList: RecipeListItem[] = recipeRows
    .filter((r) => r.is_active)
    .map((r) => ({ ...r, ingredients: r.ingredients.map((i) => ({ id: i.id, material: i.material })) }))
  queryClient.setQueryData(['recipes'], recipeList)

  // ----- العينات -----
  const resultsBySample = new Map<string, SampleResult[]>()
  for (const r of resultRows) resultsBySample.set(r.sample_id, [...(resultsBySample.get(r.sample_id) ?? []), r])
  const compsBySample = new Map<string, SampleComponent[]>()
  for (const c of componentRows) compsBySample.set(c.sample_id, [...(compsBySample.get(c.sample_id) ?? []), c])

  const sampleList: SampleListItem[] = sampleRows.map((s) => {
    const results = resultsBySample.get(s.id) ?? []
    const comps = compsBySample.get(s.id) ?? []
    return {
      ...s,
      recipe: s.recipe ? { code: s.recipe.code, name: s.recipe.name } : null,
      results: results.map((r) => ({ final_code: r.final_code, image_path: r.image_path })),
      components: comps.map((c) => ({ material: c.material, amount: c.amount, unit: c.unit, sort_order: c.sort_order })),
    }
  })

  for (const s of sampleRows) {
    queryClient.setQueryData<SampleDetail>(['sample', s.id], s)
    queryClient.setQueryData<SampleResult[]>(['results', s.id], resultsBySample.get(s.id) ?? [])
    queryClient.setQueryData<SampleComponent[]>(['components', s.id], compsBySample.get(s.id) ?? [])
  }
  queryClient.setQueryData(['samples'], sampleList)
  queryClient.setQueryData(['samples', 'fired'], sampleList.filter((s) => s.status === 'fired'))
  queryClient.setQueryData(['samples', 'recent', 15], sampleList.slice(0, 15))
  queryClient.setQueryData(['samples', 'recent'], sampleList.slice(0, 8))

  try {
    await queryClient.prefetchQuery({ queryKey: ['dashboard'], queryFn: loadDashboard })
  } catch {
    // لوحة التحكم اختيارية
  }

  writePref('lab-last-sync', Date.now())

  // ----- صور آخر العينات (بالتتابع عشان ما نزحمش الشبكة) -----
  let cached = 0
  for (const s of sampleList) {
    if (cached >= IMAGES_TO_CACHE || !navigator.onLine) break
    const path = s.results.find((r) => r.image_path)?.image_path
    if (!path || (await hasCachedImage(path))) continue
    try {
      await getSignedUrl(path) // بيخزّن نسخة محلية في الخلفية
      cached++
    } catch {
      // نكمّل
    }
  }
}
