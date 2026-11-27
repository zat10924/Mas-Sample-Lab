import { useCallback, useEffect, useState } from 'react'

/** تفضيلات بسيطة على الجهاز (localStorage) مع نسخة في الذاكرة لو التخزين مقفول */
const mem = new Map<string, unknown>()
const EVENT = 'lab-pref-changed'

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch {
    // تجاهل: نرجع للقيمة اللي في الذاكرة
  }
  return mem.has(key) ? (mem.get(key) as T) : fallback
}

export function writePref<T>(key: string, value: T): void {
  mem.set(key, value)
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // تجاهل
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }))
}

export function usePref<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readPref(key, fallback))

  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) setValue(readPref(key, fallback))
    }
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === 'function' ? (v as (prev: T) => T)(readPref(key, fallback)) : v
      writePref(key, next)
    },
    [key], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return [value, set]
}
