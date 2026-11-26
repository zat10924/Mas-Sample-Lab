import type { ReactNode } from 'react'

/** ورقة طباعة A4 موحّدة (ترويسة المعمل + توقيعات). بتظهر في الطباعة / حفظ PDF فقط */
export default function PrintSheet({ docType, code, children }: { docType: string; code: string; children: ReactNode }) {
  return (
    <div className="print-sheet hidden print:block" dir="rtl">
      <div className="print-head">
        <div>
          <div className="print-brand">مختبر الماس · MAS Sample Lab</div>
          <div className="print-doc">{docType}</div>
        </div>
        <div className="print-meta">
          <div dir="ltr" className="print-code">
            {code}
          </div>
          <div>تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
      {children}
      <div className="print-foot">
        <span>أعدّها</span>
        <span>راجعها</span>
        <span>اعتمدها</span>
      </div>
    </div>
  )
}
