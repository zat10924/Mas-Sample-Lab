/**
 * طابور رفع الصور بدون إنترنت: الصورة بتتحفظ على الجهاز (IndexedDB) وبتترفع لوحدها لما النت يرجع.
 */
const DB_NAME = 'mas-lab-offline'
const STORE = 'photos'
export const QUEUE_EVENT = 'lab-photo-queue-changed'

export interface QueuedPhoto {
  id: number
  sampleId: string
  file: Blob
  name: string
  createdAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('تعذّر فتح التخزين المحلي'))
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = action(t.objectStore(STORE))
    t.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    t.onerror = () => {
      db.close()
      reject(t.error ?? new Error('فشل التخزين المحلي'))
    }
    t.onabort = () => {
      db.close()
      reject(t.error ?? new Error('اتلغى التخزين المحلي'))
    }
  })
}

function notify(): void {
  window.dispatchEvent(new Event(QUEUE_EVENT))
}

export async function enqueuePhoto(sampleId: string, file: File): Promise<void> {
  await run('readwrite', (s) => s.add({ sampleId, file, name: file.name, createdAt: Date.now() }))
  notify()
}

export async function listQueued(): Promise<QueuedPhoto[]> {
  const rows = await run<QueuedPhoto[]>('readonly', (s) => s.getAll() as IDBRequest<QueuedPhoto[]>)
  return rows.sort((a, b) => a.id - b.id)
}

export async function countQueued(): Promise<number> {
  return run<number>('readonly', (s) => s.count())
}

async function removeQueued(id: number): Promise<void> {
  await run('readwrite', (s) => s.delete(id))
}

let busy = false

/** يرفع الصور المتخزنة واحدة واحدة. بيقف عند أول فشل (غالبًا النت)، والباقي بيفضل في الطابور */
export async function flushQueue(
  upload: (sampleId: string, file: File) => Promise<unknown>,
): Promise<{ uploaded: number; remaining: number }> {
  if (busy) return { uploaded: 0, remaining: await countQueued() }
  busy = true
  let uploaded = 0
  try {
    for (const item of await listQueued()) {
      const file = item.file instanceof File ? item.file : new File([item.file], item.name || 'photo.jpg', { type: item.file.type || 'image/jpeg' })
      try {
        await upload(item.sampleId, file)
        await removeQueued(item.id)
        uploaded += 1
      } catch (e) {
        // العينة اتحذفت: الصورة ملهاش مكان، فنشيلها بدل ما تعطّل الباقي
        if ((e as { code?: string }).code === '23503') {
          await removeQueued(item.id)
          continue
        }
        break
      }
    }
  } finally {
    busy = false
    notify()
  }
  return { uploaded, remaining: await countQueued() }
}
