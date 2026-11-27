import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { callFunction } from '../../lib/functions'
import { errorMessage, PageTitle } from '../../components/ui'
import MicButton from '../../components/MicButton'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'إيه سبب الـ pinholes في الجليز وإزاي أعالجها؟',
  'الجليز بيتشقق (crazing) بعد الحرق، أعمل إيه؟',
  'إزاي أفرق بين المط المنخفض والمط العالي في التركيبة؟',
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [params] = useSearchParams()
  const autoSent = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    setError(null)
    try {
      const res = await callFunction<{ reply: string }>('lab-ai', { action: 'chat', messages: next })
      setMessages([...next, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // سؤال جاي من البحث الشامل (?q=...)
  useEffect(() => {
    const q = params.get('q')
    if (q && !autoSent.current) {
      autoSent.current = true
      void send(q)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-13rem)] max-w-3xl flex-col lg:min-h-[calc(100dvh-9rem)]">
      <PageTitle icon="sparkles" title="المساعد الذكي" subtitle="اسأل عن الجليز والحرق والعيوب" />

      <div className="flex-1 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="card w-full text-start text-sm text-ink active:bg-page"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-brand-700 text-white' : 'border border-line bg-surface text-ink'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {busy && <div className="text-sm text-faint">المساعد بيكتب...</div>}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-20 mt-4 flex gap-2 bg-page pt-2 lg:bottom-0 lg:pb-2">
        <input
          className="input"
          placeholder="اكتب سؤالك..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
        />
        <MicButton onText={(t) => setInput(t)} />
        <button type="submit" className="btn-primary shrink-0" disabled={busy || !input.trim()}>
            <Icon name="send" size={16} />
            إرسال
        </button>
      </form>
    </div>
  )
}
