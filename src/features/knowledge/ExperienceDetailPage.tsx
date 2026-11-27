import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { ErrorBox, PageTitle, Spinner } from '../../components/ui'
import {
  CONFIDENCE_AR, getExperience, isApprover, linkByCode, removeLink, STATUS_AR, transitionExperience,
  updateExperience, type ExperienceStatus,
} from './api'

const FIELDS = [
  ['summary', 'ملخص الخبرة'],
  ['scope_note', 'النطاق (جسم/جليز/حرارة/ظروف التطبيق)'],
  ['limitations', 'القيود وحدود الصلاحية'],
  ['evidence', 'الأدلة (نتائج، تكرارات، قياسات)'],
] as const

const ACTION_AR: Record<string, string> = {
  created: 'تسجيل', edited: 'تعديل', status_change: 'تغيير حالة', approved: 'اعتماد', rejected: 'رفض',
  returned: 'إعادة للمراجعة', approval_withdrawn_on_edit: 'سحب الاعتماد بعد تعديل',
}

export default function ExperienceDetailPage() {
  const { id = '' } = useParams()
  const { canWrite } = useAuth()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['kb-exp', id], queryFn: () => getExperience(id) })
  const approver = useQuery({ queryKey: ['kb-is-approver'], queryFn: isApprover })
  const [form, setForm] = useState({ title: '', summary: '', scope_note: '', limitations: '', evidence: '' })
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (q.data) {
      const e = q.data.experience
      setForm({ title: e.title, summary: e.summary, scope_note: e.scope_note, limitations: e.limitations, evidence: e.evidence })
    }
  }, [q.data])

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['kb-exp', id] }); void qc.invalidateQueries({ queryKey: ['kb-exps'] }) }
  const save = useMutation({ mutationFn: () => updateExperience(id, form), onSuccess: refresh })
  const move = useMutation({ mutationFn: (to: ExperienceStatus) => transitionExperience(id, to, note), onSuccess: () => { setNote(''); refresh() } })
  const link = useMutation({ mutationFn: () => linkByCode(id, code), onSuccess: () => { setCode(''); refresh() } })
  const unlink = useMutation({ mutationFn: (lid: string) => removeLink(lid), onSuccess: refresh })

  if (q.isLoading) return <Spinner />
  if (q.error || !q.data) return <ErrorBox error={q.error ?? new Error('غير موجودة')} />
  const { experience: e, links, reviews, confidence } = q.data
  const editable = canWrite && e.status !== 'pending'
  const err = save.error ?? move.error ?? link.error ?? unlink.error

  const writerNext: Record<string, [ExperienceStatus, string][]> = {
    draft: [['analysis', 'بدء التحليل']],
    analysis: [['pending', 'إرسال لصاحب الاعتماد'], ['draft', 'رجوع لمسودة']],
    returned: [['analysis', 'استئناف التحليل']],
    rejected: [['draft', 'فتح كمسودة جديدة']],
    pending: [['analysis', 'سحب من الاعتماد']],
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageTitle icon="shield" title={`${e.code}: ${e.title}`} subtitle={`الحالة: ${STATUS_AR[e.status]} — الثقة: ${CONFIDENCE_AR[confidence]}`} />
      {e.status !== 'approved' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          غير معتمدة: تُعرض كفرضية/تجربة وليست خبرة مصنع مؤكدة.
        </div>
      )}
      {e.review_note && <div className="card text-xs">ملاحظة المراجعة: {e.review_note}</div>}

      <div className="card space-y-2">
        <input className="input font-bold" value={form.title} disabled={!editable} onChange={(x) => setForm({ ...form, title: x.target.value })} />
        {FIELDS.map(([k, label]) => (
          <label key={k} className="block text-xs font-bold text-faint">{label}
            <textarea className="input mt-1 min-h-[4.5rem] text-sm font-normal text-ink" value={form[k]} disabled={!editable}
              onChange={(x) => setForm({ ...form, [k]: x.target.value })} />
          </label>
        ))}
        {editable && <button className="btn-primary" disabled={save.isPending || !form.title.trim()} onClick={() => save.mutate()}>حفظ</button>}
        {e.status === 'approved' && canWrite && <p className="text-[11px] text-faint">تعديل المحتوى بعد الاعتماد يسحب الاعتماد ويعيدها لانتظار صاحب الاعتماد.</p>}
      </div>

      <div className="card space-y-2">
        <div className="text-sm font-bold">التجارب المرتبطة (أدلة)</div>
        {links.length === 0 && <p className="text-xs text-faint">لم تُربط بأي عينة أو تركيبة بعد.</p>}
        {links.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-sm">
            <Link className="font-bold text-brand-700" to={l.sample_id ? `/samples/${l.sample_id}` : l.recipe_id ? `/recipes/${l.recipe_id}` : '#'}>
              {l.link_type === 'sample' ? 'عينة' : 'تركيبة'} {l.ref_label}
            </Link>
            {editable && <button className="text-xs text-red-700" onClick={() => unlink.mutate(l.id)}>إزالة</button>}
          </div>
        ))}
        {editable && (
          <div className="flex gap-2">
            <input className="input" placeholder="كود عينة (MAS-2026-0001) أو تركيبة" value={code} onChange={(x) => setCode(x.target.value)} />
            <button className="btn-secondary shrink-0" disabled={!code.trim() || link.isPending} onClick={() => link.mutate()}>ربط</button>
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <div className="text-sm font-bold">دورة الاعتماد</div>
        <input className="input" placeholder="ملاحظة (إلزامية عند الرفض أو الإعادة)" value={note} onChange={(x) => setNote(x.target.value)} />
        <div className="flex flex-wrap gap-2">
          {canWrite && (writerNext[e.status] ?? []).map(([to, label]) => (
            <button key={to} className="btn-secondary" disabled={move.isPending} onClick={() => move.mutate(to)}>{label}</button>
          ))}
          {e.status === 'pending' && approver.data && (<>
            <button className="btn-primary" disabled={move.isPending} onClick={() => move.mutate('approved')}>اعتماد</button>
            <button className="btn-secondary" disabled={move.isPending} onClick={() => move.mutate('returned')}>إعادة للمراجعة</button>
            <button className="btn-danger" disabled={move.isPending} onClick={() => move.mutate('rejected')}>رفض</button>
          </>)}
        </div>
        {e.status === 'pending' && !approver.data && <p className="text-xs text-faint">بانتظار قرار صاحب الاعتماد.</p>}
        {err && <ErrorBox error={err} />}
      </div>

      <div className="card space-y-1">
        <div className="text-sm font-bold">سجل الاعتماد والتعديلات</div>
        {reviews.map((r) => (
          <div key={r.id} className="text-xs text-faint">
            {new Date(r.created_at).toLocaleString('ar-EG')} — {ACTION_AR[r.action] ?? r.action}
            {r.to_status ? ` → ${STATUS_AR[r.to_status as ExperienceStatus] ?? r.to_status}` : ''}{r.note ? ` — ${r.note}` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
