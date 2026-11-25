import type { Count } from '../lib/stats'

/** أعمدة أفقية بسيطة (بدون مكتبات رسوم) */
export function Bars({ items, tone = 'bg-brand-600' }: { items: Count[]; tone?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-2 text-sm">
          <span className="w-16 shrink-0 truncate text-mute">{i.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-tint">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
          <span className="w-7 shrink-0 text-end font-bold tabular-nums">{i.count}</span>
        </div>
      ))}
    </div>
  )
}
