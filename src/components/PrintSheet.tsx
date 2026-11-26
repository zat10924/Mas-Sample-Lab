import type { ReactNode } from 'react'
import icon from '../assets/icon-192.png'

/** ورقة طباعة A4 موحّدة (ترويسة بهوية MAS + بيانات + توقيعات). بتظهر في الطباعة / حفظ PDF فقط */
export default function PrintSheet({ docType, code, children }: { docType: string; code: string; children: ReactNode }) {
  return (
    <div className="print-sheet hidden print:block" dir="rtl">
      <div className="print-head">
        <div className="print-head-brand">
          <img src={icon} alt="" className="print-logo" />
          <div>
            <div className="print-brand">
              مختبر <span>الماس</span>
            </div>
            <div className="print-tag">للخزف والصيني · MAS Sample Lab</div>
          </div>
        </div>
        <div className="print-head-doc">
          <div className="print-doc">{docType}</div>
          <div dir="ltr" className="print-code">
            {code}
          </div>
          <div className="print-date">تاريخ الطباعة: {new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
      {children}
      <div className="print-foot">
        <span>أعدّها</span>
        <span>راجعها</span>
        <span>اعتمدها</span>
      </div>
      <div className="print-end">مستند صادر من نظام مختبر الماس · {code}</div>
    </div>
  )
}
