import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSignedUrl } from '../features/samples/api'
import { Icon } from './Icon'

/** مقارنة صورتين بشريط سحب: اسحب يمين وشمال عشان تكشف الفرق */
export default function CompareSlider({
  pathA,
  pathB,
  labelA,
  labelB,
}: {
  pathA: string
  pathB: string
  labelA: string
  labelB: string
}) {
  const [pos, setPos] = useState(50)
  const a = useQuery({ queryKey: ['signed-url', pathA], queryFn: () => getSignedUrl(pathA), staleTime: 30 * 60 * 1000 })
  const b = useQuery({ queryKey: ['signed-url', pathB], queryFn: () => getSignedUrl(pathB), staleTime: 30 * 60 * 1000 })

  if (a.isError || b.isError) return null
  if (!a.data || !b.data) return <div className="skeleton h-64" />

  return (
    <div className="card space-y-2 !p-3">
      <div className="flex items-center justify-between text-xs font-bold text-mute">
        <span dir="ltr">{labelA}</span>
        <span>اسحب للمقارنة</span>
        <span dir="ltr">{labelB}</span>
      </div>
      <div dir="ltr" className="relative h-64 select-none overflow-hidden rounded-xl bg-tint sm:h-80">
        <img src={b.data} alt={`صورة ${labelB}`} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        <img
          src={a.data}
          alt={`صورة ${labelA}`}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-800 shadow-lg">
            <Icon name="compare" size={16} />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="شريط المقارنة"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  )
}
