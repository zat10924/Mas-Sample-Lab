import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSampleStatus } from './api'
import { Icon, type IconName } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { errorMessage } from '../../components/ui'
import { finalCodeOf } from '../../lib/stats'
import { resultBadgeClass, sampleTone } from '../../lib/sampleView'
import type { SampleListItem, SampleStatus } from '../../types/db'

const COLS: { status: SampleStatus; label: string; icon: IconName; hint: string }[] = [
  { status: 'planned', label: 'مخططة', icon: 'clock', hint: 'لسه ما اتحرقتش' },
  { status: 'fired', label: 'محروقة', icon: 'flame', hint: 'مستنية التقييم' },
  { status: 'reviewed', label: 'تم التقييم', icon: 'checkCircle', hint: 'النتيجة معتمدة' },
]

/** لوحة مهام: اسحب العينة بين «مخططة» و«محروقة» (التقييم بيتم من صفحة العينة) */
export default function SamplesBoard({ items, canWrite }: { items: SampleListItem[]; canWrite: boolean }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [over, setOver] = useState<SampleStatus | null>(null)

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SampleStatus }) => updateSampleStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['samples'] })
      await queryClient.invalidateQueries({ queryKey: ['sample'] })
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  const movable = (s: SampleListItem) => canWrite && s.status !== 'reviewed'
  const canDrop = (to: SampleStatus) => canWrite && (to === 'planned' || to === 'fired')

  function onDrop(e: DragEvent, to: SampleStatus) {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    const s = items.find((x) => x.id === id)
    if (s && movable(s) && canDrop(to) && s.status !== to) move.mutate({ id, status: to })
  }

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
      {COLS.map((col) => {
        const list = items.filter((s) => s.status === col.status)
        return (
          <section
            key={col.status}
            onDragOver={(e) => {
              if (canDrop(col.status)) {
                e.preventDefault()
                setOver(col.status)
              }
            }}
            onDragLeave={() => setOver((o) => (o === col.status ? null : o))}
            onDrop={(e) => onDrop(e, col.status)}
            className={`min-w-[84%] snap-center rounded-2xl border border-dashed p-2.5 transition-colors sm:min-w-[60%] lg:min-w-0 ${
              over === col.status ? 'border-gold bg-brand-50' : 'border-line bg-tint'
            }`}
          >
            <header className="mb-2 flex items-center gap-2 px-1">
              <Icon name={col.icon} size={16} className="text-mute" />
              <h3 className="text-sm font-extrabold">{col.label}</h3>
              <span className="badge bg-surface text-mute">{list.length}</span>
              <span className="ms-auto text-[11px] text-faint">{col.hint}</span>
            </header>
            <div className="space-y-2">
              {list.length === 0 && <div className="py-6 text-center text-xs text-faint">فاضي</div>}
              {list.map((s) => {
                const tone = sampleTone(s)
                const code = finalCodeOf(s)
                return (
                  <article
                    key={s.id}
                    draggable={movable(s)}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', s.id)}
                    className="relative overflow-hidden rounded-xl border border-line bg-surface p-3 ps-4 shadow-sm"
                  >
                    <span className={`absolute inset-y-0 start-0 w-1 ${tone.bar}`} aria-hidden="true" />
                    <Link to={`/samples/${s.id}`} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <span dir="ltr" className="truncate text-start text-sm font-extrabold">
                          {s.code}
                        </span>
                        {code && (
                          <span dir="ltr" className={`badge ${resultBadgeClass(code)}`}>
                            {code}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-mute">
                        {s.recipe?.name ?? 'بدون تركيبة'}
                        {s.firing_temp ? ` · ${s.firing_temp}°م` : ''}
                      </div>
                    </Link>
                    {movable(s) && (
                      <div className="mt-2 flex gap-2 border-t border-line pt-2">
                        {s.status === 'planned' ? (
                          <button
                            type="button"
                            disabled={move.isPending}
                            onClick={() => move.mutate({ id: s.id, status: 'fired' })}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 disabled:opacity-50"
                          >
                            <Icon name="flame" size={13} />
                            اتحرقت
                          </button>
                        ) : (
                          <>
                            <Link
                              to={`/samples/${s.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"
                            >
                              <Icon name="checkCircle" size={13} />
                              قيّم
                            </Link>
                            <button
                              type="button"
                              disabled={move.isPending}
                              onClick={() => move.mutate({ id: s.id, status: 'planned' })}
                              className="inline-flex items-center gap-1 rounded-lg bg-tint px-2.5 py-1 text-xs font-bold text-mute disabled:opacity-50"
                            >
                              رجوع لمخططة
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
