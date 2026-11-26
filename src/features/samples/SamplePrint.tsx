import { useQuery } from '@tanstack/react-query'
import PrintSheet from '../../components/PrintSheet'
import { STATUS_LABELS } from '../../components/ui'
import { describeResultCode } from '../../lib/codes'
import { formatComponent, formatGrams, formatNumber, ingredientGrams, totalWeightGrams } from '../../lib/units'
import { getSignedUrl } from './api'
import type { RecipeWithIngredients, SampleComponent, SampleDetail, SampleResult } from '../../types/db'

/** ورقة طباعة العينة: البيانات + المكونات + الكميات المرجعية + النتيجة والصورة */
export default function SamplePrint({
  sample: s,
  components,
  recipe,
  results,
}: {
  sample: SampleDetail
  components: SampleComponent[]
  recipe: RecipeWithIngredients | undefined
  results: SampleResult[]
}) {
  const main = results.find((r) => r.final_code) ?? results[0]
  const img = useQuery({
    queryKey: ['signed-url', main?.image_path],
    queryFn: () => getSignedUrl(main!.image_path),
    enabled: !!main,
    staleTime: 30 * 60 * 1000,
  })
  const weight = totalWeightGrams(components)

  return (
    <PrintSheet docType="ورقة عينة جليز" code={s.code}>
      <h1 className="print-title">{s.recipe ? `${s.recipe.name} (${s.recipe.code})` : 'عينة بمكونات مخصصة'}</h1>

      <div className="print-kv">
        <div>
          <b>الحالة: </b>
          {STATUS_LABELS[s.status]}
        </div>
        <div>
          <b>تاريخ التسجيل: </b>
          {new Date(s.created_at).toLocaleDateString('en-GB')}
        </div>
        <div>
          <b>كمية الجليز الأساسي: </b>
          {formatNumber(s.batch_kg, 3)} كجم
        </div>
        <div>
          <b>نوع البدن: </b>
          {s.body_type ?? '—'}
        </div>
        <div>
          <b>درجة الحرق: </b>
          {s.firing_temp ? `${s.firing_temp}°م` : '—'}
        </div>
        <div>
          <b>تاريخ الحرق: </b>
          {s.firing_date ?? '—'}
        </div>
        <div>
          <b>طريقة التطبيق: </b>
          {s.application_method ?? '—'}
        </div>
      </div>

      {components.length > 0 && (
        <>
          <h2 className="print-h2">مكونات العينة</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th className="tick">✓</th>
                <th>م</th>
                <th>المكوّن</th>
                <th className="num">الكمية</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
                <tr key={c.id}>
                  <td className="tick">
                    <span className="print-box" />
                  </td>
                  <td>{i + 1}</td>
                  <td>{c.material}</td>
                  <td className="num">
                    <b>{formatComponent(c.amount, c.unit)}</b>
                  </td>
                </tr>
              ))}
              {weight > 0 && (
                <tr className="total">
                  <td colSpan={3}>إجمالي الوزن</td>
                  <td className="num">{formatGrams(weight)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {recipe && (
        <>
          <h2 className="print-h2">
            الكميات المرجعية من التركيبة {recipe.code} على {formatNumber(s.batch_kg, 3)} كجم
          </h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>المكوّن</th>
                <th className="num">الكمية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{recipe.basis === 'per_kg' ? 'جليز شفاف' : 'جليز'}</td>
                <td className="num">{formatNumber(s.batch_kg, 3)} كجم</td>
              </tr>
              {recipe.ingredients.map((ing) => (
                <tr key={ing.id}>
                  <td>{ing.material}</td>
                  <td className="num">{formatGrams(ingredientGrams(ing.amount, recipe.basis, s.batch_kg))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {main?.final_code && (
        <>
          <h2 className="print-h2">نتيجة ما بعد الحرق</h2>
          <div>
            <span className="print-result">{main.final_code}</span>
            <span style={{ marginInlineStart: '10pt' }}>{describeResultCode(main.final_code)}</span>
          </div>
          {main.reviewer_notes && <div className="print-note">{main.reviewer_notes}</div>}
        </>
      )}
      {img.data && (
        <div style={{ marginTop: '8pt' }}>
          <img className="print-img" src={img.data} alt="صورة العينة بعد الحرق" />
        </div>
      )}

      {s.notes && (
        <>
          <h2 className="print-h2">ملاحظات</h2>
          <div className="print-note">{s.notes}</div>
        </>
      )}
    </PrintSheet>
  )
}
