/** أسماء أدوار برنامج المصنع بالعربي (نفس ROLE_AR في common.js) */
export const ROLE_AR: Record<string, string> = {
  admin: 'مدير',
  owner: 'صاحب المصنع',
  manager: 'مسؤول قسم',
  worker: 'مسجّل إنتاج',
}

export const LEVEL_AR: Record<string, string> = {
  none: 'بدون وصول',
  edit: 'تعديل',
  view: 'عرض فقط',
}

export function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme')
  const isDark =
    current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const next = isDark ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try {
    // نفس المفتاح اللي بيستخدمه برنامج المصنع، فالاختيار بيتشارك بينهم
    localStorage.setItem('theme', next)
  } catch {
    // تجاهل: الوضع هيفضل لحد ما الصفحة تتقفل
  }
}

export type ThemeMode = 'auto' | 'light' | 'dark'
export type FontSize = 'sm' | 'md' | 'lg'

/** وضع المظهر الحالي: تلقائي (بيتبع الجهاز) أو فاتح أو داكن */
export function getThemeMode(): ThemeMode {
  const v = document.documentElement.getAttribute('data-theme')
  return v === 'light' || v === 'dark' ? v : 'auto'
}

export function setThemeMode(mode: ThemeMode): void {
  if (mode === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', mode)
  try {
    if (mode === 'auto') localStorage.removeItem('theme')
    else localStorage.setItem('theme', mode)
  } catch {
    // تجاهل
  }
}

const FONT_PX: Record<FontSize, string> = { sm: '15px', md: '16px', lg: '18px' }
const FONT_KEY = 'lab-font-size'

export function getFontSize(): FontSize {
  try {
    const v = localStorage.getItem(FONT_KEY)
    if (v === 'sm' || v === 'lg') return v
  } catch {
    // تجاهل
  }
  return 'md'
}

export function setFontSize(size: FontSize): void {
  document.documentElement.style.fontSize = FONT_PX[size]
  try {
    localStorage.setItem(FONT_KEY, size)
  } catch {
    // تجاهل
  }
}

/** بيطبّق حجم الخط المحفوظ عند فتح البرنامج */
export function applyStoredFontSize(): void {
  document.documentElement.style.fontSize = FONT_PX[getFontSize()]
}
