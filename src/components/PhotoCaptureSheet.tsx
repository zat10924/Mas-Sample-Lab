import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { addResultImage, analyzeResult, listSamples } from '../features/samples/api'
import { enqueuePhoto } from '../lib/photoQueue'
import { finalCodeOf } from '../lib/stats'
import { Icon } from './Icon'
import { InlineSpinner } from './Loader'
import Sheet from './Sheet'
import { useToast } from './Toast'
import { SearchBox, StatusBadge, errorMessage } from './ui'

/** كاميرا أولًا: اختار العينة، صوّر، والصورة بتتحلل بالذكاء الاصطناعي وتفتح لك للمراجعة */
export default function PhotoCaptureSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const pending = useRef<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({ queryKey: ['samples'], queryFn: () => listSamples(), enabled: open })

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data ?? [])
      .filter((s) => s.status !== 'reviewed' && !finalCodeOf(s))
      .filter(
        (s) =>
          !term ||
          s.code.toLowerCase().includes(term) ||
          (s.recipe?.name ?? '').toLowerCase().includes(term) ||
          (s.recipe?.code ?? '').toLowerCase().includes(term),
      )
      .slice(0, 20)
  }, [data, q])

  function choose(id: string) {
    if (busyId) return
    pending.current = id
    input.current?.click()
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const id = pending.current
    if (!file || !id) return
    setBusyId(id)
    try {
      if (!navigator.onLine) {
        await enqueuePhoto(id, file)
        toast('مفيش نت: الصورة اتحفظت على الجهاز وهتترفع لوحدها لما النت يرجع', 'info')
        onClose()
        return
      }
      const saved = await addResultImage(id, file)
      try {
        await analyzeResult(saved.id)
      } catch {
        // التحليل اختياري: تقدر تشغّله من صفحة العينة
      }
      await queryClient.invalidateQueries({ queryKey: ['samples'] })
      await queryClient.invalidateQueries({ queryKey: ['sample', id] })
      await queryClient.invalidateQueries({ queryKey: ['results'] })
      toast('اتسجلت الصورة')
      onClose()
      navigate(`/samples/${id}`)
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="تصوير نتيجة">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e)} />
      <p className="mb-3 text-sm text-mute">اختار العينة وهتفتح الكاميرا مباشرة، وبعدها الصورة بتتحلل لوحدها.</p>
      <SearchBox className="mb-3" placeholder="كود العينة أو التركيبة..." value={q} onChange={setQ} />
      {isLoading && <div className="skeleton h-24" />}
      {!isLoading && list.length === 0 && <div className="py-6 text-center text-sm text-mute">مفيش عينات مستنية صورة</div>}
      <ul className="divide-y divide-line">
        {list.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => choose(s.id)}
              disabled={busyId !== null}
              className="flex w-full items-center gap-3 py-3 text-start disabled:opacity-60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                {busyId === s.id ? <InlineSpinner /> : <Icon name="camera" size={19} />}
              </span>
              <span className="min-w-0 flex-1">
                <span dir="ltr" className="block truncate text-start text-sm font-extrabold">
                  {s.code}
                </span>
                <span className="block truncate text-xs text-mute">{s.recipe?.name ?? 'بدون تركيبة'}</span>
              </span>
              <StatusBadge status={s.status} />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
