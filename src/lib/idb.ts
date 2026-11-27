/** مخزن بسيط (مفتاح/قيمة) على IndexedDB: سعته أكبر بكتير من localStorage، وبيشتغل بدون نت */
const DB_NAME = 'mas-lab-kv'
const STORE = 'kv'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error ?? new Error('تعذّر فتح التخزين المحلي'))
      }
    })
  }
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = action(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error ?? new Error('فشل التخزين المحلي'))
    tx.onabort = () => reject(tx.error ?? new Error('اتلغى التخزين المحلي'))
  })
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>('readonly', (s) => s.get(key) as IDBRequest<T | undefined>)
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  await run('readwrite', (s) => s.put(value, key))
}

export async function idbDel(key: string): Promise<void> {
  await run('readwrite', (s) => s.delete(key))
}

export async function idbClear(): Promise<void> {
  await run('readwrite', (s) => s.clear())
}
