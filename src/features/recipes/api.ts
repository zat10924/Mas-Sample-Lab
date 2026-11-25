import { supabase } from '../../lib/supabase'
import type {
  Recipe,
  RecipeBasis,
  RecipeIngredient,
  RecipeType,
  RecipeWithIngredients,
} from '../../types/db'

export type RecipeListItem = Recipe & { ingredients: Pick<RecipeIngredient, 'id' | 'material'>[] }

export async function listRecipes(): Promise<RecipeListItem[]> {
  const { data, error } = await supabase
    .from('lab_recipes')
    .select('*, ingredients:lab_recipe_ingredients(id,material)')
    .eq('is_active', true)
    .order('code')
  if (error) throw error
  return (data ?? []) as RecipeListItem[]
}

export async function getRecipe(id: string): Promise<RecipeWithIngredients> {
  const { data, error } = await supabase
    .from('lab_recipes')
    .select('*, ingredients:lab_recipe_ingredients(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  const recipe = data as RecipeWithIngredients
  recipe.ingredients = [...recipe.ingredients].sort((a, b) => a.sort_order - b.sort_order)
  return recipe
}

export interface RecipeInput {
  code: string
  name: string
  type: RecipeType
  basis: RecipeBasis
  batch_base_kg: number | null
  density: number | null
  notes: string | null
}

export interface IngredientInput {
  material: string
  amount: number
  batch_grams: number | null
}

/**
 * يحفظ التركيبة ومكوناتها. للتعديل: نضيف المكونات الجديدة أولًا ثم نحذف القديمة،
 * حتى لو حصل خطأ في النص ما تضيعش المكونات الأصلية.
 */
export async function saveRecipe(
  id: string | null,
  input: RecipeInput,
  ingredients: IngredientInput[],
): Promise<string> {
  let recipeId = id
  let oldIds: string[] = []

  if (id) {
    const { error } = await supabase.from('lab_recipes').update(input).eq('id', id)
    if (error) throw error
    const { data: old, error: oldError } = await supabase
      .from('lab_recipe_ingredients')
      .select('id')
      .eq('recipe_id', id)
    if (oldError) throw oldError
    oldIds = (old ?? []).map((o: { id: string }) => o.id)
  } else {
    const { data, error } = await supabase.from('lab_recipes').insert(input).select('id').single()
    if (error) throw error
    recipeId = (data as { id: string }).id
  }

  const rows = ingredients.map((ing, index) => ({
    recipe_id: recipeId,
    material: ing.material,
    amount: ing.amount,
    batch_grams: ing.batch_grams,
    sort_order: index,
  }))
  if (rows.length > 0) {
    const { error } = await supabase.from('lab_recipe_ingredients').insert(rows)
    if (error) throw error
  }
  if (oldIds.length > 0) {
    const { error } = await supabase.from('lab_recipe_ingredients').delete().in('id', oldIds)
    if (error) throw error
  }
  return recipeId as string
}

/** التركيبة عليها عينات مسجلة فمش ممكن تتحذف (ممكن تتأرشف بدل كده) */
export class RecipeInUseError extends Error {
  constructor() {
    super('مش ممكن تحذف التركيبة لأن فيه عينات مسجلة عليها')
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  // select() بيرجّع الصفوف اللي اتحذفت فعلًا، فنعرف لو الحذف اتمنع بصمت بسبب الصلاحيات
  const { data, error } = await supabase.from('lab_recipes').delete().eq('id', id).select('id')
  if (error) {
    if (error.code === '23503') throw new RecipeInUseError()
    throw error
  }
  if (!data || data.length === 0) {
    throw new Error('الحذف مرفوض: محتاج صلاحية مدير بتعديل في المختبر')
  }
}

/** إخفاء التركيبة من المكتبة من غير حذفها (العينات القديمة تفضل مرتبطة بيها) */
export async function archiveRecipe(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('lab_recipes')
    .update({ is_active: false })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('مفيش صلاحية لأرشفة التركيبة')
}
