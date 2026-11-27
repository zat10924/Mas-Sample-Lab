import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncOffline } from '../lib/offlineSync'
import { useOnline } from '../lib/useOnline'
import { useToast } from './Toast'

let announced = false

/** بيحمّل كل البيانات في الخلفية لما النت يكون موجود (عند الفتح، وكل 10 دقايق، وعند رجوع النت) */
export default function OfflineSync() {
  const queryClient = useQueryClient()
  const online = useOnline()
  const { toast } = useToast()
  const running = useRef(false)

  useEffect(() => {
    if (!online) return
    const run = async () => {
      if (running.current) return
      running.current = true
      try {
        await syncOffline(queryClient)
        if (!announced) {
          announced = true
          toast('البيانات جاهزة للعمل بدون إنترنت', 'info')
        }
      } catch {
        // هنحاول تاني في الدورة الجاية
      } finally {
        running.current = false
      }
    }
    void run()
    const timer = window.setInterval(() => void run(), 10 * 60_000)
    return () => window.clearInterval(timer)
  }, [online, queryClient, toast])

  return null
}
