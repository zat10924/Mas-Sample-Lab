import { useEffect, useRef, useState, type RefObject } from 'react'

/** true أول ما العنصر يقرب من الشاشة (مرة واحدة). بنستخدمه عشان الصور تتحمّل وقت الحاجة بس */
export function useInView<T extends Element>(rootMargin = '200px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (seen) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])

  return [ref, seen]
}
