import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { Empty, ErrorBox, PageTitle, Spinner } from '../../components/ui'
import { approverNames, createExperience, listExperiences, STATUS_AR } from './api'

const STATUS_CLS: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-700', returned: 'bg-orange-100 text-orange-800',
}

export default function ExperiencesPage() {
  const { canWrite } = useAuth()
  const nav = useNavigate()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const list = useQuery({ queryKey: ['kb-exps'], queryFn: listExperiences })
  const approvers = useQuery({ queryKey: ['kb-approvers'], queryFn: approverNames })
  const create = useMutation({
    mutationFn: () => createExperience({ title: title.trim(), summary: '', scope_note: '', limitations: '', evidence: '' }),
    onSuccess: (id) => { void qc.invalidateQueries({ queryKey: ['kb-exps'] }); nav(`/knowledge/experiences/${id}`) },
  })
  function onSubmit(e: FormEvent) { e.preventDefault(); if (title.trim()) create.mutate() }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageTitle icon="shield" title="الخبرات المعتمدة" subtitle="لا تُعتمد أي خبرة تلقائيًا" />
      <div className="card text-xs text-faint">
        صاحب الاعتماد: {approvers.data?.length ? approvers.data.join('، ') : 'لم يُعيَّن بعد (لا يمكن اعتماد أي خبرة حاليًا)'}
      </div>
      {canWrite && (
        <form onSubmit={onSubmit} className="flex gap-2">
          <input className="input" placeholder="عنوان خبرة جديدة (مسودة)…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          <button className="btn-primary shrink-0" disabled={!title.trim() || create.isPending}>إضافة</button>
        </form>
      )}
      {create.error && <ErrorBox error={create.error} />}
      {list.isLoading && <Spinner compact />}
      {list.error && <ErrorBox error={list.error} />}
      {list.data?.length === 0 && <Empty text="لا توجد خبرات بعد" icon="shield" />}
      <div className="space-y-2">
        {list.data?.map((x) => (
          <Link key={x.id} to={`/knowledge/experiences/${x.id}`} className="card block space-y-1 active:bg-page">
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="text-faint">{x.code}</span>
              <span className={`rounded-full px-2 py-0.5 ${STATUS_CLS[x.status] ?? 'bg-tint text-ink'}`}>{STATUS_AR[x.status]}</span>
            </div>
            <div className="text-sm font-bold">{x.title}</div>
            {x.summary && <p className="line-clamp-2 text-xs text-faint">{x.summary}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
