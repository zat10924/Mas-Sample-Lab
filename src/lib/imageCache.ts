import { idbDel, idbGet, idbSet } from './idb'

/** نسخة من الصور على الجهاز عشان تظهر بدون إنترنت (آخر 200 صورة اتشافت) */
const INDEX_KEY = 'img-index'
const MAX_IMAGES = 200

export async function hasCachedImage(path: string): Promise<boolean> {
  try {
    return (await idbGet<Blob>(`img:${path}`)) !== undefined
  } catch {
    return false
  }
}

export async function cacheImage(path: string, url: string): Promise<void> {
  try {
    if (await hasCachedImage(path)) return
    const res = await fetch(url)
    if (!res.ok) return
    await idbSet(`img:${path}`, await res.blob())
    const index = (await idbGet<string[]>(INDEX_KEY)) ?? []
    const next = [path, ...index.filter((p) => p !== path)]
    await idbSet(INDEX_KEY, next.slice(0, MAX_IMAGES))
    for (const old of next.slice(MAX_IMAGES)) await idbDel(`img:${old}`)
  } catch {
    // التخزين اختياري: لو فشل الصورة بتفضل شغالة أونلاين
  }
}

/** رابط محلي للصورة المخزّنة، أو null لو مش متخزّنة */
export async function cachedImageUrl(path: string): Promise<string | null> {
  try {
    const blob = await idbGet<Blob>(`img:${path}`)
    return blob ? URL.createObjectURL(blob) : null
  } catch {
    return null
  }
}
