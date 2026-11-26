import PrintSheet from '../../components/PrintSheet'
import { STATUS_LABELS } from '../../components/ui'
import { finalCodeOf, type Count, type LabStats } from '../../lib/stats'
import type { SampleListItem } from '../../types/db'

interface Totals {
  recipes: number
  samples: number
  planned: number
  fired: number
  reviewed: number
}

function Dist({ title, items }: { title: string; items: Count[] }) {
  const rows = items.filter((i) => i.count > 0)
  return (
    <div>
      <table className="print-table">
        <thead>
          <tr>
            <th>{title}</th>
            <th className="num">العدد</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="print-muted">
                —
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td className="num">
                <b>{r.count}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** تقرير المعمل: ورقة A4 بهوية MAS بتظهر في الطباعة / حفظ PDF فقط */
export default function DashboardPrint({
  totals,
  analytics,
  samples,
}: {
  totals: Totals | undefined
  analytics: LabStats
  samples: SampleListItem[]
}) {
  const now = new Date()
  const code = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const maxMonth = Math.max(1, ...analytics.months.map((m) => m.count))
  const latest = samples.slice(0, 15)

  return (
    <PrintSheet docType="تقرير المعمل" code={code}>
      <h1 className="print-title">ملخص نشاط المعمل</h1>
      <p className="print-sub">
        بيانات حتى {now.toLocaleDateString('en-GB')} · {analytics.total} عينة مسجّلة
      </p>

      {totals && (
        <div className="print-kv print-kv-4">
          <div>
            <b>التركيبات</b>
            <span className="big">{totals.recipes}</span>
          </div>
          <div>
            <b>العينات</b>
            <span className="big">{totals.samples}</span>
          </div>
          <div>
            <b>مخططة</b>
            <span className="big">{totals.planned}</span>
          </div>
          <div>
            <b>محروقة وتحتاج تقييم</b>
            <span className="big">{totals.fired}</span>
          </div>
        </div>
      )}

      <h2 className="print-h2">مؤشرات الجودة</h2>
      <div className="print-kv print-kv-3">
        <div>
          <b>نسبة النجاح (بدون عيوب)</b>
          <span className="big">{analytics.cleanRate === null ? '—' : `${analytics.cleanRate}%`}</span>
        </div>
        <div>
          <b>عينات بدون عيوب</b>
          <span className="big">{analytics.clean}</span>
        </div>
        <div>
          <b>عينات تم تقييمها</b>
          <span className="big">
            {analytics.reviewed} <span className="print-muted" style={{ fontSize: '10pt', fontWeight: 500 }}>من {analytics.total}</span>
          </span>
        </div>
      </div>

      <h2 className="print-h2">العينات خلال آخر 6 شهور</h2>
      <table className="print-table">
        <thead>
          <tr>
            <th>الشهر</th>
            <th className="num">العينات</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {analytics.months.map((m) => (
            <tr key={m.key}>
              <td>{m.label}</td>
              <td className="num">
                <b>{m.count}</b>
              </td>
              <td className="print-bar-cell">
                {m.count > 0 && <span className="print-bar" style={{ width: `${(m.count / maxMonth) * 100}%` }} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {analytics.reviewed > 0 && (
        <>
          <h2 className="print-h2">توزيع نتائج التقييم</h2>
          <div className="print-cols3">
            <Dist title="اللمعة" items={analytics.finishes} />
            <Dist title="مطابقة اللون" items={analytics.colors} />
            <Dist title="العيوب" items={analytics.defects} />
          </div>
        </>
      )}

      <h2 className="print-h2">أكثر التركيبات تجربة</h2>
      <table className="print-table">
        <thead>
          <tr>
            <th>الكود</th>
            <th>التركيبة</th>
            <th className="num">العينات</th>
            <th className="num">الناجحة</th>
          </tr>
        </thead>
        <tbody>
          {analytics.topRecipes.map((r) => (
            <tr key={r.key}>
              <td dir="ltr" style={{ textAlign: 'start' }}>
                <b>{r.key}</b>
              </td>
              <td>{r.label}</td>
              <td className="num">{r.total}</td>
              <td className="num">{r.clean}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {latest.length > 0 && (
        <>
          <h2 className="print-h2">آخر العينات</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>كود العينة</th>
                <th>التركيبة / المكونات</th>
                <th>الحالة</th>
                <th>النتيجة</th>
                <th className="num">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((s) => {
                const result = finalCodeOf(s)
                const what = s.recipe
                  ? s.recipe.name
                  : s.components
                      .slice(0, 3)
                      .map((c) => c.material)
                      .join(' + ') || '—'
                return (
                  <tr key={s.id}>
                    <td dir="ltr" style={{ textAlign: 'start' }}>
                      <b>{s.code}</b>
                    </td>
                    <td>{what}</td>
                    <td>{STATUS_LABELS[s.status]}</td>
                    <td>{result ? <span className="print-badge">{result}</span> : <span className="print-muted">—</span>}</td>
                    <td className="num">{new Date(s.firing_date ?? s.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </PrintSheet>
  )
}
