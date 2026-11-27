import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { kbStats, listCategories, listChapters } from './api'
import KnowledgeSearch from './KnowledgeSearch'

const DEFECT_CHIPS = [
  { label: 'Pinholes', q: 'ثقوب الدبوس' },
  { label: 'Crawling', q: 'Crawling' },
  { label: 'Crazing', q: 'Crazing' },
  { label: 'Blistering', q: 'Blistering' },
]

function Stat({ n, label }: { n: number | undefined; label: string }) {
  return (
    <div className="rounded-xl bg-surface/80 px-2 py-2.5 text-center">
      <div className="text-lg font-bold text-brand-800" dir="ltr">{n ?? '…'}</div>
      <div className="text-[11px] text-faint">{label}</div>
    </div>
  )
}

export default function KnowledgePage() {
  const [params] = useSearchParams()
  const [open, setOpen] = useState<number | null>(null)
  const cats = useQuery({ queryKey: ['kb-cats'], queryFn: listCategories })
  const chapters = useQuery({ queryKey: ['kb-chapters'], queryFn: listChapters })
  const stats = useQuery({ queryKey: ['kb-stats'], queryFn: kbStats })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle icon="layers" title="المعرفة" subtitle="الموسوعة العلمية وتجارب المصنع والخبرات المعتمدة" />

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-line bg-tint p-2">
        <Stat n={stats.data?.chapters} label="فصل" />
        <Stat n={stats.data?.chunks} label="مقطع" />
        <Stat n={stats.data?.terms} label="مصطلح" />
        <Stat n={stats.data?.approved} label="خبرة معتمدة" />
      </div>

      <KnowledgeSearch initialQuery={params.get('q') ?? ''} />

      <div className="grid grid-cols-2 gap-2">
        <Link to="/knowledge/experiences" className="card flex items-center gap-2 text-sm font-bold text-brand-700 active:bg-page">
          <Icon name="shield" size={18} /> الخبرات المعتمدة
        </Link>
        <Link to="/samples" className="card flex items-center gap-2 text-sm font-bold text-brand-700 active:bg-page">
          <Icon name="vase" size={18} /> تجارب المختبر
        </Link>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-bold text-faint">عيوب الجليز الشائعة</div>
        <div className="flex flex-wrap gap-1.5">
          {DEFECT_CHIPS.map((d) => (
            <Link key={d.label} to={`/assistant?q=${encodeURIComponent(d.q)}`} className="chip">{d.label}</Link>
          ))}
        </div>
      </div>

      <h2 className="pt-1 text-sm font-bold text-ink">تصفح أبواب الموسوعة</h2>
      {(cats.isLoading || chapters.isLoading) && <Spinner compact />}
      {(cats.error || chapters.error) && <ErrorBox error={cats.error ?? chapters.error} />}
      <div className="space-y-2">
        {cats.data?.map((c) => {
          const list = (chapters.data ?? []).filter((x) => x.category_id === c.id)
          const isOpen = open === c.id
          return (
            <div key={c.id} className="card !p-0 overflow-hidden">
              <button type="button" aria-expanded={isOpen}
                className="flex w-full items-center gap-3 p-3 text-start" onClick={() => setOpen(isOpen ? null : c.id)}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-700 text-xs font-bold text-white">{c.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{c.name_ar}</span>
                  {c.name_en && <span className="block text-[11px] text-faint" dir="ltr">{c.name_en}</span>}
                </span>
                <span className="text-xs text-faint">{list.length}</span>
              </button>
              {isOpen && (
                <ul className="divide-y divide-line border-t border-line bg-surface">
                  {list.length === 0 && <li className="p-3 text-xs text-faint">لا توجد فصول في هذا الباب بعد.</li>}
                  {list.map((ch) => (
                    <li key={ch.id}>
                      <Link to={`/knowledge/chapter/${ch.id}`} className="block p-3 text-sm active:bg-page">
                        {ch.chapter_no ? `الفصل ${ch.chapter_no}: ` : ''}{ch.title}
                        <span className="block text-[11px] text-faint">{ch.lab_kb_documents?.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
