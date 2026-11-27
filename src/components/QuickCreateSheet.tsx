import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import Sheet from './Sheet'
import { speechSupported } from '../lib/useSpeech'

interface Tile {
  key: string
  label: string
  hint: string
  icon: IconName
  to?: string
  onClick?: () => void
}

/** قائمة الإنشاء السريع: زرار + في الشريط السفلي */
export default function QuickCreateSheet({
  open,
  onClose,
  onPhoto,
  onVoice,
}: {
  open: boolean
  onClose: () => void
  onPhoto: () => void
  onVoice: () => void
}) {
  const tiles: Tile[] = [
    { key: 'sample', label: 'عينة جديدة', hint: 'سجّل عينة وكمّل بياناتها', icon: 'vase', to: '/samples/new' },
    { key: 'recipe', label: 'تركيبة جديدة', hint: 'ضيف تركيبة ومكوّناتها', icon: 'flask', to: '/recipes/new' },
    { key: 'photo', label: 'تصوير نتيجة', hint: 'صوّر عينة محروقة وحلّلها', icon: 'camera', onClick: onPhoto },
  ]
  if (speechSupported()) {
    tiles.push({ key: 'voice', label: 'إدخال صوتي', hint: 'قول: عينة GL-005 حرق 1200', icon: 'mic', onClick: onVoice })
  }

  const cls = 'flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-start transition active:scale-[0.98]'
  const body = (t: Tile) => (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon name={t.icon} size={21} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{t.label}</span>
        <span className="block truncate text-xs text-mute">{t.hint}</span>
      </span>
    </>
  )

  return (
    <Sheet open={open} onClose={onClose} title="إنشاء سريع">
      <div className="grid gap-2 sm:grid-cols-2">
        {tiles.map((t) =>
          t.to ? (
            <Link key={t.key} to={t.to} onClick={onClose} className={cls}>
              {body(t)}
            </Link>
          ) : (
            <button
              key={t.key}
              type="button"
              className={cls}
              onClick={() => {
                onClose()
                t.onClick?.()
              }}
            >
              {body(t)}
            </button>
          ),
        )}
      </div>
    </Sheet>
  )
}
