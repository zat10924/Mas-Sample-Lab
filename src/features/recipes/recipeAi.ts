import { callFunction } from '../../lib/functions'
import type { RecipeParseResult } from '../../lib/recipeDraft'

/** يرسل نص التركيبة إلى lab-ai (صلاحية تعديل). النتيجة مسودة للمراجعة: لا يُحفظ شيء */
export function parseRecipeText(text: string, materials: string[]): Promise<RecipeParseResult> {
  return callFunction<RecipeParseResult>('lab-ai', { action: 'recipe_parse', text, materials })
}

/** أسماء الخامات المعروفة من كل التركيبات (بدون تكرار) */
export function materialNames(recipes: { ingredients: { material: string }[] }[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.material)))].sort((a, b) => a.localeCompare(b, 'ar'))
}
