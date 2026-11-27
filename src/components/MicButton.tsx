import { useEffect } from 'react'
import { Icon } from './Icon'
import { speechSupported, useSpeech } from '../lib/useSpeech'

/** زرار ميكروفون للإدخال الصوتي. مش بيظهر لو المتصفح مش بيدعمه */
export default function MicButton({
  onText,
  autoStart = false,
  className = '',
}: {
  onText: (text: string, final: boolean) => void
  autoStart?: boolean
  className?: string
}) {
  const { listening, start, stop } = useSpeech(onText)

  useEffect(() => {
    if (autoStart) start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!speechSupported()) return null
  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      aria-label={listening ? 'إيقاف التسجيل' : 'إدخال صوتي'}
      aria-pressed={listening}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${
        listening ? 'mic-live bg-red-600 text-white' : 'bg-tint text-mute hover:text-ink'
      } ${className}`}
    >
      <Icon name="mic" size={16} />
    </button>
  )
}
