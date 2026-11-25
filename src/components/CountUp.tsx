import { useEffect, useState } from 'react'

/** رقم بيعدّ من صفر للقيمة بحركة ناعمة */
export default function CountUp({ value, duration = 700, suffix = '' }: { value: number; duration?: number; suffix?: string }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <>
      {shown}
      {suffix}
    </>
  )
}
