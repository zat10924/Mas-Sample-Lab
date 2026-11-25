/** أسماء أدوار برنامج المصنع بالعربي (نفس ROLE_AR في common.js) */
export const ROLE_AR: Record<string, string> = {
  admin: 'مدير',
  owner: 'صاحب المصنع',
  manager: 'مسؤول قسم',
  worker: 'مسجّل إنتاج',
}

export const LEVEL_AR: Record<string, string> = {
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
