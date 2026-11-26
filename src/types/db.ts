/** بيانات المستخدم الحالي من دالة lab_me (حسابات برنامج المصنع) */
export type AccessLevel = 'edit' | 'view'

export interface LabMe {
  id: string
  name: string
  /** دور برنامج المصنع: admin / owner / manager / worker */
  role: string
  /** مستوى الوصول للمختبر، أو null لو ممنوع */
  level: AccessLevel | null
}

export interface LabUser {
  id: string
  full_name: string
  role: string
  level: AccessLevel | null
}

export type RecipeType = 'glaze_color' | 'matte' | 'white' | 'base' | 'decoration' | 'body'
export type RecipeBasis = 'per_kg' | 'percent'

export interface RecipeIngredient {
  id: string
  recipe_id: string
  material: string
  amount: number
  batch_grams: number | null
  sort_order: number
}

export interface Recipe {
  id: string
  code: string
  name: string
  type: RecipeType
  basis: RecipeBasis
  batch_base_kg: number | null
  density: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[]
}

export type SampleStatus = 'planned' | 'fired' | 'reviewed'

export interface Sample {
  id: string
  code: string
  recipe_id: string | null
  body_type: string | null
  batch_kg: number
  firing_temp: number | null
  firing_date: string | null
  application_method: string | null
  status: SampleStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** percent = نسبة مئوية من كمية الجليز الأساسي (batch_kg) */
export type ComponentUnit = 'g' | 'kg' | 'ml' | 'l' | 'percent'

/** مكوّن في العينة: جليز شفاف 1 كجم، أكسيد نحاس 20 جم... */
export interface SampleComponent {
  id: string
  sample_id: string
  material: string
  amount: number
  unit: ComponentUnit
  sort_order: number
}

export type Finish = 'G' | 'S' | 'M'
export type ColorMatch = 1 | 2 | 3

export interface AiAnalysis {
  summary: string
  finish: Finish
  color_match: ColorMatch
  defects: string[]
  confidence: number
  notes?: string
}

export interface SampleResult {
  id: string
  sample_id: string
  image_path: string
  ai_analysis: AiAnalysis | null
  ai_suggested_code: string | null
  finish: Finish | null
  color_match: ColorMatch | null
  defects: string[]
  final_code: string | null
  reviewer_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface SampleListItem extends Sample {
  recipe: Pick<Recipe, 'code' | 'name'> | null
  results: (Pick<SampleResult, 'final_code'> & { image_path?: string })[]
  components: Pick<SampleComponent, 'material' | 'amount' | 'unit' | 'sort_order'>[]
}

export interface SampleDetail extends Sample {
  recipe: Pick<Recipe, 'id' | 'code' | 'name' | 'type' | 'basis'> | null
}
