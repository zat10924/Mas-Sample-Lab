/** روابط البرنامج: في تطبيق الموبايل (Capacitor) العنوان الداخلي https://localhost مش صالح للمشاركة، فنستخدم الرابط العام */
const PUBLIC_URL: string = import.meta.env.VITE_PUBLIC_URL || 'https://zat10924.github.io/mas-sample-lab/'

export function isNativeApp(): boolean {
  const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!c?.isNativePlatform?.()
}

/** رابط الصفحة الرئيسية للبرنامج (من غير #) */
export function appBaseUrl(): string {
  return isNativeApp() ? PUBLIC_URL : window.location.origin + window.location.pathname
}

/** رابط الصفحة الحالية، صالح للمشاركة (واتساب...) */
export function currentPageUrl(): string {
  return isNativeApp() ? PUBLIC_URL + window.location.hash : window.location.href
}
