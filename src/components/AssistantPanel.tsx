import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { callFunction } from '../lib/functions'
import { Icon } from './Icon'
import MicButton from './MicButton'
import Sheet from './Sheet'
import { errorMessage } from './ui'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = ['إيه سبب الـ pinholes وإزاي أعالجها؟', 'الجليز بيتشقق بعد الحرق، أعمل إيه؟']

/** المساعد العائم: محادثة سريعة من أي صفحة */
export default function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: Msg[] = [...messages, { role: 'user', content }]
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

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <Sheet open={open} onClose={onClose} title="المساعد الذكي">
      <div className="max-h-[46dvh] min-h-[8rem] space-y-2 overflow-y-auto pb-2">
        {messages.length === 0 && (
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="w-full rounded-xl border border-line bg-tint px-3 py-2.5 text-start text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-brand-700 text-white' : 'border border-line bg-surface text-ink'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-faint">المساعد بيكتب...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{error}</div>}
        <div ref={bottom} />
      </div>

      <form onSubmit={onSubmit} className="mt-2 flex items-center gap-2">
        <input
          className="input"
          placeholder="اكتب سؤالك..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
        />
        <MicButton onText={(t) => setInput(t)} />
        <button type="submit" className="btn-primary shrink-0 !px-3.5" disabled={busy || !input.trim()} aria-label="إرسال">
          <Icon name="send" size={16} />
        </button>
      </form>
      <Link to="/assistant" onClick={onClose} className="mt-3 inline-block text-xs font-bold text-brand-700">
        فتح صفحة المساعد كاملة
      </Link>
    </Sheet>
  )
}
