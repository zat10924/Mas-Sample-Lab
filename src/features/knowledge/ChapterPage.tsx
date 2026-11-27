import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { getChapter, type KbChunk } from './api'

function Table({ md }: { md: string }) {
  const rows = md.split('\n').filter((l, i) => i !== 1).map((l) => l.replace(/^\||\|$/g, '').split(' | ').map((c) => c.trim()))
  const [head, ...body] = rows
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[28rem] text-start text-xs">
        <thead className="bg-tint"><tr>{head.map((h, i) => <th key={i} className="p-2 text-start font-bold">{h}</th>)}</tr></thead>
        <tbody>{body.map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="p-2 align-top">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function Chunk({ c, prevHeading }: { c: KbChunk; prevHeading: string | null }) {
  const sec = c.heading_path?.split(' › ')[1] ?? null
  return (
    <div className="space-y-1">
      {sec && sec !== prevHeading && <h3 className="pt-2 text-sm font-bold text-brand-700">{sec}</h3>}
      {c.kind === 'table' ? <Table md={c.content} /> : <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{c.content}</p>}
    </div>
  )
}

export default function ChapterPage() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['kb-chapter', id], queryFn: () => getChapter(id) })
  if (q.isLoading) return <Spinner />
  if (q.error || !q.data) return <ErrorBox error={q.error ?? new Error('الفصل غير موجود')} />
  const { chapter, chunks } = q.data
  const doc = chapter.lab_kb_documents
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageTitle icon="layers" title={`${chapter.chapter_no ? `الفصل ${chapter.chapter_no}: ` : ''}${chapter.title}`}
        subtitle={chapter.lab_kb_categories?.name_ar ?? undefined} />
      <div className="card text-xs text-faint">
        المصدر: {doc ? `${doc.title} — الإصدار ${doc.edition} — الملف ${doc.file_name}` : '—'}.
        هذه معلومات منشورة من الموسوعة (مرجعية) وليست نتيجة تجربة داخل المصنع.
      </div>
      <div className="space-y-3">
        {chunks.map((c, i) => <Chunk key={c.id} c={c} prevHeading={i > 0 ? chunks[i - 1].heading_path?.split(' › ')[1] ?? null : null} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`/assistant?q=${encodeURIComponent(chapter.title)}`} className="btn-secondary">
          اسأل المساعد عن هذا الفصل
        </Link>
        <Link to="/knowledge" className="btn-secondary">رجوع إلى المعرفة</Link>
      </div>
    </div>
  )
}
