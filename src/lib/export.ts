/** تصدير جدول كملف CSV يفتح في Excel بالعربي (UTF-8 مع BOM) */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** يفتح نافذة الطباعة، ومنها "حفظ كـ PDF" */
export function printPage(): void {
  window.print()
}

/** يطبع الصفحة بعنوان مخصص (بيبقى اسم ملف الـ PDF) ويرجّع العنوان القديم بعد الطباعة */
export function printDocument(title: string): void {
  const old = document.title
  document.title = title
  const restore = () => {
    document.title = old
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
  // احتياطي لو afterprint ما اتطلقش (بعض متصفحات الموبايل)
  window.setTimeout(restore, 60_000)
}
