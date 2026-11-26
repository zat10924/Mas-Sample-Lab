const KEY = 'lab-return-to'

/** بنحفظ الصفحة المطلوبة قبل تسجيل الدخول (مثلًا لما حد يمسح QR) */
export function rememberReturnPath(path: string): void {
  try {
    if (path && path !== '/' && path !== '/login') sessionStorage.setItem(KEY, path)
  } catch {
    // تجاهل
  }
}

export function readReturnPath(): string {
  try {
    const v = sessionStorage.getItem(KEY)
    if (v && v.startsWith('/') && !v.startsWith('//')) return v
  } catch {
    // تجاهل
  }
  return '/'
}

export function clearReturnPath(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // تجاهل
  }
}
