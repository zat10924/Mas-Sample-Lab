import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}
interface Recognizer {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: SpeechResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}
type RecognizerCtor = new () => Recognizer

function getCtor(): RecognizerCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && getCtor() !== null
}

/** إدخال صوتي بالعربي (Web Speech API). onText بيتنادى بالنص أثناء الكلام وعند الانتهاء */
export function useSpeech(onText: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false)
  const ref = useRef<Recognizer | null>(null)
  const cb = useRef(onText)
  cb.current = onText

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return false
    const r = new Ctor()
    r.lang = 'ar-EG'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e) => {
      let text = ''
      let final = false
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
        if (e.results[i].isFinal) final = true
      }
      cb.current(text, final)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    ref.current = r
    setListening(true)
    try {
      r.start()
    } catch {
      setListening(false)
    }
    return true
  }, [])

  const stop = useCallback(() => {
    ref.current?.stop()
  }, [])

  useEffect(
    () => () => {
      ref.current?.stop()
    },
    [],
  )

  return { listening, start, stop }
}
