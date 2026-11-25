import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  text: string
  tone: Tone
}
interface ToastApi {
  toast: (text: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastApi>({ toast: () => undefined })

export function useToast(): ToastApi {
  return useContext(ToastContext)
}

const TONE_STYLE: Record<Tone, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-ink text-surface',
}
const TONE_MARK: Record<Tone, string> = { success: '✓', error: '!', info: 'i' }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback((text: string, tone: Tone = 'success') => {
    const id = nextId.current++
    setItems((prev) => [...prev.slice(-2), { id, text, tone }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 5000 : 2800)
  }, [])

  const api = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-lg ${TONE_STYLE[t.tone]}`}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/25 text-xs">{TONE_MARK[t.tone]}</span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
