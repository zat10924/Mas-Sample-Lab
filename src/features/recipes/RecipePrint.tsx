import PrintSheet from '../../components/PrintSheet'
import { RECIPE_TYPE_LABELS } from '../../lib/codes'
import { formatGrams, formatNumber, ingredientGrams } from '../../lib/units'
import type { RecipeWithIngredients } from '../../types/db'

/** ورقة طباعة التركيبة بالكميات المحسوبة على الكمية اللي اتكتبت */
export default function RecipePrint({
  recipe,
  kg,
  entered,
  mode,
}: {
  recipe: RecipeWithIngredients
  /** كمية الجليز الأساسي بالكيلو */
  kg: number
  /** الرقم المكتوب في خانة الكمية */
  entered: number
  mode: 'base' | 'total'
}) {
  const baseLabel = recipe.basis === 'per_kg' ? 'جليز شفاف' : 'جليز'
  const addedGrams = recipe.ingredients.reduce((sum, ing) => sum + ingredientGrams(ing.amount, recipe.basis, kg), 0)
  const totalKg = kg + addedGrams / 1000
  const valid = kg > 0 && Number.isFinite(kg)

  return (
    <PrintSheet docType="ورقة تركيبة جليز" code={recipe.code}>
      <h1 className="print-title">{recipe.name}</h1>
      <div className="print-kv">
        <div>
          <b>النوع</b>
          {RECIPE_TYPE_LABELS[recipe.type]}
        </div>
        <div>
          <b>أساس الحساب</b>
          {recipe.basis === 'per_kg' ? 'جرام لكل 1 كجم جليز شفاف' : 'نسبة مئوية من وزن الجليز'}
        </div>
        <div>
          <b>{mode === 'total' ? 'الوزن النهائي المطلوب' : `كمية ${baseLabel}`}</b>
          {formatNumber(entered, 3)} كجم
        </div>
        {mode === 'total' && (
          <div>
            <b>كمية {baseLabel} المحسوبة</b>
            {formatNumber(kg, 3)} كجم
          </div>
        )}
        {recipe.density !== null && (
          <div>
            <b>الكثافة</b>
            {formatNumber(recipe.density)} g/cm³
          </div>
        )}
      </div>

      {valid ? (
        <table className="print-table">
          <thead>
            <tr>
              <th className="tick">✓</th>
              <th>م</th>
              <th>المكوّن</th>
              <th className="num">{recipe.basis === 'per_kg' ? 'جم / كجم' : 'النسبة %'}</th>
              <th className="num">الكمية</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="tick">
                <span className="print-box" />
              </td>
              <td>1</td>
              <td>
                <b>{baseLabel}</b>
              </td>
              <td className="num">—</td>
              <td className="num">
                <b>{formatNumber(kg, 3)} كجم</b>
              </td>
            </tr>
            {recipe.ingredients.map((ing, i) => (
              <tr key={ing.id}>
                <td className="tick">
                  <span className="print-box" />
                </td>
                <td>{i + 2}</td>
                <td>{ing.material}</td>
                <td className="num">{formatNumber(ing.amount)}</td>
                <td className="num">
                  <b>{formatGrams(ingredientGrams(ing.amount, recipe.basis, kg))}</b>
                </td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={4}>الإجمالي النهائي</td>
              <td className="num">{formatNumber(totalKg, 3)} كجم</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>اكتب كمية أكبر من صفر قبل الطباعة</p>
      )}

      {recipe.notes && (
        <>
          <h2 className="print-h2">ملاحظات</h2>
          <div className="print-note">{recipe.notes}</div>
        </>
      )}
    </PrintSheet>
  )
}
