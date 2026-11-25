import type { RecipeWithIngredients } from '../../types/db'
import { formatGrams, formatNumber, ingredientGrams } from '../../lib/units'

/** جدول الكميات المحسوبة لتركيبة عند كمية معينة من الجليز (بالكيلوجرام) */
export default function AmountsTable({
  recipe,
  kg,
}: {
  recipe: RecipeWithIngredients
  kg: number
}) {
  const baseLabel = recipe.basis === 'per_kg' ? 'جليز شفاف' : 'جليز'
  const addedGrams = recipe.ingredients.reduce(
    (sum, ing) => sum + ingredientGrams(ing.amount, recipe.basis, kg),
    0,
  )
  const totalKg = kg + addedGrams / 1000

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="bg-page text-mute">
          <tr>
            <th className="px-3 py-2 text-start font-semibold">المكوّن</th>
            <th className="px-3 py-2 text-end font-semibold">
              {recipe.basis === 'per_kg' ? 'جم / كجم' : 'النسبة %'}
            </th>
            <th className="px-3 py-2 text-end font-semibold">الكمية</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          <tr>
            <td className="px-3 py-2 font-medium">{baseLabel}</td>
            <td className="px-3 py-2 text-end text-faint">—</td>
            <td className="px-3 py-2 text-end font-semibold">{formatNumber(kg, 3)} كجم</td>
          </tr>
          {recipe.ingredients.map((ing) => (
            <tr key={ing.id}>
              <td className="px-3 py-2">{ing.material}</td>
              <td className="px-3 py-2 text-end text-mute">{formatNumber(ing.amount)}</td>
              <td className="px-3 py-2 text-end font-semibold">
                {formatGrams(ingredientGrams(ing.amount, recipe.basis, kg))}
              </td>
            </tr>
          ))}
          <tr className="bg-page">
            <td className="px-3 py-2 font-bold" colSpan={2}>الإجمالي النهائي</td>
            <td className="px-3 py-2 text-end font-bold">{formatNumber(totalKg, 3)} كجم</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
