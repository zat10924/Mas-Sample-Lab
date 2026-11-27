import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { idbClear, idbDel, idbGet, idbSet } from './idb'

const KEY = 'query-cache'
let timer: number | undefined
let blocked = false

/** يمنع أي كتابة جاية للكاش (بنستخدمه عند تسجيل الخروج عشان البيانات ما ترجعش) */
export function blockPersist(): void {
  blocked = true
  if (timer) window.clearTimeout(timer)
}

/** يرجّع الكتابة للكاش (بعد تسجيل دخول جديد) */
export function allowPersist(): void {
  blocked = false
}

/** يمسح كل البيانات المحلية (الكاش + الصور) */
export async function clearOfflineData(): Promise<void> {
  blockPersist()
  try {
    await idbClear()
  } catch {
    // تجاهل
  }
  try {
    localStorage.removeItem('mas-lab-cache')
    localStorage.removeItem('lab-offline-user')
    localStorage.removeItem('lab-last-sync')
  } catch {
    // تجاهل
  }
}

/** Persister على IndexedDB بدل localStorage: سعة أكبر لتخزين كل التركيبات والعينات */
export const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => {
    if (blocked) return
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (blocked) return
      try {
        void idbSet(KEY, JSON.parse(JSON.stringify(client))).catch(() => undefined)
      } catch {
        // تجاهل
      }
    }, 1500)
  },
  restoreClient: async () => {
    try {
      return await idbGet<PersistedClient>(KEY)
    } catch {
      return undefined
    }
  },
  removeClient: async () => {
    try {
      await idbDel(KEY)
    } catch {
      // تجاهل
    }
  },
}
