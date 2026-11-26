import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { addResultImage } from '../features/samples/api'
import { countQueued, flushQueue, QUEUE_EVENT } from '../lib/photoQueue'
import { useOnline } from '../lib/useOnline'
import { useToast } from './Toast'
import { Icon } from './Icon'

/** شريط حالة الاتصال + رفع الصور المتخزنة تلقائيًا لما النت يرجع */
export default function OfflineStatus() {
  const online = useOnline()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [pending, setPending] = useState(0)

  const recount = useCallback(() => {
    countQueued()
      .then(setPending)
      .catch(() => setPending(0))
  }, [])

  useEffect(() => {
    recount()
    window.addEventListener(QUEUE_EVENT, recount)
    return () => window.removeEventListener(QUEUE_EVENT, recount)
  }, [recount])

  const hasPending = pending > 0
  useEffect(() => {
    if (!online) return
    const sync = () => {
      flushQueue(addResultImage)
        .then(async ({ uploaded }) => {
          if (uploaded === 0) return
          toast(`اترفعت ${uploaded} صورة كانت مستنية النت`)
          await queryClient.invalidateQueries({ queryKey: ['results'] })
          await queryClient.invalidateQueries({ queryKey: ['samples'] })
          await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        })
        .catch(() => undefined)
    }
    sync()
    if (!hasPending) return
    const timer = window.setInterval(sync, 60_000)
    return () => window.clearInterval(timer)
  }, [online, hasPending, queryClient, toast])

  if (online && !hasPending) return null

  return (
    <div
      role="status"
      className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold lg:mb-4 ${
        online ? 'bg-sky-100 text-sky-900' : 'bg-amber-100 text-amber-900'
      }`}
    >
      <Icon name={online ? 'upload' : 'alert'} size={16} className="mt-0.5 shrink-0" />
      <span>
        {online
          ? `بنرفع ${pending} صورة كانت مستنية النت…`
          : `مفيش إنترنت: بتشوف آخر بيانات اتحمّلت. الصور اللي هتصوّرها هتتحفظ على الجهاز وتترفع لوحدها لما النت يرجع${
              hasPending ? ` (${pending} مستنية)` : ''
            }.`}
      </span>
    </div>
  )
}
