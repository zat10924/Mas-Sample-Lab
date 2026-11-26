import icon from '../assets/icon-192.png'

/** شاشة فتح البرنامج: شعار بحلقة ذهبية دوّارة + شريط تقدّم، بدون أي نص "جاري التحميل" */
export function SplashScreen() {
  return (
    <div className="splash" role="status" aria-busy="true" aria-label="مختبر الماس">
      <div className="splash-mark">
        <span className="splash-ring" />
        <img src={icon} alt="" className="splash-logo" />
      </div>
      <div className="splash-title">
        مختبر <span>الماس</span>
      </div>
      <div className="splash-sub">للخزف والصيني</div>
      <div className="splash-bar">
        <i />
      </div>
    </div>
  )
}

/** تحميل داخل الصفحة: هيكل رمادي بيلمع بشكل الصفحة نفسها + شريط ذهبي رفيع */
export function PageLoader() {
  return (
    <div className="fade-in space-y-4" role="status" aria-busy="true" aria-label="تحميل">
      <div className="loader-line">
        <i />
      </div>
      <div className="flex items-center gap-3">
        <div className="skeleton h-11 w-11 shrink-0 !rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/5" />
          <div className="skeleton h-3 w-1/4" />
        </div>
      </div>
      <div className="skeleton h-44" />
      <div className="skeleton h-28" />
    </div>
  )
}

/** تحميل صغير جوه كارت: شعار صغير بحلقة دوّارة + سطور بتلمع */
export function MiniLoader() {
  return (
    <div className="fade-in flex items-center gap-3 py-3" role="status" aria-busy="true" aria-label="تحميل">
      <span className="mini-loader-ring">
        <img src={icon} alt="" />
      </span>
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  )
}

/** دوّارة صغيرة جوه الأزرار أثناء الحفظ/الرفع/التحليل */
export function InlineSpinner() {
  return <span className="btn-spin" aria-hidden="true" />
}
